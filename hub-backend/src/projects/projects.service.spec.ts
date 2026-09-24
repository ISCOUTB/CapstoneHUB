import { Test, TestingModule } from '@nestjs/testing';
import {
  isValidProjectStatusTransition,
  ProjectsService,
} from './projects.service';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import { ProjectStatus } from '../generated/prisma/client';
import { ActorRole, ProjectSource, UserRole } from '../generated/prisma/client';

const ADMIN_USER = {
  id: 1,
  fullName: 'Admin',
  email: 'admin@example.com',
  roles: [UserRole.admin],
};

const EVALUATOR_USER = {
  id: 4,
  fullName: 'Evaluator',
  email: 'evaluator@example.com',
  roles: [UserRole.evaluator],
};

function createProjectDetail() {
  return {
    id: 10,
    name: 'Project',
    status: ProjectStatus.under_review,
    proposer: null,
    actors: [],
    description: 'Description',
    context: 'Context',
    location: null,
    requiresLegalization: false,
    isPrivate: true,
    canViewSensitiveData: true,
    source: ProjectSource.external_entity,
    facultyAdvisor: null,
    teamRequirements: null,
    expectedOutcomes: null,
    deliverables: [],
    startDate: new Date(),
    endDate: null,
    estimatedCost: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    observations: [],
    actorAssignments: [],
    milestones: [],
    statusHistory: [],
    attachments: [],
    reports: [],
  };
}

function createPrismaMock() {
  const projectUpdate = jest.fn().mockResolvedValue(undefined);
  const historyCreate = jest.fn().mockResolvedValue(undefined);
  type Transaction = {
    project: { update: typeof projectUpdate };
    projectStatusHistory: { create: typeof historyCreate };
  };
  const transaction: Transaction = {
    project: { update: projectUpdate },
    projectStatusHistory: { create: historyCreate },
  };

  const findUnique = jest
    .fn()
    .mockResolvedValue({ id: 10, status: ProjectStatus.proposed });

  const prisma = {
    project: { findUnique },
    $transaction: jest.fn((callback: (transaction: Transaction) => unknown) =>
      callback(transaction),
    ),
  };

  return { prisma, projectUpdate, historyCreate };
}

function createAuthorizationMock() {
  return {
    assertCanTransitionProject: jest.fn().mockResolvedValue(undefined),
    assertCanAssignActors: jest.fn().mockResolvedValue(undefined),
    assertAssignableUser: jest.fn().mockResolvedValue(undefined),
    projectVisibilityWhere: jest.fn().mockReturnValue({}),
  };
}

