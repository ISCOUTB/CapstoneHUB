import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReportContentKind, ReportStatus } from '../generated/prisma/client';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const user = {
    id: 7,
    fullName: 'Coordinator',
    email: 'coordinator@example.com',
    roles: ['teacher'],
  } as never;

  const dueDate = new Date('2026-10-01');

  function selectedReport(overrides: Record<string, unknown> = {}) {
    return {
      id: 3,
      projectId: 10,
      title: 'Plan',
      description: 'Details',
      dueDate,
      type: 'file',
      allowedMimeTypes: ['application/pdf'],
      maxFiles: 3,
      status: 'pending',
      submittedAt: null,
      reviewedAt: null,
      reviewComment: null,
      createdAt: new Date('2026-09-12'),
      updatedAt: new Date('2026-09-12'),
      createdBy: {
        id: 7,
        fullName: 'Coordinator',
        email: 'coordinator@example.com',
      },
      reviewedBy: null,
      milestoneLinks: [],
      contents: [],
      ...overrides,
    };
  }

  function selectedContent(overrides: Record<string, unknown> = {}) {
    return {
      id: 9,
      reportId: 3,
      kind: 'text',
      textContent: 'Contenido',
      url: null,
      label: null,
      createdAt: new Date('2026-09-13'),
      attachment: null,
      createdBy: {
        id: 7,
        fullName: 'Coordinator',
        email: 'coordinator@example.com',
      },
      ...overrides,
    };
  }

  function createService() {
    const prisma = {
      project: { findUnique: jest.fn() },
      projectReport: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn<
          Promise<unknown>,
          [
            {
              data: {
                projectId: number;
                createdByUserId: number;
                title: string;
                description: string | null;
                dueDate: Date;
                type: ReportContentKind;
                allowedMimeTypes: string[];
                maxFiles: number | null;
              };
              select: unknown;
            },
          ]
        >(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      projectReportContent: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      projectAttachment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // `deleteReport` envuelve el borrado en una transacción.
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );

    const authorization = {
      assertProjectMember: jest.fn(),
      assertCanSubmitReports: jest.fn(),
      assertCanManageReports: jest.fn(),
    };
    const storage = {
      read: jest.fn(),
      delete: jest.fn(),
      saveFromFile: jest.fn(),
    };

    return {
      service: new ReportsService(
        prisma as never,
        authorization as never,
        storage as never,
      ),
      prisma,
      authorization,
      storage,
    };
  }

  const FILE_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/ogg',
  ];

  function pendingReport(overrides: Record<string, unknown> = {}) {
    const type = (overrides.type as string | undefined) ?? 'file';

    return {
      id: 3,
      status: 'pending',
      type,
      allowedMimeTypes: type === 'file' ? FILE_MIME_TYPES : [],
      maxFiles: type === 'file' ? 3 : null,
      ...overrides,
    };
  }

  it('creates a standalone report for an authorized project manager', async () => {
    const { service, prisma, authorization } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.create.mockResolvedValue(
      selectedReport({ type: 'file' }),
    );

    const result = await service.createReport({
      projectId: 10,
      user,
      data: {
        title: ' Plan ',
        description: ' Details ',
        dueDate,
        type: ReportContentKind.file,
        allowedMimeTypes: ['application/pdf', 'video/mp4'],
        maxFiles: 2,
      },
    });

    expect(result).toMatchObject({
      id: 3,
      projectId: 10,
      status: 'pending',
      title: 'Plan',
      description: 'Details',
      dueDate,
      type: ReportContentKind.file,
    });
    expect(authorization.assertCanManageReports).toHaveBeenCalledWith(user, 10);
    const createArgs = prisma.projectReport.create.mock.calls[0]?.[0] as {
      data: {
        projectId: number;
        title: string;
        description: string | null;
        dueDate: Date;
        type: ReportContentKind;
        allowedMimeTypes: string[];
        maxFiles: number | null;
      };
    };
    expect(createArgs.data).toMatchObject({
      projectId: 10,
      title: 'Plan',
      description: 'Details',
      dueDate,
      type: ReportContentKind.file,
      allowedMimeTypes: ['application/pdf', 'video/mp4'],
      maxFiles: 2,
    });
  });

  it('rejects a report title that is blank', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });

    await expect(
      service.createReport({
        projectId: 10,
        user,
        data: {
          title: '   ',
          dueDate,
          type: ReportContentKind.file,
          allowedMimeTypes: ['application/pdf'],
          maxFiles: 1,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires file configuration when the type has files', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });

    await expect(
      service.createReport({
        projectId: 10,
        user,
        data: { title: 'Entrega', dueDate, type: ReportContentKind.file },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects MIME types outside the report type', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });

    await expect(
      service.createReport({
        projectId: 10,
        user,
        data: {
          title: 'Entrega',
          dueDate,
          type: ReportContentKind.file,
          allowedMimeTypes: ['text/plain'],
          maxFiles: 1,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('submits a report that already has content', async () => {
    const { service, prisma, authorization } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(pendingReport());
    prisma.projectReportContent.count.mockResolvedValue(2);
    prisma.projectReport.update.mockResolvedValue(
      selectedReport({
        status: 'submitted',
        submittedAt: new Date('2026-09-13'),
      }),
    );

    const result = await service.submitReport({
      projectId: 10,
      reportId: 3,
      user,
    });

    expect(result.status).toBe('submitted');
    expect(authorization.assertCanSubmitReports).toHaveBeenCalledWith(user, 10);
    expect(prisma.projectReport.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        status: ReportStatus.submitted,
        submittedAt: expect.any(Date) as Date,
        reviewedAt: null,
        reviewedByUserId: null,
        reviewComment: null,
      },
      select: expect.any(Object) as object,
    });
  });

  it('rejects submitting a report without content', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(pendingReport());
    prisma.projectReportContent.count.mockResolvedValue(0);

    await expect(
      service.submitReport({ projectId: 10, reportId: 3, user }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows resubmitting a rejected report', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue({
      id: 3,
      status: 'rejected',
    });
    prisma.projectReportContent.count.mockResolvedValue(1);
    prisma.projectReport.update.mockResolvedValue(
      selectedReport({ status: 'submitted' }),
    );

    const result = await service.submitReport({
      projectId: 10,
      reportId: 3,
      user,
    });

    expect(result.status).toBe('submitted');
  });

  it('creates trimmed text content while the report is editable', async () => {
    const { service, prisma, authorization } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'text' }),
    );
    prisma.projectReportContent.create.mockResolvedValue(
      selectedContent({ textContent: 'Hola mundo' }),
    );

    const result = await service.createContent({
      projectId: 10,
      reportId: 3,
      user,
      data: {
        kind: ReportContentKind.text,
        textContent: '  Hola mundo  ',
      },
    });

    expect(result.textContent).toBe('Hola mundo');
    expect(authorization.assertCanSubmitReports).toHaveBeenCalledWith(user, 10);
    expect(prisma.projectReportContent.create).toHaveBeenCalledWith({
      data: {
        reportId: 3,
        createdByUserId: 7,
        kind: ReportContentKind.text,
        textContent: 'Hola mundo',
      },
      select: expect.any(Object) as object,
    });
  });

  it('creates link content with a normalized URL', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'link' }),
    );
    prisma.projectReportContent.create.mockResolvedValue(
      selectedContent({ kind: 'link', url: 'https://example.com/demo' }),
    );

    await service.createContent({
      projectId: 10,
      reportId: 3,
      user,
      data: {
        kind: ReportContentKind.link,
        url: ' https://example.com/demo ',
        label: ' Demo ',
      },
    });

    expect(prisma.projectReportContent.create).toHaveBeenCalledWith({
      data: {
        reportId: 3,
        createdByUserId: 7,
        kind: ReportContentKind.link,
        url: 'https://example.com/demo',
        label: 'Demo',
      },
      select: expect.any(Object) as object,
    });
  });

  it('rejects content mutations on a submitted report', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue({
      id: 3,
      status: 'submitted',
    });

    await expect(
      service.createContent({
        projectId: 10,
        reportId: 3,
        user,
        data: { kind: ReportContentKind.text, textContent: 'Hola' },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('uploads a file for an editable report and creates the content', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'file' }),
    );
    storage.saveFromFile.mockResolvedValue(undefined);
    prisma.projectAttachment.create.mockResolvedValue({ id: 55 });
    prisma.projectReportContent.create.mockResolvedValue(
      selectedContent({
        kind: 'file',
        textContent: null,
        attachment: { id: 55 },
      }),
    );

    const result = await service.uploadFileContent({
      projectId: 10,
      reportId: 3,
      user,
      file: {
        originalname: 'foto.png',
        mimetype: 'image/png',
        size: 1234,
        path: '/tmp/foto-123',
      } as never,
    });

    expect(result.kind).toBe('file');

    const [[saveCall]] = storage.saveFromFile.mock.calls as unknown as [
      [
        {
          key: string;
          filePath: string;
          contentType: string;
          sizeBytes: number;
        },
      ],
    ];
    expect(saveCall.key).toMatch(/^projects\/10\/.+\.png$/);
    expect(saveCall.filePath).toBe('/tmp/foto-123');
    expect(saveCall.contentType).toBe('image/png');
    expect(saveCall.sizeBytes).toBe(1234);

    const [[attachmentCall]] = prisma.projectAttachment.create.mock
      .calls as unknown as [
      [{ data: { originalName: string; sizeBytes: number } }],
    ];
    expect(attachmentCall.data).toMatchObject({
      originalName: 'foto.png',
      sizeBytes: 1234,
    });
  });

  it('rejects a MIME type not allowed by the report', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'file', allowedMimeTypes: ['image/png'] }),
    );

    await expect(
      service.uploadFileContent({
        projectId: 10,
        reportId: 3,
        user,
        file: {
          originalname: 'foto.gif',
          mimetype: 'image/gif',
          size: 10,
          path: '/tmp/foto',
        } as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.saveFromFile).not.toHaveBeenCalled();
  });

  it('rejects when the report reached its max files', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'file', maxFiles: 1 }),
    );
    prisma.projectReportContent.count.mockResolvedValue(1);

    await expect(
      service.uploadFileContent({
        projectId: 10,
        reportId: 3,
        user,
        file: {
          originalname: 'foto.png',
          mimetype: 'image/png',
          size: 10,
          path: '/tmp/foto',
        } as never,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storage.saveFromFile).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'file' }),
    );

    await expect(
      service.uploadFileContent({
        projectId: 10,
        reportId: 3,
        user,
        file: {
          originalname: 'clip.mp4',
          mimetype: 'video/mp4',
          size: 200 * 1024 * 1024,
          path: '/tmp/clip',
        } as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.saveFromFile).not.toHaveBeenCalled();
  });

  it('deletes the orphan object when the content row cannot be created', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'file' }),
    );
    storage.saveFromFile.mockResolvedValue(undefined);
    prisma.projectAttachment.create.mockResolvedValue({ id: 55 });
    prisma.projectReportContent.create.mockRejectedValue(
      new Error('db failure'),
    );

    await expect(
      service.uploadFileContent({
        projectId: 10,
        reportId: 3,
        user,
        file: {
          originalname: 'foto.png',
          mimetype: 'image/png',
          size: 1234,
          path: '/tmp/foto',
        } as never,
      }),
    ).rejects.toThrow('db failure');

    expect(storage.delete).toHaveBeenCalledWith(
      expect.stringMatching(/^projects\/10\/.+\.png$/),
    );
  });

  it('deletes file content along with its attachment', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(pendingReport());
    prisma.projectReportContent.findFirst.mockResolvedValue({
      id: 9,
      kind: 'image',
      attachmentId: 55,
      createdByUserId: 7,
    });
    prisma.projectAttachment.findFirst.mockResolvedValue({
      storageKey: 'projects/10/foto.png',
    });

    const result = await service.deleteContent({
      projectId: 10,
      reportId: 3,
      contentId: 9,
      user,
    });

    expect(result).toEqual({ id: 9 });
    expect(prisma.projectReportContent.delete).toHaveBeenCalledWith({
      where: { id: 9 },
    });
    expect(prisma.projectAttachment.delete).toHaveBeenCalledWith({
      where: { id: 55 },
    });
    expect(storage.delete).toHaveBeenCalledWith('projects/10/foto.png');
  });

  it('refuses to edit file content', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(pendingReport());
    prisma.projectReportContent.findFirst.mockResolvedValue({
      id: 9,
      kind: 'video',
      attachmentId: 55,
      createdByUserId: 7,
    });

    await expect(
      service.updateContent({
        projectId: 10,
        reportId: 3,
        contentId: 9,
        user,
        data: { label: 'Otro' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a submitted report', async () => {
    const { service, prisma, authorization } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue({
      id: 3,
      status: 'submitted',
    });
    prisma.projectReport.update.mockResolvedValue(
      selectedReport({
        status: 'accepted',
        reviewedAt: new Date('2026-09-13'),
        reviewComment: 'Bien',
      }),
    );

    const result = await service.reviewReport({
      projectId: 10,
      reportId: 3,
      user,
      data: { decision: ReportStatus.accepted, comment: ' Bien ' },
    });

    expect(result.status).toBe('accepted');
    expect(authorization.assertCanManageReports).toHaveBeenCalledWith(user, 10);
    expect(prisma.projectReport.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        status: ReportStatus.accepted,
        reviewedAt: expect.any(Date) as Date,
        reviewedByUserId: 7,
        reviewComment: 'Bien',
      },
      select: expect.any(Object) as object,
    });
  });

  it('rejects a submitted report', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue({
      id: 3,
      status: 'submitted',
    });
    prisma.projectReport.update.mockResolvedValue(
      selectedReport({ status: 'rejected' }),
    );

    const result = await service.reviewReport({
      projectId: 10,
      reportId: 3,
      user,
      data: { decision: ReportStatus.rejected, comment: 'Falta documentación' },
    });

    expect(result.status).toBe('rejected');
  });

  it('rejects reviewing a pending report', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(pendingReport());

    await expect(
      service.reviewReport({
        projectId: 10,
        reportId: 3,
        user,
        data: { decision: ReportStatus.accepted },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a report from another project', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteReport({ projectId: 10, reportId: 99, user }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a report together with its attachments and their objects', async () => {
    const { service, prisma, storage } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(pendingReport());
    prisma.projectAttachment.findMany.mockResolvedValue([
      { id: 55, storageKey: 'projects/10/foto.png' },
    ]);
    prisma.projectReport.delete.mockResolvedValue(selectedReport());

    const result = await service.deleteReport({
      projectId: 10,
      reportId: 3,
      user,
    });

    expect(result.id).toBe(3);
    expect(prisma.projectAttachment.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [55] } },
    });
    expect(prisma.projectReport.delete).toHaveBeenCalledWith({
      where: { id: 3 },
      select: expect.any(Object) as object,
    });
    expect(storage.delete).toHaveBeenCalledWith('projects/10/foto.png');
  });

  it('rejects content whose kind does not match the report type', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'image' }),
    );

    await expect(
      service.createContent({
        projectId: 10,
        reportId: 3,
        user,
        data: { kind: ReportContentKind.text, textContent: 'Hola' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.projectReportContent.create).not.toHaveBeenCalled();
  });

  it('changes the report config while pending and empty', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'text' }),
    );
    prisma.projectReportContent.count.mockResolvedValue(0);
    prisma.projectReport.update.mockResolvedValue(
      selectedReport({ type: 'file' }),
    );

    const result = await service.updateReport({
      projectId: 10,
      reportId: 3,
      user,
      data: {
        type: ReportContentKind.file,
        allowedMimeTypes: ['application/pdf', 'video/mp4'],
        maxFiles: 4,
      },
    });

    expect(result.type).toBe('file');
    expect(prisma.projectReport.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        type: ReportContentKind.file,
        allowedMimeTypes: ['application/pdf', 'video/mp4'],
        maxFiles: 4,
      },
      select: expect.any(Object) as object,
    });
  });

  it('refuses to change the report config when it already has content', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue(
      pendingReport({ type: 'file' }),
    );
    prisma.projectReportContent.count.mockResolvedValue(1);

    await expect(
      service.updateReport({
        projectId: 10,
        reportId: 3,
        user,
        data: { maxFiles: 2 },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to change the report config when it is not pending', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({ id: 10 });
    prisma.projectReport.findFirst.mockResolvedValue({
      id: 3,
      status: 'submitted',
      type: 'file',
      allowedMimeTypes: ['application/pdf'],
      maxFiles: 3,
    });

    await expect(
      service.updateReport({
        projectId: 10,
        reportId: 3,
        user,
        data: { maxFiles: 5 },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
