import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorRole,
  Prisma,
  Project,
  ProjectSource,
  ProjectStatus,
  UserRole,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  ProjectAttachmentResponse,
  attachmentSelect,
  mapAttachment,
} from '../attachments/attachments.select';
import {
  ProjectReportResponse,
  mapReport,
  reportSelect,
} from '../reports/reports.select';

const projectStatusHistorySelect = {
  id: true,
  projectId: true,
  previousStatus: true,
  nextStatus: true,
  description: true,
  changedAt: true,
  authorUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} as const satisfies Prisma.ProjectStatusHistorySelect;

const projectObservationSelect = {
  id: true,
  projectId: true,
  content: true,
  createdAt: true,
  authorUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} as const satisfies Prisma.ProjectObservationSelect;

const projectInclude = {
  naturalProposer: true,
  observations: { select: projectObservationSelect },
  actorAssignments: { include: { user: true } },
  milestones: true,
  statusHistory: { select: projectStatusHistorySelect },
  attachments: { select: attachmentSelect },
  reports: { select: reportSelect },
  deliverables: true,
} as const satisfies Prisma.ProjectInclude;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

export type ProjectProposerResponse = {
  type: 'natural_person';
  fullName: string;
  idNumber: string | null;
  email: string;
};

export type ProjectListResponse = {
  id: number;
  name: string;
  status: ProjectStatus;
  startDate: Date | null;
  location: string | null;
  requiresLegalization: boolean;
  isPrivate: boolean;
  source: ProjectSource;
  proposer: ProjectProposerResponse | null;
  actors: ProjectActorResponse[];
  /** `false` cuando el espectador solo puede ver la vista pública, sin datos sensibles. */
  canViewSensitiveData: boolean;
};

export type ProjectActorResponse = {
  id: number;
  userId: number;
  role: ActorRole;
  assignedAt: Date;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
};

export type MyProjectResponse = {
  id: number;
  name: string;
  status: ProjectStatus;
  startDate: Date | null;
  location: string | null;
  isPrivate: boolean;
  myRole: ActorRole | null;
  isProposer: boolean;
};

export type ProjectDeliverableResponse = {
  id: number;
  projectId: number;
  description: string;
  createdAt: Date;
};

export type ProjectDetailResponse = ProjectListResponse & {
  description: string;
  context: string;
  startDate: Date | null;
  endDate: Date | null;
  estimatedCost: Prisma.Decimal | null;
  facultyAdvisor: string | null;
  teamRequirements: string | null;
  expectedOutcomes: string | null;
  deliverables: ProjectDeliverableResponse[];
  createdAt: Date;
  updatedAt: Date;
  observations: {
    id: number;
    projectId: number;
    content: string;
    createdAt: Date;
    author: {
      id: number;
      fullName: string;
      email: string;
    } | null;
  }[];
  actorAssignments: {
    id: number;
    projectId: number;
    userId: number;
    role: ActorRole;
    assignedAt: Date;
    user: {
      id: number;
      fullName: string;
      email: string;
    };
  }[];
  milestones: {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    dueDate: Date;
    completed: boolean;
    createdAt: Date;
  }[];
  statusHistory: {
    id: number;
    projectId: number;
    previousStatus: ProjectStatus | null;
    nextStatus: ProjectStatus;
    description: string | null;
    changedAt: Date;
    author: {
      id: number;
      fullName: string;
      email: string;
    } | null;
  }[];
  attachments: ProjectAttachmentResponse[];
  reports: ProjectReportResponse[];
};

export type ProjectActorAssignmentResponse = {
  id: number;
  projectId: number;
  userId: number;
  role: ActorRole;
  assignedAt: Date;
  project: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    fullName: string;
    email: string;
  };
};

export type AssignableUserResponse = {
  id: number;
  fullName: string;
  email: string;
  roles: UserRole[];
};

function mapProjectProposer(
  project: Pick<ProjectWithRelations, 'naturalProposer'>,
): ProjectProposerResponse | null {
  if (project.naturalProposer) {
    return {
      type: 'natural_person',
      fullName: project.naturalProposer.fullName,
      idNumber: project.naturalProposer.idNumber,
      email: project.naturalProposer.email,
    };
  }

  return null;
}

