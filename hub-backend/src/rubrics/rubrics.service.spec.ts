import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  ProjectPhase,
  ProjectStatus,
  UserRole,
} from '../generated/prisma/client';
import { RubricsService, assertCriteriaWeights } from './rubrics.service';

const user = (roles: UserRole[]) => ({
  id: 7,
  fullName: 'Test User',
  email: 'test@example.com',
  roles,
});

const criterion = (weightPercent: number) => ({
  title: 'Criterio',
  weightPercent,
});

describe('RubricsService', () => {
  it('accepts weights that add up to 100', () => {
    expect(() =>
      assertCriteriaWeights([criterion(40), criterion(60)] as never),
    ).not.toThrow();
  });

  it('rejects weights that do not add up to 100', () => {
    expect(() =>
      assertCriteriaWeights([criterion(40), criterion(50)] as never),
    ).toThrow(BadRequestException);
  });

  it('rejects creating a template with invalid weights before touching the database', async () => {
    const service = new RubricsService(
      {} as never,
      { assertCanManageRubrics: jest.fn() } as never,
    );

    await expect(
      service.createTemplate(user([UserRole.directivo]), {
        name: 'Rúbrica',
        criteria: [criterion(90)],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not allow editing the default template', async () => {
    const prisma = {
      rubricTemplate: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, isDefault: true }),
      },
    };
    const service = new RubricsService(
      prisma as never,
      { assertCanManageRubrics: jest.fn() } as never,
    );

    await expect(
      service.updateTemplate(user([UserRole.admin]), 1, { name: 'Otro' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not allow archiving the default template', async () => {
    const prisma = {
      rubricTemplate: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          isDefault: true,
          isActive: true,
        }),
      },
    };
    const service = new RubricsService(
      prisma as never,
      { assertCanManageRubrics: jest.fn() } as never,
    );

    await expect(
      service.archiveTemplate(user([UserRole.directivo]), 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('falls back to the default template when the phase has no assignment', async () => {
    const template = {
      id: 3,
      name: 'Nota general',
      description: null,
      area: null,
      isDefault: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      criteria: [
        {
          id: 10,
          position: 1,
          title: 'Nota general',
          description: null,
          weightPercent: 100,
        },
      ],
    };
    const prisma = {
      projectRubricAssignment: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      rubricTemplate: { findFirst: jest.fn().mockResolvedValue(template) },
    };
    const service = new RubricsService(
      prisma as never,
      { assertCanManageRubrics: jest.fn() } as never,
    );

    const rubric = await service.rubricForPhase(10, ProjectPhase.semester_1);

    expect(rubric.id).toBe(3);
    expect(rubric.criteria).toHaveLength(1);
  });

  it('blocks assigning a rubric after the phase has evaluations', async () => {
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          status: ProjectStatus.in_progress,
        }),
      },
      rubricTemplate: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2,
          name: 'Custom',
          isActive: true,
          isDefault: false,
        }),
      },
      projectEvaluation: { count: jest.fn().mockResolvedValue(1) },
    };
    const service = new RubricsService(
      prisma as never,
      { assertCanManageRubrics: jest.fn() } as never,
    );

    await expect(
      service.assignTemplate({
        user: user([UserRole.directivo]),
        projectId: 10,
        phase: ProjectPhase.semester_1,
        rubricTemplateId: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