function createService(
  prisma: unknown,
  authorization: unknown,
): ProjectsService {
  return new ProjectsService(prisma as never, authorization as never);
}

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([
    [ProjectStatus.proposed, ProjectStatus.under_review],
    [ProjectStatus.proposed, ProjectStatus.rejected],
    [ProjectStatus.under_review, ProjectStatus.approved],
    [ProjectStatus.under_review, ProjectStatus.rejected],
    [ProjectStatus.approved, ProjectStatus.assigned],
    [ProjectStatus.approved, ProjectStatus.rejected],
    [ProjectStatus.assigned, ProjectStatus.in_progress],
    [ProjectStatus.assigned, ProjectStatus.rejected],
    [ProjectStatus.in_progress, ProjectStatus.closed],
    [ProjectStatus.in_progress, ProjectStatus.rejected],
  ])('accepts valid transition %s -> %s', (previousStatus, nextStatus) => {
    expect(isValidProjectStatusTransition(previousStatus, nextStatus)).toBe(
      true,
    );
  });

  it.each([
    [ProjectStatus.proposed, ProjectStatus.approved],
    [ProjectStatus.under_review, ProjectStatus.in_progress],
    [ProjectStatus.closed, ProjectStatus.rejected],
    [ProjectStatus.rejected, ProjectStatus.proposed],
  ])('rejects invalid transition %s -> %s', (previousStatus, nextStatus) => {
    expect(isValidProjectStatusTransition(previousStatus, nextStatus)).toBe(
      false,
    );
  });

  it('updates status and history in the same transaction', async () => {
    const { prisma, projectUpdate, historyCreate } = createPrismaMock();
    const authorization = createAuthorizationMock();
    const service = createService(prisma, authorization);
    jest.spyOn(service, 'project').mockResolvedValue(createProjectDetail());

    await service.transitionProjectStatus({
      user: EVALUATOR_USER,
      projectId: 10,
      nextStatus: ProjectStatus.under_review,
      description: 'Initial review',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(projectUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: ProjectStatus.under_review },
    });
    expect(historyCreate).toHaveBeenCalledWith({
      data: {
        projectId: 10,
        previousStatus: ProjectStatus.proposed,
        nextStatus: ProjectStatus.under_review,
        description: 'Initial review',
        authorUserId: 4,
      },
    });
  });

  it('requires a reason for non-admin status changes', async () => {
    const { prisma } = createPrismaMock();
    const authorization = createAuthorizationMock();
    const service = createService(prisma, authorization);

    await expect(
      service.transitionProjectStatus({
        user: EVALUATOR_USER,
        projectId: 10,
        nextStatus: ProjectStatus.under_review,
      }),
    ).rejects.toThrow('A reason is required');
  });

  it('allows admin status changes without a reason', async () => {
    const { prisma, historyCreate } = createPrismaMock();
    const authorization = createAuthorizationMock();
    const service = createService(prisma, authorization);
    jest.spyOn(service, 'project').mockResolvedValue(createProjectDetail());

    await service.transitionProjectStatus({
      user: ADMIN_USER,
      projectId: 10,
      nextStatus: ProjectStatus.under_review,
    });

    expect(historyCreate).toHaveBeenCalledWith({
      data: {
        projectId: 10,
        previousStatus: ProjectStatus.proposed,
        nextStatus: ProjectStatus.under_review,
        description: null,
        authorUserId: 1,
      },
    });
  });

  it('rejects invalid transitions before authorization checks', async () => {
    const { prisma } = createPrismaMock();
    const authorization = createAuthorizationMock();
    const service = createService(prisma, authorization);

    await expect(
      service.transitionProjectStatus({
        user: ADMIN_USER,
        projectId: 10,
        nextStatus: ProjectStatus.approved,
      }),
    ).rejects.toThrow('Invalid project status transition');
    expect(authorization.assertCanTransitionProject).not.toHaveBeenCalled();
  });

  it('preserves duplicate-assignment protection', async () => {
    const createAssignment = jest.fn();
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({ id: 10, name: 'Project' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4,
          fullName: 'Student',
          email: 'student@example.com',
          isActive: true,
        }),
      },
      projectActorAssignment: {
        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
        create: createAssignment,
      },
    };
    const authorization = createAuthorizationMock();
    const service = createService(prisma, authorization);

    await expect(
      service.addProjectActorAssignment({
        user: ADMIN_USER,
        projectId: 10,
        userId: 4,
        role: ActorRole.student,
      }),
    ).rejects.toThrow('already assigned');
    expect(createAssignment).not.toHaveBeenCalled();
  });

  it('returns the current user projects with their role', async () => {
    const startDate = new Date('2026-01-05T00:00:00.000Z');
    const assignmentFindMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        projectId: 10,
        userId: 4,
        role: ActorRole.evaluator,
        assignedAt: new Date(),
        project: {
          id: 10,
          name: 'Project',
          status: ProjectStatus.under_review,
          startDate,
          location: 'Bogotá',
          isPrivate: true,
        },
      },
    ]);
    const projectFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      projectActorAssignment: { findMany: assignmentFindMany },
      project: { findMany: projectFindMany },
    };
    const authorization = createAuthorizationMock();
    const service = createService(prisma, authorization);

    const result = await service.projectsForUser(EVALUATOR_USER);

    expect(assignmentFindMany).toHaveBeenCalledWith({
      where: { userId: 4 },
      include: { project: true },
      orderBy: { assignedAt: 'desc' },
    });
    expect(projectFindMany).toHaveBeenCalledWith({
      where: { proposerUserId: 4 },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 10,
        name: 'Project',
        status: ProjectStatus.under_review,
        startDate,
        location: 'Bogotá',
        isPrivate: true,
        myRole: ActorRole.evaluator,
        isProposer: false,
      },
    ]);
  });

  it('merges proposed and assigned projects without duplicates', async () => {
    const startDate = new Date('2026-01-05T00:00:00.000Z');
    const makeproject = (id: number, name: string, isPrivate: boolean) => ({
      id,
      name,
      status: ProjectStatus.proposed,
      startDate,
      location: null,
      isPrivate,
    });
    const prisma = {
      projectActorAssignment: {
        findMany: jest.fn().mockResolvedValue([
          {
            projectId: 1,
            role: ActorRole.student,
            assignedAt: new Date(),
            project: makeproject(1, 'Proposed and assigned', true),
          },
        ]),
      },
      project: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            makeproject(1, 'Proposed and assigned', true),
            makeproject(2, 'Only proposed', false),
          ]),
      },
    };
    const service = createService(prisma, createAuthorizationMock());

    const result = await service.projectsForUser(EVALUATOR_USER);

    expect(result).toHaveLength(2);
    expect(result.find((project) => project.id === 1)).toMatchObject({
      isProposer: true,
      myRole: ActorRole.student,
    });
    expect(result.find((project) => project.id === 2)).toMatchObject({
      isProposer: true,
      myRole: null,
    });
  });

  it('lists assignable users after authorizing the acting user', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 4,
        fullName: 'Coordinator',
        email: 'coordinator@example.com',
        roleAssignments: [{ role: UserRole.coordinator }],
      },
    ]);
    const prisma = { user: { findMany } };
    const authorization = createAuthorizationMock();
    const service = createService(prisma, authorization);

    const result = await service.assignableUsers(
      { id: 2, fullName: 'Coordinator', email: 'c@example.com', roles: [] },
      10,
    );

    expect(authorization.assertCanAssignActors).toHaveBeenCalledWith(
      expect.anything(),
      10,
    );
    expect(result).toEqual([
      {
        id: 4,
        fullName: 'Coordinator',
        email: 'coordinator@example.com',
        roles: [UserRole.coordinator],
      },
    ]);
  });

  it('connects the acting user as the project proposer', async () => {
    const createdProject = {
      id: 11,
      name: 'New project',
      status: ProjectStatus.proposed,
      startDate: null,
      location: null,
      requiresLegalization: false,
      isPrivate: true,
      source: ProjectSource.external_entity,
      naturalProposer: null,
      actorAssignments: [],
      deliverables: [],
      observations: [],
      milestones: [],
      statusHistory: [],
      attachments: [],
      reports: [],
      description: 'Description',
      context: 'Context',
      endDate: null,
      estimatedCost: null,
      facultyAdvisor: null,
      teamRequirements: null,
      expectedOutcomes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const create = jest
      .fn<Promise<typeof createdProject>, [{ data: unknown }]>()
      .mockResolvedValue(createdProject);
    const prisma = { project: { create } };
    const authorization = {
      ...createAuthorizationMock(),
      assertCanCreateProject: jest.fn(),
    };
    const service = createService(prisma, authorization);

    await service.createProject(EVALUATOR_USER, {
      name: 'New project',
      description: 'Description',
      context: 'Context',
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        proposer: { connect: { id: EVALUATOR_USER.id } },
      }),
    );
  });

  it('applies the viewer visibility filter to project listings', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { project: { findMany } };
    const visibilityWhere = { isPrivate: false };
    const authorization = {
      ...createAuthorizationMock(),
      projectVisibilityWhere: jest.fn().mockReturnValue(visibilityWhere),
    };
    const service = createService(prisma, authorization);

    await service.projects(
      { where: { status: ProjectStatus.closed } },
      undefined,
    );

    expect(authorization.projectVisibilityWhere).toHaveBeenCalledWith(
      undefined,
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: ProjectStatus.closed, isPrivate: false },
      }),
    );
  });

  it('redacts sensitive relations for anonymous viewers of a public project', async () => {
    const project = {
      ...createProjectDetail(),
      id: 33,
      status: ProjectStatus.closed,
      isPrivate: false,
      proposerUserId: 999,
      actorAssignments: [
        {
          id: 1,
          projectId: 33,
          userId: 555,
          role: ActorRole.student,
          assignedAt: new Date(),
          user: { id: 555, fullName: 'Secret', email: 'secret@example.com' },
        },
      ],
      observations: [
        {
          id: 1,
          projectId: 33,
          content: 'internal note',
          createdAt: new Date(),
          authorUser: {
            id: 555,
            fullName: 'Secret',
            email: 'secret@example.com',
          },
        },
      ],
    };
    const prisma = {
      project: { findFirst: jest.fn().mockResolvedValue(project) },
    };
    const authorization = {
      ...createAuthorizationMock(),
      projectVisibilityWhere: jest.fn().mockReturnValue({}),
    };
    const service = createService(prisma, authorization);

    const result = await service.project({ id: 33 }, undefined);

    expect(result).not.toBeNull();
    expect(result?.canViewSensitiveData).toBe(false);
    expect(result?.actors).toEqual([]);
    expect(result?.observations).toEqual([]);
  });

  it('keeps sensitive relations for the project proposer', async () => {
    const project = {
      ...createProjectDetail(),
      id: 33,
      status: ProjectStatus.in_progress,
      isPrivate: true,
      proposerUserId: EVALUATOR_USER.id,
      actorAssignments: [],
      observations: [],
    };
    const prisma = {
      project: { findFirst: jest.fn().mockResolvedValue(project) },
    };
    const authorization = {
      ...createAuthorizationMock(),
      projectVisibilityWhere: jest.fn().mockReturnValue({}),
    };
    const service = createService(prisma, authorization);

    const result = await service.project({ id: 33 }, EVALUATOR_USER);

    expect(result?.canViewSensitiveData).toBe(true);
  });
});