export function isValidProjectStatusTransition(
  previousStatus: ProjectStatus,
  nextStatus: ProjectStatus,
): boolean {
  const transitions: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.proposed]: [
      ProjectStatus.under_review,
      ProjectStatus.rejected,
    ],
    [ProjectStatus.under_review]: [
      ProjectStatus.approved,
      ProjectStatus.rejected,
    ],
    [ProjectStatus.approved]: [ProjectStatus.assigned, ProjectStatus.rejected],
    [ProjectStatus.assigned]: [
      ProjectStatus.in_progress,
      ProjectStatus.rejected,
    ],
    [ProjectStatus.in_progress]: [ProjectStatus.closed, ProjectStatus.rejected],
    [ProjectStatus.closed]: [],
    [ProjectStatus.rejected]: [],
  };

  return transitions[previousStatus].includes(nextStatus);
}

function mapAuthor(
  user: { id: number; fullName: string; email: string } | null,
): { id: number; fullName: string; email: string } | null {
  return user
    ? { id: user.id, fullName: user.fullName, email: user.email }
    : null;
}

function mapActorBase(
  assignment: ProjectWithRelations['actorAssignments'][number],
): ProjectActorResponse {
  return {
    id: assignment.id,
    userId: assignment.userId,
    role: assignment.role,
    assignedAt: assignment.assignedAt,
    user: {
      id: assignment.user.id,
      fullName: assignment.user.fullName,
      email: assignment.user.email,
    },
  };
}

function mapObservation(
  observation: ProjectWithRelations['observations'][number],
): ProjectDetailResponse['observations'][number] {
  return {
    id: observation.id,
    projectId: observation.projectId,
    content: observation.content,
    createdAt: observation.createdAt,
    author: mapAuthor(observation.authorUser),
  };
}

function byDateThenId<T extends { id: number }>(
  getTime: (item: T) => number,
  direction: 'asc' | 'desc' = 'asc',
): (left: T, right: T) => number {
  const factor = direction === 'asc' ? 1 : -1;
  return (left, right) =>
    (getTime(left) - getTime(right)) * factor || left.id - right.id;
}

function mapProjectListResponse(
  project: ProjectWithRelations,
  canViewSensitiveData: boolean,
): ProjectListResponse {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    startDate: project.startDate,
    location: project.location,
    requiresLegalization: project.requiresLegalization,
    isPrivate: project.isPrivate,
    source: project.source,
    proposer: mapProjectProposer(project),
    // El equipo (nombres y correos) es sensible, así que solo se expone a los
    // miembros mientras el proyecto no sea todavía público.
    actors: canViewSensitiveData
      ? project.actorAssignments.map(mapActorBase)
      : [],
    canViewSensitiveData,
  };
}

function mapProjectDetailResponse(
  project: ProjectWithRelations,
  canViewSensitiveData: boolean,
): ProjectDetailResponse {
  return {
    ...mapProjectListResponse(project, canViewSensitiveData),
    description: project.description,
    context: project.context,
    startDate: project.startDate,
    endDate: project.endDate,
    estimatedCost: project.estimatedCost,
    facultyAdvisor: project.facultyAdvisor,
    teamRequirements: project.teamRequirements,
    expectedOutcomes: project.expectedOutcomes,
    deliverables: project.deliverables
      .slice()
      .sort((left, right) => left.id - right.id)
      .map((deliverable) => ({
        id: deliverable.id,
        projectId: deliverable.projectId,
        description: deliverable.description,
        createdAt: deliverable.createdAt,
      })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    // Todo lo que sigue es información interna de colaboración: solo la ven
    // los miembros.
    observations: canViewSensitiveData
      ? project.observations.map(mapObservation)
      : [],
    actorAssignments: canViewSensitiveData
      ? project.actorAssignments.map((assignment) => ({
          ...mapActorBase(assignment),
          projectId: assignment.projectId,
        }))
      : [],
    milestones: canViewSensitiveData
      ? project.milestones
          .slice()
          .sort(byDateThenId((milestone) => milestone.dueDate.getTime()))
      : [],
    statusHistory: canViewSensitiveData
      ? project.statusHistory
          .slice()
          .sort(byDateThenId((entry) => entry.changedAt.getTime(), 'desc'))
          .map((entry) => ({
            id: entry.id,
            projectId: entry.projectId,
            previousStatus: entry.previousStatus,
            nextStatus: entry.nextStatus,
            description: entry.description,
            changedAt: entry.changedAt,
            author: mapAuthor(entry.authorUser),
          }))
      : [],
    attachments: canViewSensitiveData
      ? project.attachments
          .slice()
          .sort(
            byDateThenId(
              (attachment) => attachment.createdAt.getTime(),
              'desc',
            ),
          )
          .map(mapAttachment)
      : [],
    reports: canViewSensitiveData
      ? project.reports
          .slice()
          .sort(byDateThenId((report) => report.dueDate.getTime()))
          .map(mapReport)
      : [],
  };
}

function rethrowProjectCreateError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(', ')
      : typeof error.meta?.target === 'string'
        ? error.meta.target
        : error.meta?.target == null
          ? 'unique field'
          : JSON.stringify(error.meta.target);
    throw new ConflictException(
      `Duplicate value for a unique field: ${target}`,
    );
  }

  throw error;
}

