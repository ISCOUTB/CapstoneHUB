import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { GuideCategory, UserRole } from '../generated/prisma/client';
import { GuidesService } from './guides.service';

const user = (roles: UserRole[]) => ({
  id: 7,
  fullName: 'Test User',
  email: 'test@example.com',
  roles,
});

const manager = user([UserRole.admin]);

function documentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Formato de prueba',
    description: null,
    category: GuideCategory.format,
    audiences: [],
    externalUrl: null,
    storageKey: null,
    originalName: null,
    mimeType: null,
    sizeBytes: null,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createService(
  overrides: {
    prisma?: Record<string, unknown>;
    storage?: Record<string, unknown>;
    authorization?: Record<string, unknown>;
  } = {},
) {
  const prisma = {
    guideDocument: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ...(overrides.prisma ?? {}),
  };
  const storage = {
    save: jest.fn().mockResolvedValue(undefined),
    read: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...(overrides.storage ?? {}),
  };
  const authorization = {
    assertCanManageGuides: jest.fn(),
    canManageGuides: jest.fn((candidate: { roles: UserRole[] } | undefined) =>
      Boolean(
        candidate &&
        (candidate.roles.includes(UserRole.admin) ||
          candidate.roles.includes(UserRole.directivo)),
      ),
    ),
    ...(overrides.authorization ?? {}),
  };

  const service = new GuidesService(
    prisma as never,
    storage as never,
    authorization as never,
  );

  return { service, prisma, storage, authorization };
}

describe('GuidesService', () => {
  it('lists only published documents for the public catalog', async () => {
    const { service, prisma } = createService();
    prisma.guideDocument.findMany.mockResolvedValue([documentRecord()]);

    const documents = await service.listPublished();

    expect(prisma.guideDocument.findMany).toHaveBeenCalledWith({
      where: { isPublished: true },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
      select: expect.any(Object) as object,
    });
    expect(documents).toHaveLength(1);
    expect(documents[0].hasFile).toBe(false);
  });

  it('requires a manager to list every document', async () => {
    const { service, prisma } = createService();
    prisma.guideDocument.findMany.mockResolvedValue([]);

    await service.listAll(manager);

    expect(prisma.guideDocument.findMany).toHaveBeenCalledWith({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
      select: expect.any(Object) as object,
    });
  });

  it('normalizes metadata and deduplicates audiences on create', async () => {
    const { service, prisma, authorization } = createService();
    prisma.guideDocument.create.mockResolvedValue(
      documentRecord({
        title: 'Formato limpio',
        description: null,
        audiences: [UserRole.student, UserRole.teacher],
      }),
    );

    const created = await service.create(manager, {
      title: '  Formato limpio  ',
      description: '   ',
      category: GuideCategory.format,
      audiences: [UserRole.student, UserRole.teacher, UserRole.student],
    });

    expect(authorization.assertCanManageGuides).toHaveBeenCalledWith(manager);
    expect(prisma.guideDocument.create).toHaveBeenCalledWith({
      data: {
        title: 'Formato limpio',
        description: null,
        category: GuideCategory.format,
        audiences: [UserRole.student, UserRole.teacher],
        externalUrl: null,
        isPublished: true,
        uploadedByUserId: manager.id,
      },
      select: expect.any(Object) as object,
    });
    expect(created.title).toBe('Formato limpio');
  });

  it('rejects an empty title when creating', async () => {
    const { service } = createService();

    await expect(
      service.create(manager, {
        title: '   ',
        category: GuideCategory.guide,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an external link while a file is attached', async () => {
    const { service, prisma } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue({
      id: 1,
      storageKey: 'guides/file.pdf',
    });

    await expect(
      service.update(manager, 1, {
        externalUrl: 'https://example.com/documento',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes the stored file when the document is removed', async () => {
    const { service, prisma, storage } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue({
      id: 1,
      storageKey: 'guides/file.pdf',
    });

    await service.remove(manager, 1);

    expect(prisma.guideDocument.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(storage.delete).toHaveBeenCalledWith('guides/file.pdf');
  });

  it('saves the new file and removes the previous one on replacement', async () => {
    const { service, prisma, storage } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue({
      id: 1,
      storageKey: 'guides/old.pdf',
    });
    prisma.guideDocument.update.mockResolvedValue(
      documentRecord({
        storageKey: 'guides/new.docx',
        originalName: 'nuevo.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 10,
      }),
    );

    const file = {
      originalname: 'nuevo.docx',
      mimetype:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 10,
      buffer: Buffer.from('doc'),
    } as Express.Multer.File;

    const updated = await service.uploadFile(manager, 1, file);

    expect(storage.save).toHaveBeenCalledWith({
      key: expect.stringMatching(/^guides\/.+\.docx$/) as string,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    expect(prisma.guideDocument.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        storageKey: expect.stringMatching(/^guides\/.+\.docx$/) as string,
        originalName: 'nuevo.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 10,
        externalUrl: null,
        uploadedByUserId: manager.id,
      },
      select: expect.any(Object) as object,
    });
    expect(storage.delete).toHaveBeenCalledWith('guides/old.pdf');
    expect(updated.hasFile).toBe(true);
  });

  it('removes the uploaded object when the database update fails', async () => {
    const { service, prisma, storage } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue({
      id: 1,
      storageKey: null,
    });
    prisma.guideDocument.update.mockRejectedValue(new Error('db down'));

    const file = {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 3,
      buffer: Buffer.from('pdf'),
    } as Express.Multer.File;

    await expect(service.uploadFile(manager, 1, file)).rejects.toThrow(
      'db down',
    );
    expect(storage.delete).toHaveBeenCalledWith(
      expect.stringMatching(/^guides\/.+\.pdf$/),
    );
  });

  it('clears the file metadata when the file is removed', async () => {
    const { service, prisma, storage } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue({
      id: 1,
      storageKey: 'guides/file.pdf',
    });
    prisma.guideDocument.update.mockResolvedValue(documentRecord());

    const updated = await service.removeFile(manager, 1);

    expect(storage.delete).toHaveBeenCalledWith('guides/file.pdf');
    expect(prisma.guideDocument.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        storageKey: null,
        originalName: null,
        mimeType: null,
        sizeBytes: null,
      },
      select: expect.any(Object) as object,
    });
    expect(updated.hasFile).toBe(false);
  });

  it('hides unpublished documents from anonymous readers', async () => {
    const { service, prisma } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue(
      documentRecord({ isPublished: false, storageKey: 'guides/file.pdf' }),
    );

    await expect(service.download(undefined, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets managers download unpublished documents', async () => {
    const { service, prisma, storage } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue(
      documentRecord({
        isPublished: false,
        storageKey: 'guides/file.pdf',
        originalName: 'archivo.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 3,
      }),
    );
    storage.read.mockResolvedValue({
      stream: Readable.from([Buffer.from('pdf')]),
    });

    const result = await service.download(manager, 1);

    expect(storage.read).toHaveBeenCalledWith('guides/file.pdf');
    expect(result.document.originalName).toBe('archivo.pdf');
  });

  it('rejects downloading a document without a file', async () => {
    const { service, prisma } = createService();
    prisma.guideDocument.findUnique.mockResolvedValue(documentRecord());

    await expect(service.download(manager, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
