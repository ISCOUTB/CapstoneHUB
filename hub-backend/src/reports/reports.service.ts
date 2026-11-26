import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReportContentKind,
  ReportStatus,
} from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import {
  assertProjectExists,
  assertReportBelongsToProject,
} from '../common/lookups';
import {
  assertFileMatchesKind,
  assertKindMatchesReportType,
  assertMimeAllowed,
  assertReportAcceptsFiles,
  normalizeTextContent,
  normalizeTitle,
  normalizeUrl,
  resolveReportConfigUpdate,
  resolveReportFileMimeType,
  sameStringSet,
  validateReportConfig,
} from './reports.rules';
import {
  StorageService,
  StoredObject,
  buildStorageKey,
} from '../storage/storage.service';
import {
  ProjectReportContentResponse,
  ProjectReportResponse,
  SelectedReport,
  mapReport,
  mapReportContent,
  reportContentSelect,
  reportSelect,
} from './reports.select';
import {
  CreateReportContentDto,
  CreateReportDto,
  ReviewReportDto,
  UpdateReportContentDto,
  UpdateReportDto,
} from './reports.dto';
import { unlink } from 'node:fs/promises';

export type { ProjectReportResponse } from './reports.select';

export type ReportContentStream = {
  content: ProjectReportContentResponse;
  stream: StoredObject['stream'];
  contentLength?: number;
  contentRange?: string;
  fileName: string;
  mimeType: string;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
    private readonly storage: StorageService,
  ) {}

  async reportsByProject(
    projectId: number,
    user: AuthenticatedUser,
  ): Promise<ProjectReportResponse[]> {
    await this.assertProjectAccess(projectId, user);

    const canViewDraftContents = await this.authorization.canSubmitReports(
      user,
      projectId,
    );
    const reports = await this.prisma.projectReport.findMany({
      where: { projectId },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      select: reportSelect,
    });

    return reports.map((report) => mapReport(report, canViewDraftContents));
  }

  async createReport(params: {
    projectId: number;
    data: CreateReportDto;
    user: AuthenticatedUser;
  }): Promise<ProjectReportResponse> {
    const { projectId, data, user } = params;
    await this.assertCanManageReports(projectId, user);

    const config = validateReportConfig(
      data.type,
      data.allowedMimeTypes,
      data.maxFiles,
    );

    const report = await this.prisma.projectReport.create({
      data: {
        projectId,
        createdByUserId: user.id,
        title: normalizeTitle(data.title),
        description: data.description?.trim() || null,
        dueDate: data.dueDate,
        type: data.type,
        allowedMimeTypes: config.allowedMimeTypes,
        maxFiles: config.maxFiles,
      },
      select: reportSelect,
    });

    return this.mapReportForViewer(report, user, projectId);
  }

  async updateReport(params: {
    projectId: number;
    reportId: number;
    data: UpdateReportDto;
    user: AuthenticatedUser;
  }): Promise<ProjectReportResponse> {
    const { projectId, reportId, data, user } = params;
    const existing = await this.assertManageableReport(
      projectId,
      reportId,
      user,
    );

    const updateData: Prisma.ProjectReportUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = normalizeTitle(data.title);
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    const hasConfigInput =
      data.type !== undefined ||
      data.allowedMimeTypes !== undefined ||
      data.maxFiles !== undefined;

    if (hasConfigInput) {
      const config = resolveReportConfigUpdate(existing, data);
      const configChanged =
        config.type !== existing.type ||
        config.maxFiles !== existing.maxFiles ||
        !sameStringSet(config.allowedMimeTypes, existing.allowedMimeTypes);

      if (configChanged) {
        await this.assertReportConfigIsChangeable(reportId, existing.status);
        updateData.type = config.type;
        updateData.allowedMimeTypes = config.allowedMimeTypes;
        updateData.maxFiles = config.maxFiles;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update fields provided');
    }

    const report = await this.prisma.projectReport.update({
      where: { id: reportId },
      data: updateData,
      select: reportSelect,
    });

    return this.mapReportForViewer(report, user, projectId);
  }

  async deleteReport(params: {
    projectId: number;
    reportId: number;
    user: AuthenticatedUser;
  }): Promise<ProjectReportResponse> {
    const { projectId, reportId, user } = params;
    await this.assertManageableReport(projectId, reportId, user);

    // Los adjuntos de la entrega (sueltos o asociados a contenido) sobrevivirían
    // al borrado: `ProjectAttachment.report` es `SetNull` y el cascade no elimina
    // los objetos de S3. Se capturan y se borran junto con sus objetos.
    const attachments = await this.prisma.projectAttachment.findMany({
      where: { projectId, reportId },
      select: { id: true, storageKey: true },
    });

    const report = await this.prisma.$transaction(async (transaction) => {
      if (attachments.length > 0) {
        await transaction.projectAttachment.deleteMany({
          where: { id: { in: attachments.map((attachment) => attachment.id) } },
        });
      }

      return transaction.projectReport.delete({
        where: { id: reportId },
        select: reportSelect,
      });
    });

    await Promise.all(
      attachments.map((attachment) => this.safeDelete(attachment.storageKey)),
    );

    return this.mapReportForViewer(report, user, projectId);
  }

  async submitReport(params: {
    projectId: number;
    reportId: number;
    user: AuthenticatedUser;
  }): Promise<ProjectReportResponse> {
    const { projectId, reportId, user } = params;
    await this.assertCanSubmitReports(projectId, user);
    const existing = await assertReportBelongsToProject(
      this.prisma,
      projectId,
      reportId,
    );

    if (
      existing.status === ReportStatus.submitted ||
      existing.status === ReportStatus.accepted
    ) {
      throw new ConflictException('Report has already been submitted');
    }

    const contentCount = await this.prisma.projectReportContent.count({
      where: { reportId },
    });

    if (contentCount === 0) {
      throw new BadRequestException('Report has no content to submit');
    }

    const report = await this.prisma.projectReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.submitted,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedByUserId: null,
        reviewComment: null,
      },
      select: reportSelect,
    });

    return this.mapReportForViewer(report, user, projectId);
  }

  async reviewReport(params: {
    projectId: number;
    reportId: number;
    data: ReviewReportDto;
    user: AuthenticatedUser;
  }): Promise<ProjectReportResponse> {
    const { projectId, reportId, data, user } = params;
    const existing = await this.assertManageableReport(
      projectId,
      reportId,
      user,
    );

    if (existing.status !== ReportStatus.submitted) {
      throw new ConflictException('Only submitted reports can be reviewed');
    }

    const report = await this.prisma.projectReport.update({
      where: { id: reportId },
      data: {
        status: data.decision,
        reviewedAt: new Date(),
        reviewedByUserId: user.id,
        reviewComment: data.comment?.trim() || null,
      },
      select: reportSelect,
    });

    return this.mapReportForViewer(report, user, projectId);
  }

  async createContent(params: {
    projectId: number;
    reportId: number;
    data: CreateReportContentDto;
    user: AuthenticatedUser;
  }): Promise<ProjectReportContentResponse> {
    const { projectId, reportId, data, user } = params;
    const report = await this.assertContentMutationAllowed(
      projectId,
      reportId,
      user,
    );
    assertKindMatchesReportType(data.kind, report.type);

    if (data.kind === ReportContentKind.text) {
      return this.createTextContent({
        reportId,
        textContent: data.textContent,
        user,
      });
    }

    return this.createLinkContent({
      reportId,
      url: data.url,
      label: data.label,
      user,
    });
  }

  async uploadFileContent(params: {
    projectId: number;
    reportId: number;
    file: Express.Multer.File;
    user: AuthenticatedUser;
  }): Promise<ProjectReportContentResponse> {
    const { projectId, reportId, file, user } = params;

    try {
      const report = await this.assertContentMutationAllowed(
        projectId,
        reportId,
        user,
      );
      const mimeType = resolveReportFileMimeType(
        file.mimetype,
        file.originalname,
      );

      assertReportAcceptsFiles(report.type);
      assertMimeAllowed(mimeType, report.allowedMimeTypes);
      assertFileMatchesKind({
        mimeType,
        sizeBytes: file.size,
      });
      await this.assertWithinMaxFiles(reportId, report.type, report.maxFiles);

      const storageKey = buildStorageKey(projectId, file.originalname);

      await this.storage.saveFromFile({
        key: storageKey,
        filePath: file.path,
        contentType: mimeType,
        sizeBytes: file.size,
      });

      try {
        const content = await this.prisma.$transaction(
          async (transaction) => {
            // Re-verifica el tope de archivos dentro de la transacción para que
            // dos subidas concurrentes no lo excedan.
            await this.assertWithinMaxFiles(
              reportId,
              report.type,
              report.maxFiles,
              transaction,
            );

            const attachment = await transaction.projectAttachment.create({
              data: {
                projectId,
                reportId,
                uploadedByUserId: user.id,
                originalName: file.originalname,
                storageKey,
                mimeType,
                sizeBytes: file.size,
              },
              select: { id: true },
            });

            return transaction.projectReportContent.create({
              data: {
                reportId,
                createdByUserId: user.id,
                kind: report.type,
                attachmentId: attachment.id,
              },
              select: reportContentSelect,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        return mapReportContent(content);
      } catch (error) {
        // El objeto se guardó antes de la transacción; si la fila no se crea,
        // queda huérfano y se elimina.
        await this.safeDelete(storageKey);

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          throw new ConflictException(
            'The report changed concurrently; please retry',
          );
        }

        throw error;
      }
    } finally {
      // Multer (diskStorage) deja el archivo temporal; se elimina siempre.
      await unlink(file.path).catch(() => undefined);
    }
  }

  async updateContent(params: {
    projectId: number;
    reportId: number;
    contentId: number;
    data: UpdateReportContentDto;
    user: AuthenticatedUser;
  }): Promise<ProjectReportContentResponse> {
    const { projectId, reportId, contentId, data, user } = params;
    await this.assertContentMutationAllowed(projectId, reportId, user);
    const existing = await this.findContent(projectId, reportId, contentId);

    if (
      existing.kind !== ReportContentKind.text &&
      existing.kind !== ReportContentKind.link
    ) {
      throw new BadRequestException('Only text and link content can be edited');
    }

    const updateData: Prisma.ProjectReportContentUpdateInput = {};

    if (existing.kind === ReportContentKind.text) {
      if (data.textContent === undefined) {
        throw new BadRequestException('No update fields provided');
      }

      updateData.textContent = normalizeTextContent(data.textContent);
    } else {
      if (data.url === undefined && data.label === undefined) {
        throw new BadRequestException('No update fields provided');
      }

      if (data.url !== undefined) {
        updateData.url = normalizeUrl(data.url);
      }

      if (data.label !== undefined) {
        updateData.label = data.label.trim() || null;
      }
    }

    const content = await this.prisma.projectReportContent.update({
      where: { id: contentId },
      data: updateData,
      select: reportContentSelect,
    });

    return mapReportContent(content);
  }

  async deleteContent(params: {
    projectId: number;
    reportId: number;
    contentId: number;
    user: AuthenticatedUser;
  }): Promise<{ id: number }> {
    const { projectId, reportId, contentId, user } = params;
    await this.assertContentMutationAllowed(projectId, reportId, user);
    const existing = await this.findContent(projectId, reportId, contentId);

    await this.prisma.projectReportContent.delete({
      where: { id: contentId },
    });

    if (existing.attachmentId !== null) {
      await this.removeAttachment(projectId, existing.attachmentId);
    }

    return { id: contentId };
  }

  async openContentStream(params: {
    projectId: number;
    reportId: number;
    contentId: number;
    range?: string;
    user: AuthenticatedUser;
  }): Promise<ReportContentStream> {
    const { projectId, reportId, contentId, range, user } = params;
    await this.assertProjectAccess(projectId, user);

    const content = await this.prisma.projectReportContent.findFirst({
      where: { id: contentId, reportId, report: { projectId } },
      select: {
        ...reportContentSelect,
        report: { select: { status: true } },
      },
    });

    if (!content) {
      throw new NotFoundException(
        `Content ${contentId} not found in report ${reportId}`,
      );
    }

    await this.authorization.assertCanViewReportContents(
      user,
      projectId,
      content.report,
    );

    if (!content.attachment) {
      throw new BadRequestException('Content has no file to stream');
    }

    try {
      const stored = await this.storage.read(
        content.attachment.storageKey,
        range,
      );

      return {
        content: mapReportContent(content),
        stream: stored.stream,
        contentLength: stored.contentLength,
        contentRange: stored.contentRange,
        fileName: content.attachment.originalName,
        mimeType: content.attachment.mimeType,
      };
    } catch (error) {
      if ((error as { name?: string }).name === 'InvalidRange') {
        throw new HttpException(
          'Requested range not satisfiable',
          HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
        );
      }

      throw error;
    }
  }

  private async createTextContent(params: {
    reportId: number;
    textContent: string | undefined;
    user: AuthenticatedUser;
  }): Promise<ProjectReportContentResponse> {
    const { reportId, textContent, user } = params;
    const normalized = normalizeTextContent(textContent);

    const content = await this.prisma.projectReportContent.create({
      data: {
        reportId,
        createdByUserId: user.id,
        kind: ReportContentKind.text,
        textContent: normalized,
      },
      select: reportContentSelect,
    });

    return mapReportContent(content);
  }

  private async createLinkContent(params: {
    reportId: number;
    url: string | undefined;
    label: string | undefined;
    user: AuthenticatedUser;
  }): Promise<ProjectReportContentResponse> {
    const { reportId, url, label, user } = params;

    const content = await this.prisma.projectReportContent.create({
      data: {
        reportId,
        createdByUserId: user.id,
        kind: ReportContentKind.link,
        url: normalizeUrl(url),
        label: label?.trim() || null,
      },
      select: reportContentSelect,
    });

    return mapReportContent(content);
  }

  private async findContent(
    projectId: number,
    reportId: number,
    contentId: number,
  ): Promise<{
    id: number;
    kind: ReportContentKind;
    attachmentId: number | null;
    createdByUserId: number | null;
  }> {
    const content = await this.prisma.projectReportContent.findFirst({
      where: { id: contentId, reportId, report: { projectId } },
      select: {
        id: true,
        kind: true,
        attachmentId: true,
        createdByUserId: true,
      },
    });

    if (!content) {
      throw new NotFoundException(
        `Content ${contentId} not found in report ${reportId}`,
      );
    }

    return content;
  }

  /**
   * Borra el adjunto y su objeto en almacenamiento. La autorización ya se
   * validó en el flujo de contenido, así que no se reutiliza el servicio de
   * anexos (que aplica permisos distintos).
   */
  private async removeAttachment(
    projectId: number,
    attachmentId: number,
  ): Promise<void> {
    const attachment = await this.prisma.projectAttachment.findFirst({
      where: { id: attachmentId, projectId },
      select: { storageKey: true },
    });

    if (!attachment) {
      return;
    }

    try {
      await this.prisma.projectAttachment.delete({
        where: { id: attachmentId },
      });
    } catch {
      // Si la fila ya no existe se ignora; el contenido ya quedó eliminado.
    }

    await this.safeDelete(attachment.storageKey);
  }

  private async safeDelete(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch {
      // El objeto puede no existir; no se revierte la operación.
    }
  }

  private async assertContentMutationAllowed(
    projectId: number,
    reportId: number,
    user: AuthenticatedUser,
  ): Promise<{
    id: number;
    status: ReportStatus;
    type: ReportContentKind;
    allowedMimeTypes: string[];
    maxFiles: number | null;
  }> {
    await this.assertCanSubmitReports(projectId, user);
    const report = await assertReportBelongsToProject(
      this.prisma,
      projectId,
      reportId,
    );

    if (
      report.status !== ReportStatus.pending &&
      report.status !== ReportStatus.rejected
    ) {
      throw new ConflictException('Report is not editable');
    }

    return report;
  }

  private async assertWithinMaxFiles(
    reportId: number,
    type: ReportContentKind,
    maxFiles: number | null,
    client: Pick<PrismaService, 'projectReportContent'> = this.prisma,
  ): Promise<void> {
    if (maxFiles === null) {
      return;
    }

    const fileCount = await client.projectReportContent.count({
      where: { reportId, kind: type },
    });

    if (fileCount >= maxFiles) {
      throw new ConflictException(
        `This report already has the maximum of ${maxFiles} file(s)`,
      );
    }
  }

  private async assertReportConfigIsChangeable(
    reportId: number,
    status: ReportStatus,
  ): Promise<void> {
    if (status !== ReportStatus.pending) {
      throw new ConflictException(
        'Only pending reports can change their configuration',
      );
    }

    const contentCount = await this.prisma.projectReportContent.count({
      where: { reportId },
    });

    if (contentCount > 0) {
      throw new ConflictException(
        'Cannot change the configuration of a report that already has content',
      );
    }
  }

  private async mapReportForViewer(
    report: SelectedReport,
    user: AuthenticatedUser,
    projectId: number,
  ): Promise<ProjectReportResponse> {
    const canViewDraftContents = await this.authorization.canSubmitReports(
      user,
      projectId,
    );

    return mapReport(report, canViewDraftContents);
  }

  private async assertProjectAccess(
    projectId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertProjectMember(user, projectId);
  }

  private async assertCanSubmitReports(
    projectId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertCanSubmitReports(user, projectId);
  }

  private async assertCanManageReports(
    projectId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertCanManageReports(user, projectId);
  }

  private async assertManageableReport(
    projectId: number,
    reportId: number,
    user: AuthenticatedUser,
  ): Promise<{
    id: number;
    status: ReportStatus;
    type: ReportContentKind;
    allowedMimeTypes: string[];
    maxFiles: number | null;
  }> {
    await this.assertCanManageReports(projectId, user);

    return assertReportBelongsToProject(this.prisma, projectId, reportId);
  }
}