@Injectable()
export class ProjectsService {
  constructor(
    readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async project(
    projectWhereUniqueInput: Prisma.ProjectWhereUniqueInput,
    viewer?: AuthenticatedUser,
  ): Promise<ProjectDetailResponse | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        ...projectWhereUniqueInput,
        ...this.authorization.projectVisibilityWhere(viewer),
      },
      include: projectInclude,
    });

    return project
      ? mapProjectDetailResponse(
          project,
          this.canViewSensitiveData(project, viewer),
        )
      : null;
  }

  async projects(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ProjectWhereUniqueInput;
      where?: Prisma.ProjectWhereInput;
      orderBy?: Prisma.ProjectOrderByWithRelationInput;
    },
    viewer?: AuthenticatedUser,
  ): Promise<ProjectListResponse[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const projects = await this.prisma.project.findMany({
      skip,
      take,
      cursor,
      where: {
        ...where,
        ...this.authorization.projectVisibilityWhere(viewer),
      },
      orderBy,
      include: projectInclude,
    });

    return projects.map((project) =>
      mapProjectListResponse(
        project,
        this.canViewSensitiveData(project, viewer),
      ),
    );
  }

  /**
   * Los miembros pueden leer los datos sensibles del proyecto: admins,
   * evaluators, coordinators, el proponente y los actores asignados.
   */
  private canViewSensitiveData(
    project: ProjectWithRelations,
    viewer?: AuthenticatedUser,
  ): boolean {
    if (!viewer) {
      return false;
    }

    if (
      viewer.roles.includes(UserRole.admin) ||
      viewer.roles.includes(UserRole.evaluator) ||
      viewer.roles.includes(UserRole.coordinator)
    ) {
      return true;
    }

    if (project.proposerUserId === viewer.id) {
      return true;
    }

    return project.actorAssignments.some(
      (assignment) => assignment.userId === viewer.id,
    );
  }

  /**
   * Proyectos que el usuario puede seguir desde su perfil: los que propuso y
   * los que tiene asignados. Los duplicados se fusionan, dando prioridad al rol
   * de asignación cuando aplican ambos.
   */
  async projectsForUser(user: AuthenticatedUser): Promise<MyProjectResponse[]> {
    const [assignments, proposed] = await Promise.all([
      this.prisma.projectActorAssignment.findMany({
        where: { userId: user.id },
        include: { project: true },
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.project.findMany({
        where: { proposerUserId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const visible = new Map<number, MyProjectResponse>();

    for (const project of proposed) {
      visible.set(project.id, {
        id: project.id,
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        location: project.location,
        isPrivate: project.isPrivate,
        myRole: null,
        isProposer: true,
      });
    }

    for (const { project, role } of assignments) {
      const existing = visible.get(project.id);

      visible.set(project.id, {
        id: project.id,
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        location: project.location,
        isPrivate: project.isPrivate,
        myRole: role,
        isProposer: existing?.isProposer ?? false,
      });
    }

    return [...visible.values()];
  }

  async createProject(
    user: AuthenticatedUser,
    data: Prisma.ProjectCreateInput,
  ): Promise<ProjectDetailResponse> {
    this.authorization.assertCanCreateProject(user);
    try {
      const project = await this.createProjectRecord({
        ...data,
        proposer: { connect: { id: user.id } },
      });
      return mapProjectDetailResponse(project, true);
    } catch (error) {
      rethrowProjectCreateError(error);
    }
  }

  private createProjectRecord(
    data: Prisma.ProjectCreateInput,
  ): Promise<ProjectWithRelations> {
    return this.prisma.project.create({
      data,
      include: projectInclude,
    });
  }

  async updateProject(params: {
    user: AuthenticatedUser;
    where: Prisma.ProjectWhereUniqueInput;
    data: { name?: string };
  }): Promise<ProjectDetailResponse> {
    const { user, where, data } = params;
    const projectId = this.projectIdFromWhere(where);
    await this.authorization.assertCanManageProject(user, projectId);
    const project = await this.prisma.project.update({
      data,
      where,
      include: projectInclude,
    });

    return mapProjectDetailResponse(project, true);
  }

  async transitionProjectStatus(params: {
    user: AuthenticatedUser;
    projectId: number;
    nextStatus: ProjectStatus;
    description?: string;
  }): Promise<ProjectDetailResponse> {
    const { user, projectId, nextStatus, description } = params;
    const currentProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true },
    });

    if (!currentProject) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (!isValidProjectStatusTransition(currentProject.status, nextStatus)) {
      throw new BadRequestException(
        `Invalid project status transition: ${currentProject.status} -> ${nextStatus}`,
      );
    }

    await this.authorization.assertCanTransitionProject(
      user,
      projectId,
      currentProject.status,
      nextStatus,
    );

    const trimmedDescription = description?.trim() || null;

    if (!trimmedDescription && !user.roles.includes(UserRole.admin)) {
      throw new BadRequestException(
        'A reason is required to change the project status',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.project.update({
        where: { id: projectId },
        data: { status: nextStatus },
      });

      await transaction.projectStatusHistory.create({
        data: {
          projectId,
          previousStatus: currentProject.status,
          nextStatus,
          description: trimmedDescription,
          authorUserId: user.id,
        },
      });
    });

    const project = await this.project({ id: projectId }, user);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return project;
  }

  async deleteProject(
    user: AuthenticatedUser,
    where: Prisma.ProjectWhereUniqueInput,
  ): Promise<Project> {
    const projectId = this.projectIdFromWhere(where);
    await this.authorization.assertCanManageProject(user, projectId);
    return this.prisma.project.delete({ where });
  }

  async assignableUsers(
    user: AuthenticatedUser,
    projectId: number,
  ): Promise<AssignableUserResponse[]> {
    await this.authorization.assertCanAssignActors(user, projectId);

    const users = await this.prisma.user.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        roleAssignments: { select: { role: true } },
      },
    });

    return users.map((candidate) => ({
      id: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      roles: candidate.roleAssignments.map(({ role }) => role),
    }));
  }

  async addProjectActorAssignment(params: {
    user: AuthenticatedUser;
    projectId: number;
    userId: number;
    role: ActorRole;
  }): Promise<ProjectActorAssignmentResponse> {
    const { user: actingUser, projectId, userId, role } = params;

    await this.authorization.assertCanAssignActors(actingUser, projectId);
    await this.authorization.assertAssignableUser(userId, role);

    const [project, user, existingAssignment] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, isActive: true },
      }),
      this.prisma.projectActorAssignment.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      }),
    ]);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (existingAssignment) {
      throw new ConflictException('User is already assigned to this project');
    }

    const assignment = await this.prisma.projectActorAssignment.create({
      data: {
        role,
        project: {
          connect: { id: projectId },
        },
        user: {
          connect: { id: userId },
        },
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        assignedAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return assignment;
  }

  private projectIdFromWhere(where: Prisma.ProjectWhereUniqueInput): number {
    if (typeof where.id !== 'number') {
      throw new BadRequestException('A numeric project id is required');
    }

    return where.id;
  }
}
