import { Readable } from 'node:stream';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import {
  StorageService,
  buildGuideStorageKey,
} from '../storage/storage.service';
import { CreateGuideDocumentDto, UpdateGuideDocumentDto } from './guides.dto';
import {
  GuideDocumentResponse,
  guideDocumentSelect,
  mapGuideDocument,
} from './guides.select';

export type DownloadedGuideDocument = {
  document: GuideDocumentResponse;
  stream: Readable;
};

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function uniqueAudiences(audiences: UserRole[] | undefined): UserRole[] {
  return [...new Set(audiences ?? [])];
}

@Injectable()
export class GuidesService {
  private readonly logger = new Logger(GuidesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listPublished(): Promise<GuideDocumentResponse[]> {
    const documents = await this.prisma.guideDocument.findMany({
      where: { isPublished: true },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
      select: guideDocumentSelect,
    });

    return documents.map(mapGuideDocument);
  }

  async listAll(user: AuthenticatedUser): Promise<GuideDocumentResponse[]> {
    this.authorization.assertCanManageGuides(user);

    const documents = await this.prisma.guideDocument.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
      select: guideDocumentSelect,
    });

    return documents.map(mapGuideDocument);
  }

  async findPublished(id: number): Promise<GuideDocumentResponse> {
    const document = await this.prisma.guideDocument.findFirst({
      where: { id, isPublished: true },
      select: guideDocumentSelect,
    });

    if (!document) {
      throw new NotFoundException(`Guide document ${id} not found`);
    }

    return mapGuideDocument(document);
  }

  async findForAdmin(
    user: AuthenticatedUser,
    id: number,
  ): Promise<GuideDocumentResponse> {
    this.authorization.assertCanManageGuides(user);

    const document = await this.prisma.guideDocument.findUnique({
      where: { id },
      select: guideDocumentSelect,
    });

    if (!document) {
      throw new NotFoundException(`Guide document ${id} not found`);
    }

    return mapGuideDocument(document);
  }

  async create(
    user: AuthenticatedUser,
    data: CreateGuideDocumentDto,
  ): Promise<GuideDocumentResponse> {
    this.authorization.assertCanManageGuides(user);

    const title = data.title.trim();
    if (!title) {
      throw new BadRequestException('Guide document title is required');
    }

    const document = await this.prisma.guideDocument.create({
      data: {
        title,
        description: normalizeOptional(data.description),
        category: data.category,
        audiences: uniqueAudiences(data.audiences),
        externalUrl: normalizeOptional(data.externalUrl),
        isPublished: data.isPublished ?? true,
        uploadedByUserId: user.id,
      },
      select: guideDocumentSelect,
    });

    return mapGuideDocument(document);
  }

  async update(
    user: AuthenticatedUser,
    id: number,
    data: UpdateGuideDocumentDto,
  ): Promise<GuideDocumentResponse> {
    this.authorization.assertCanManageGuides(user);

    const current = await this.prisma.guideDocument.findUnique({
      where: { id },
      select: { id: true, storageKey: true },
    });

    if (!current) {
      throw new NotFoundException(`Guide document ${id} not found`);
    }

    const updateData: Prisma.GuideDocumentUpdateInput = {};

    if (data.title !== undefined) {
      const title = data.title.trim();
      if (!title) {
        throw new BadRequestException('Guide document title is required');
      }
      updateData.title = title;
    }

    if (data.description !== undefined) {
      updateData.description = normalizeOptional(data.description);
    }

    if (data.category !== undefined) {
      updateData.category = data.category;
    }

    if (data.audiences !== undefined) {
      updateData.audiences = uniqueAudiences(data.audiences);
    }

    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
    }

    if (data.externalUrl !== undefined) {
      const externalUrl = normalizeOptional(data.externalUrl);

      if (externalUrl && current.storageKey) {
        throw new ConflictException(
          'Remove the attached file before adding an external link',
        );
      }

      updateData.externalUrl = externalUrl;
    }

    const document = await this.prisma.guideDocument.update({
      where: { id },
      data: updateData,
      select: guideDocumentSelect,
    });

    return mapGuideDocument(document);
  }

  async remove(user: AuthenticatedUser, id: number): Promise<void> {
    this.authorization.assertCanManageGuides(user);

    const document = await this.prisma.guideDocument.findUnique({
      where: { id },
      select: { id: true, storageKey: true },
    });

    if (!document) {
      throw new NotFoundException(`Guide document ${id} not found`);
    }

    await this.prisma.guideDocument.delete({ where: { id } });

    if (document.storageKey) {
      await this.deleteStoredFile(document.storageKey);
    }
  }

  async uploadFile(
    user: AuthenticatedUser,
    id: number,
    file: Express.Multer.File,
  ): Promise<GuideDocumentResponse> {
    this.authorization.assertCanManageGuides(user);

    const current = await this.prisma.guideDocument.findUnique({
      where: { id },
      select: { id: true, storageKey: true },
    });

    if (!current) {
      throw new NotFoundException(`Guide document ${id} not found`);
    }

    const storageKey = buildGuideStorageKey(file.originalname);

    await this.storage.save({
      key: storageKey,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    try {
      const document = await this.prisma.guideDocument.update({
        where: { id },
        data: {
          storageKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          externalUrl: null,
          uploadedByUserId: user.id,
        },
        select: guideDocumentSelect,
      });

      if (current.storageKey && current.storageKey !== storageKey) {
        await this.deleteStoredFile(current.storageKey);
      }

      return mapGuideDocument(document);
    } catch (error) {
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async removeFile(
    user: AuthenticatedUser,
    id: number,
  ): Promise<GuideDocumentResponse> {
    this.authorization.assertCanManageGuides(user);

    const current = await this.prisma.guideDocument.findUnique({
      where: { id },
      select: { id: true, storageKey: true },
    });

    if (!current) {
      throw new NotFoundException(`Guide document ${id} not found`);
    }

    if (!current.storageKey) {
      return this.findForAdmin(user, id);
    }

    await this.deleteStoredFile(current.storageKey);

    const document = await this.prisma.guideDocument.update({
      where: { id },
      data: {
        storageKey: null,
        originalName: null,
        mimeType: null,
        sizeBytes: null,
      },
      select: guideDocumentSelect,
    });

    return mapGuideDocument(document);
  }

  async download(
    user: AuthenticatedUser | undefined,
    id: number,
  ): Promise<DownloadedGuideDocument> {
    const document = await this.prisma.guideDocument.findUnique({
      where: { id },
      select: guideDocumentSelect,
    });

    if (
      !document ||
      (!document.isPublished && !this.authorization.canManageGuides(user))
    ) {
      throw new NotFoundException(`Guide document ${id} not found`);
    }

    if (!document.storageKey) {
      throw new NotFoundException(
        `Guide document ${id} does not have an attached file`,
      );
    }

    const stored = await this.storage.read(document.storageKey);

    return { document: mapGuideDocument(document), stream: stored.stream };
  }

  private async deleteStoredFile(storageKey: string): Promise<void> {
    try {
      await this.storage.delete(storageKey);
    } catch (error) {
      // El GC de almacenamiento recoge los objetos huérfanos más tarde.
      this.logger.warn(
        `Could not delete guide file ${storageKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
