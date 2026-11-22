import { Injectable, NotFoundException } from '@nestjs/common';
import { Readable } from 'node:stream';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { StorageService, buildStorageKey } from '../storage/storage.service';
import {
  assertProjectExists,
  assertReportBelongsToProject,
} from '../common/lookups';
import {
  attachmentSelect,
  mapAttachment,
  ProjectAttachmentResponse,
} from './attachments.select';

export type DownloadedAttachment = {
  attachment: ProjectAttachmentResponse;
  stream: Readable;
};

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly authorization: AuthorizationService,
  ) {}

  async attachmentsByProject(
    projectId: number,
    user: AuthenticatedUser,
  ): Promise<ProjectAttachmentResponse[]> {
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertProjectMember(user, projectId);

    // El correo del subidor es PII: solo se expone a los miembros.
    const canViewSensitiveData = await this.authorization.canViewProject(
      user,
      projectId,
    );

    const attachments = await this.prisma.projectAttachment.findMany({
      // Los archivos de una entrega viven en la pestaña Entregas; Anexos solo
      // lista los archivos sueltos del proyecto.
      where: { projectId, reportId: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: attachmentSelect,
    });

    return attachments.map((attachment) =>
      mapAttachment(attachment, canViewSensitiveData),
    );
  }

  async createAttachment(params: {
    projectId: number;
    file: Express.Multer.File;
    reportId?: number;
    user: AuthenticatedUser;
  }): Promise<ProjectAttachmentResponse> {
    const { projectId, file, user, reportId } = params;
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertCanWriteProjectData(user, projectId);

    if (reportId !== undefined) {
      await assertReportBelongsToProject(this.prisma, projectId, reportId);
    }

    const storageKey = buildStorageKey(projectId, file.originalname);

    await this.storage.save({
      key: storageKey,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    try {
      const attachment = await this.prisma.projectAttachment.create({
        data: {
          projectId,
          reportId: reportId ?? null,
          uploadedByUserId: user.id,
          originalName: file.originalname,
          storageKey,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
        select: attachmentSelect,
      });

      return mapAttachment(attachment);
    } catch (error) {
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async downloadAttachment(params: {
    projectId: number;
    attachmentId: number;
    user: AuthenticatedUser;
  }): Promise<DownloadedAttachment> {
    const { projectId, attachmentId, user } = params;
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertProjectMember(user, projectId);

    const attachment = await this.prisma.projectAttachment.findFirst({
      where: { id: attachmentId, projectId },
      select: {
        ...attachmentSelect,
        report: { select: { status: true } },
      },
    });

    if (!attachment) {
      throw new NotFoundException(
        `Attachment ${attachmentId} not found in project ${projectId}`,
      );
    }

    if (attachment.report) {
      await this.authorization.assertCanViewReportContents(
        user,
        projectId,
        attachment.report,
      );
    }

    const stored = await this.storage.read(attachment.storageKey);

    return { attachment: mapAttachment(attachment), stream: stored.stream };
  }

  async deleteAttachment(params: {
    projectId: number;
    attachmentId: number;
    user: AuthenticatedUser;
  }): Promise<ProjectAttachmentResponse> {
    const { projectId, attachmentId, user } = params;
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertProjectMember(user, projectId);

    const attachment = await this.prisma.projectAttachment.findFirst({
      where: { id: attachmentId, projectId },
      select: attachmentSelect,
    });

    if (!attachment) {
      throw new NotFoundException(
        `Attachment ${attachmentId} not found in project ${projectId}`,
      );
    }

    if (attachment.uploadedByUserId !== user.id) {
      await this.authorization.assertCanManageProject(user, projectId);
    }

    await this.prisma.projectAttachment.delete({
      where: { id: attachment.id },
    });
    await this.storage.delete(attachment.storageKey);

    return mapAttachment(attachment);
  }
}
