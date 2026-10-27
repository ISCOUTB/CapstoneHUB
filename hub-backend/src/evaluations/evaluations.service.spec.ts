import { ConflictException } from '@nestjs/common';
import {
  ProjectPhase,
  ProjectStatus,
  UserRole,
} from '../generated/prisma/client';
import { EvaluationsService } from './evaluations.service';

const user = (roles: UserRole[], id = 7) => ({
  id,
  fullName: 'Test User',
  email: 'test@example.com',
  roles,
});

function createService(prisma: unknown, rubrics: unknown = {}) {
  const authorization = {
    assertCanViewProjectEvaluations: jest.fn().mockResolvedValue(undefined),
    assertCanSubmitProjectEvaluation: jest.fn().mockResolvedValue(undefined),
  };

  return new EvaluationsService(
    prisma as never,
    authorization as never,
    rubrics as never,
  );
}

describe('EvaluationsService', () => {
  describe('phaseGate', () => {
    it('requires every assigned evaluator to have submitted', async () => {
      const prisma = {
        projectActorAssignment: {
          findMany: jest.fn().mockResolvedValue([
            {
              userId: 7,
              assignedAt: new Date(),
              user: { fullName: 'Eva' },
            },
          ]),
        },
        projectEvaluation: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const service = createService(prisma);

      const gate = await service.phaseGate(10, ProjectPhase.semester_1);

      expect(gate.completed).toBe(false);
      expect(gate.missingEvaluators).toEqual([{ userId: 7, fullName: 'Eva' }]);
    });

    it('completes when every assigned evaluator has submitted', async () => {
      const prisma = {
        projectActorAssignment: {
          findMany: jest.fn().mockResolvedValue([
            {
              userId: 7,
              assignedAt: new Date(),
              user: { fullName: 'Eva' },
            },
          ]),
        },
        projectEvaluation: {
          findMany: jest.fn().mockResolvedValue([{ evaluatorUserId: 7 }]),
        },
      };
      const service = createService(prisma);

      const gate = await service.phaseGate(10, ProjectPhase.semester_1);

      expect(gate.completed).toBe(true);
      expect(gate.missingEvaluators).toEqual([]);
    });

    it('requires at least one evaluation when there are no assigned evaluators', async () => {
      const prisma = {
        projectActorAssignment: { findMany: jest.fn().mockResolvedValue([]) },
        projectEvaluation: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const service = createService(prisma);

      const gate = await service.phaseGate(10, ProjectPhase.semester_2);

      expect(gate.completed).toBe(false);
    });

    it('accepts an admin evaluation when there are no assigned evaluators', async () => {
      const prisma = {
        projectActorAssignment: { findMany: jest.fn().mockResolvedValue([]) },
        projectEvaluation: {
          findMany: jest.fn().mockResolvedValue([{ evaluatorUserId: 1 }]),
        },
      };
      const service = createService(prisma);

      const gate = await service.phaseGate(10, ProjectPhase.semester_2);

      expect(gate.completed).toBe(true);
    });
  });

  it('rejects advancing while assigned evaluators are pending', async () => {
    const service = createService({
      projectActorAssignment: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 7,
            assignedAt: new Date(),
            user: { fullName: 'Eva' },
          },
        ]),
      },
      projectEvaluation: { findMany: jest.fn().mockResolvedValue([]) },
    });

    await expect(
      service.assertPhaseEvaluated(10, ProjectPhase.semester_1, 'advance'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('calculates the weighted score and snapshots the criteria', async () => {
    const rubric = {
      id: 3,
      name: 'Rúbrica',
      description: null,
      area: null,
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      criteria: [
        {
          id: 11,
          position: 1,
          title: 'Criterio A',
          description: null,
          weightPercent: 60,
        },
        {
          id: 12,
          position: 2,
          title: 'Criterio B',
          description: null,
          weightPercent: 40,
        },
      ],
    };
    const create = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          status: ProjectStatus.in_progress,
          phase: ProjectPhase.semester_1,
        }),
      },
      projectEvaluation: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(
        async (callback: (transaction: unknown) => Promise<void>) =>
          callback({ projectEvaluation: { create } }),
      ),
    };
    const service = createService(prisma, {
      rubricForPhase: jest.fn().mockResolvedValue(rubric),
    });
    jest
      .spyOn(service, 'listProjectEvaluations')
      .mockResolvedValue({} as never);

    await service.saveEvaluation({
      user: user([UserRole.evaluator]),
      projectId: 10,
      phase: ProjectPhase.semester_1,
      data: {
        criteria: [
          { criterionId: 11, score: 4 },
          { criterionId: 12, score: 5 },
        ],
      },
    });

    expect(create).toHaveBeenCalledWith({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({
        totalScore: 4.4,
        criteria: {
          create: [
            expect.objectContaining({
              title: 'Criterio A',
              weightPercent: 60,
              score: 4,
            }),
            expect.objectContaining({
              title: 'Criterio B',
              weightPercent: 40,
              score: 5,
            }),
          ],
        },
      }),
    });
  });
});
