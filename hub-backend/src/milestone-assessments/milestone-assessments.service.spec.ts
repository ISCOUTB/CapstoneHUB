import { BadRequestException } from '@nestjs/common';
import { MilestoneAssessmentsService } from './milestone-assessments.service';

describe('MilestoneAssessmentsService', () => {
  const user = {
    id: 7,
    fullName: 'Teacher',
    email: 'teacher@example.com',
    roles: ['teacher'],
  } as never;

  const updatedAt = new Date('2026-11-22T10:00:00Z');

  function savedAssessment(overrides: Record<string, unknown> = {}) {
    return {
      id: 3,
      projectId: 10,
      programId: 'ingenieria-industrial',
      answers: {},
      updatedAt,
      ...overrides,
    };
  }

  function createService() {
    const prisma = {
      project: { findUnique: jest.fn().mockResolvedValue({ id: 10 }) },
      projectProgramRequirement: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      projectMilestoneAssessment: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
      projectChangeHistory: {
        createMany: jest.fn<
          Promise<unknown>,
          [
            {
              data: {
                projectId: number;
                field: string;
                previousValue: string;
                newValue: string;
              }[];
            },
          ]
        >(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (callback: (value: unknown) => unknown) => callback(prisma),
    );
    const authorization = {
      assertProjectMember: jest.fn(),
      canManageMilestoneAssessment: jest.fn().mockResolvedValue(true),
      assertCanManageMilestoneAssessment: jest.fn(),
    };

    return {
      service: new MilestoneAssessmentsService(
        prisma as never,
        authorization as never,
      ),
      prisma,
      authorization,
    };
  }

  it('lists program assessments with backend templates and summaries', async () => {
    const { service, prisma } = createService();
    prisma.projectProgramRequirement.findMany.mockResolvedValue([
      { programId: 'ingenieria-industrial' },
      { programId: 'ingenieria-civil' },
    ]);
    prisma.projectMilestoneAssessment.findMany.mockResolvedValue([
      savedAssessment({
        answers: {
          'overview-1': { status: 'yes', observation: 'Cumple' },
        },
      }),
    ]);

    const result = await service.assessmentsByProject(10, user);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      programId: 'ingenieria-industrial',
      programName: 'Ingeniería Industrial',
      summary: {
        totalItems: 37,
        answeredItems: 1,
        yes: 1,
        pending: 36,
      },
    });
    expect(result[0].template?.overviewItems).toHaveLength(7);
    expect(result[1]).toMatchObject({
      programId: 'ingenieria-civil',
      programName: 'Ingeniería Civil',
      template: null,
      summary: { totalItems: 0, answeredItems: 0 },
    });
  });

  it('filters unpublished answers for student viewers', async () => {
    const { service, prisma, authorization } = createService();
    authorization.canManageMilestoneAssessment.mockResolvedValue(false);
    prisma.projectProgramRequirement.findMany.mockResolvedValue([
      { programId: 'ingenieria-industrial' },
    ]);
    prisma.projectMilestoneAssessment.findMany.mockResolvedValue([
      savedAssessment({
        answers: {
          'overview-1': { status: 'yes', observation: 'Incluido' },
          'overview-2': { status: 'no', observation: '' },
          'overview-3': { status: null, observation: 'Revisar' },
          'overview-4': { status: null, observation: '' },
        },
      }),
    ]);

    const [assessment] = await service.assessmentsByProject(10, user);

    expect(assessment.answers).toEqual({
      'overview-1': { status: 'yes', observation: 'Incluido' },
      'overview-3': { status: null, observation: 'Revisar' },
    });
  });

  it('saves answers and records one history entry per changed item', async () => {
    const { service, prisma } = createService();
    prisma.projectProgramRequirement.findUnique.mockResolvedValue({ id: 1 });
    prisma.projectMilestoneAssessment.findUnique.mockResolvedValue({
      answers: {
        'overview-1': { status: 'no', observation: '' },
      },
    });
    const saved = savedAssessment({
      answers: {
        'overview-1': { status: 'yes', observation: 'Ahora cumple' },
      },
    });
    prisma.projectMilestoneAssessment.upsert.mockResolvedValue(saved);

    const result = await service.saveAssessment({
      projectId: 10,
      programId: 'ingenieria-industrial',
      answers: {
        'overview-1': { status: 'yes', observation: 'Ahora cumple' },
      },
      user,
    });

    expect(result.answers).toEqual(saved.answers);
    expect(prisma.projectMilestoneAssessment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId_programId: {
            projectId: 10,
            programId: 'ingenieria-industrial',
          },
        },
      }),
    );
    const history = prisma.projectChangeHistory.createMany.mock.calls[0][0];
    expect(history.data).toHaveLength(1);
    expect(history.data[0]).toMatchObject({
      projectId: 10,
      field: 'milestone_assessment',
    });
    expect(history.data[0].previousValue).toContain(
      '"itemLabel":"Eje temático definido"',
    );
    expect(history.data[0].newValue).toContain('"status":"yes"');
  });

  it('rejects unknown assessment item ids', async () => {
    const { service, prisma } = createService();
    prisma.projectProgramRequirement.findUnique.mockResolvedValue({ id: 1 });

    await expect(
      service.saveAssessment({
        projectId: 10,
        programId: 'ingenieria-industrial',
        answers: {
          'unknown-item': { status: 'yes', observation: '' },
        },
        user,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.projectMilestoneAssessment.upsert).not.toHaveBeenCalled();
  });

  it('rejects programs that are not part of the project', async () => {
    const { service, prisma } = createService();
    prisma.projectProgramRequirement.findUnique.mockResolvedValue(null);

    await expect(
      service.saveAssessment({
        projectId: 10,
        programId: 'ingenieria-industrial',
        answers: {},
        user,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
