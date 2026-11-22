import { ForbiddenException } from '@nestjs/common';
import { Readable } from 'node:stream';
import { AttachmentsService } from './attachments.service';

describe('AttachmentsService', () => {
  const user = {
    id: 7,
    fullName: 'Teacher',
    email: 'teacher@example.com',
    roles: ['teacher'],
  } as never;

  function createService() {
    const prisma = {
      project: { findUnique: jest.fn() },
      projectAttachment: { findFirst: jest.fn() },
    };
    const storage = { read: jest.fn() };
    const authorization = {
      assertProjectMember: jest.fn(),
      assertCanViewReportContents: jest.fn(),
    };

    return {
      service: new AttachmentsService(
        prisma as never,
        storage as never,
        authorization as never,
      ),
      prisma,
      storage,
      authorization,
    };
  }

  function selectedAttachment(overrides: Record<string, unknown> = {}) {
    return {
      id: 55,
      projectId: 10,
      reportId: 3,
      uploadedByUserId: 7,
      originalName: 'documento.pdf',
      storageKey: 'projects/10/documento.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      createdAt: new Date('2026-09-13'),
      uploadedBy: null,
      ...overrides,
    };
  }

  it('blocks downloading an attachment linked to a draft report', async () => {
    const { service, prisma, storage, authorization } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectAttachment.findFirst.mockResolvedValue(
      selectedAttachment({ report: { status: 'pending' } }),
    );
    authorization.assertCanViewReportContents.mockRejectedValue(
      new ForbiddenException('Report contents are hidden'),
    );

    await expect(
      service.downloadAttachment({ projectId: 10, attachmentId: 55, user }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(authorization.assertCanViewReportContents).toHaveBeenCalledWith(
      user,
      10,
      { status: 'pending' },
    );
    expect(storage.read).not.toHaveBeenCalled();
  });

  it('downloads an attachment once the report has been submitted', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectAttachment.findFirst.mockResolvedValue(
      selectedAttachment({ report: { status: 'submitted' } }),
    );
    storage.read.mockResolvedValue({ stream: Readable.from([]) });

    const result = await service.downloadAttachment({
      projectId: 10,
      attachmentId: 55,
      user,
    });

    expect(result.attachment.originalName).toBe('documento.pdf');
    expect(storage.read).toHaveBeenCalledWith('projects/10/documento.pdf');
  });
});
