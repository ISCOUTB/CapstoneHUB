import { ForbiddenException } from '@nestjs/common';
import {
  ActorRole,
  ProjectPhase,
  ProjectStatus,
  ReportStatus,
  UserRole,
} from '../generated/prisma/client';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  const user = (roles: UserRole[], id = 7) => ({
    id,
    fullName: 'Test Teacher',
    email: 'teacher@example.com',
    roles,
  });

  function createService(global = false) {
    const prisma = {
      project: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      projectReport: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      projectMilestones: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const authorization = {
      assertCanViewKpis: jest.fn(),
      canReviewAnyProject: jest.fn().mockReturnValue(global),
    };
    const service = new StatsService(prisma as never, authorization as never);

    return { service, prisma, authorization };
  }

  it('rejects users without an authorized role', async () => {
    const { service, authorization } = createService();
    authorization.assertCanViewKpis.mockImplementation(() => {
      throw new ForbiddenException();
    });

    await expect(
      service.kpisForUser(user([UserRole.student])),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes teachers to assigned or proposed projects', async () => {
    const { service, prisma, authorization } = createService();
    const teacher = user([UserRole.teacher]);

    const result = await service.kpisForUser(teacher);

    expect(authorization.assertCanViewKpis).toHaveBeenCalledWith(teacher);
    expect(prisma.project.count).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            actorAssignments: {
              some: {
                userId: 7,
                role: { in: [ActorRole.teacher, ActorRole.evaluator] },
              },
            },
          },
          { proposerUserId: 7 },
        ],
      },
    });
    expect(result.scope).toBe('assigned');
  });

  it('scopes evaluators to assigned or proposed projects', async () => {
    const { service } = createService();

    const result = await service.kpisForUser(user([UserRole.evaluator]));

    expect(result.scope).toBe('assigned');
  });

  it('widens the scope for directivos', async () => {
    const { service, prisma } = createService(true);

    const result = await service.kpisForUser(user([UserRole.directivo]));

    expect(prisma.project.count).toHaveBeenCalledWith({ where: {} });
    expect(prisma.projectMilestones.count).toHaveBeenCalledWith({
      where: {
        completed: false,
        dueDate: { lt: expect.any(Date) as Date },
        project: {
          status: {
            in: [
              ProjectStatus.approved,
              ProjectStatus.in_progress,
              ProjectStatus.paused,
            ],
          },
        },
      },
    });
    expect(result.scope).toBe('global');
  });

  it('maps the aggregates into the KPI response', async () => {
    const { service, prisma } = createService();
    prisma.project.count.mockResolvedValueOnce(4).mockResolvedValueOnce(0);
    prisma.project.groupBy
      .mockResolvedValueOnce([
        { status: ProjectStatus.in_progress, _count: { _all: 3 } },
      ])
      .mockResolvedValueOnce([
        { phase: ProjectPhase.semester_1, _count: { _all: 4 } },
      ]);
    prisma.project.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Propuesta nueva',
        createdAt: new Date('2026-09-01T10:00:00Z'),
        proposer: null,
        naturalProposer: { fullName: 'Proponente Natural' },
      },
    ]);
    prisma.projectReport.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);
    prisma.projectReport.findMany
      .mockResolvedValueOnce([
        {
          id: 3,
          title: 'Informe final',
          dueDate: new Date('2020-01-01T00:00:00Z'),
          submittedAt: new Date('2026-09-25T10:00:00Z'),
          project: { id: 10, name: 'Proyecto' },
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.projectMilestones.count.mockResolvedValue(1);
    prisma.projectMilestones.findMany.mockResolvedValue([
      {
        id: 9,
        title: 'Hito vencido',
        dueDate: new Date('2026-09-20T00:00:00Z'),
        project: { id: 10, name: 'Proyecto' },
      },
    ]);

    const result = await service.kpisForUser(user([UserRole.teacher]));

    expect(result.projects).toEqual({
      total: 4,
      byStatus: [{ status: ProjectStatus.in_progress, count: 3 }],
      byPhase: [{ phase: ProjectPhase.semester_1, count: 4 }],
    });
    expect(result.pendingProposals).toEqual({
      count: 0,
      items: [
        {
          id: 1,
          name: 'Propuesta nueva',
          proposerName: 'Proponente Natural',
          createdAt: new Date('2026-09-01T10:00:00Z'),
        },
      ],
    });
    expect(result.pendingReviews).toEqual({
      count: 5,
      overdueCount: 2,
      items: [
        {
          projectId: 10,
          projectName: 'Proyecto',
          reportId: 3,
          title: 'Informe final',
          dueDate: new Date('2020-01-01T00:00:00Z'),
          submittedAt: new Date('2026-09-25T10:00:00Z'),
          overdue: true,
        },
      ],
    });
    expect(result.overdueMilestones).toEqual({
      count: 1,
      items: [
        {
          projectId: 10,
          projectName: 'Proyecto',
          milestoneId: 9,
          title: 'Hito vencido',
          dueDate: new Date('2026-09-20T00:00:00Z'),
        },
      ],
    });
  });

  it('computes the review windows from the reviews authored by the user', async () => {
    const { service, prisma } = createService();
    const now = Date.now();
    const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000);
    const daysAgo = (days: number) => new Date(now - days * 86_400_000);
    prisma.projectReport.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          status: ReportStatus.accepted,
          submittedAt: hoursAgo(10),
          reviewedAt: hoursAgo(8),
        },
        {
          status: ReportStatus.rejected,
          submittedAt: hoursAgo(30),
          reviewedAt: hoursAgo(20),
        },
        {
          status: ReportStatus.accepted,
          submittedAt: new Date(daysAgo(25).getTime() - 5 * 3_600_000),
          reviewedAt: daysAgo(25),
        },
        {
          status: ReportStatus.accepted,
          submittedAt: new Date(daysAgo(45).getTime() - 3_600_000),
          reviewedAt: daysAgo(45),
        },
      ]);

    const { myReviews } = await service.kpisForUser(user([UserRole.teacher]));

    expect(myReviews.all).toEqual({
      total: 4,
      accepted: 3,
      rejected: 1,
      averageHours: 4.5,
    });
    expect(myReviews.last30Days).toEqual({
      total: 3,
      accepted: 2,
      rejected: 1,
      averageHours: 5.7,
    });
    expect(myReviews.lastWeek).toEqual({
      total: 2,
      accepted: 1,
      rejected: 1,
      averageHours: 6,
    });
  });
});
