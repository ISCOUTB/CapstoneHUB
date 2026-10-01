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
  AssignableUserResponse,
  MyProjectResponse,
  ProjectActorAssignmentResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectWithRelations,
  mapProjectDetailResponse,
  mapProjectListResponse,
  projectInclude,
} from './projects.select';

export * from './projects.select';

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

/** Campos editables del proyecto, ya normalizados por el controlador. */
export type ProjectUpdateFields = {
  name?: string;
  description?: string;
  context?: string;
  location?: string | null;
  source?: ProjectSource;
  startDate?: Date | null;
  endDate?: Date | null;
  estimatedCost?: Prisma.Decimal | number | string | null;
  requiresLegalization?: boolean;
  isPrivate?: boolean;
  facultyAdvisor?: string | null;
  teamRequirements?: string | null;
  expectedOutcomes?: string | null;
  deliverables?: string[];
};

/** Valores actuales o resultantes de los campos auditables. */
type ProjectEditableValues = {
  name: string;
  description: string;
  context: string;
  location: string | null;
  source: ProjectSource;
  startDate: Date | null;
  endDate: Date | null;
  estimatedCost: Prisma.Decimal | number | string | null;
  requiresLegalization: boolean;
  isPrivate: boolean;
  facultyAdvisor: string | null;
  teamRequirements: string | null;
  expectedOutcomes: string | null;
  deliverables: string[];
};

/** Campos auditables, en el orden en que se registran en el historial. */
const EDITABLE_PROJECT_FIELDS = [
  'name',
  'description',
  'context',
  'location',
  'source',
  'startDate',
  'endDate',
  'estimatedCost',
  'requiresLegalization',
  'isPrivate',
  'facultyAdvisor',
  'teamRequirements',
  'expectedOutcomes',
  'deliverables',
] as const;

type EditableProjectField = (typeof EDITABLE_PROJECT_FIELDS)[number];

export type ProjectChangeRow = {
  field: string;
  previousValue: string | null;
  newValue: string | null;
};

function serializeProjectChangeValue(
  field: EditableProjectField,
  value: unknown,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (field === 'deliverables') {
    const list = Array.isArray(value) ? value : [];
    return JSON.stringify(
      list
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean),
    );
  }

  if (field === 'estimatedCost') {
    return new Prisma.Decimal(value as string | number).toString();
  }

  if (field === 'startDate' || field === 'endDate') {
    return new Date(value as string).toISOString();
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

/** Compara los valores previos y nuevos y devuelve una fila por campo cambiado. */
export function diffProjectUpdate(
  previous: ProjectEditableValues,
  next: ProjectEditableValues,
): ProjectChangeRow[] {
  const rows: ProjectChangeRow[] = [];

  for (const field of EDITABLE_PROJECT_FIELDS) {
    const previousValue = serializeProjectChangeValue(field, previous[field]);
    const newValue = serializeProjectChangeValue(field, next[field]);

    if (previousValue !== newValue) {
      rows.push({ field, previousValue, newValue });
    }
  }

  return rows;
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
          viewer,
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
      return mapProjectDetailResponse(project, true, user);
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

  /**
   * Edita los datos del proyecto y registra una fila de historial por cada
   * campo que cambió. Solo administradores y evaluadores; un proyecto cerrado
   * o rechazado es de solo lectura.
   */
  async updateProject(params: {
    user: AuthenticatedUser;
    projectId: number;
    fields: ProjectUpdateFields;
  }): Promise<ProjectDetailResponse> {
    const { user, projectId, fields } = params;

    const current = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        status: true,
        proposerUserId: true,
        name: true,
        description: true,
        context: true,
        location: true,
        source: true,
        startDate: true,
        endDate: true,
        estimatedCost: true,
        requiresLegalization: true,
        isPrivate: true,
        facultyAdvisor: true,
        teamRequirements: true,
        expectedOutcomes: true,
        deliverables: {
          select: { description: true },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!current) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    await this.authorization.assertCanEditProjectDetails(user, {
      id: current.id,
      proposerUserId: current.proposerUserId,
      status: current.status,
    });

    if (
      current.status === ProjectStatus.closed ||
      current.status === ProjectStatus.rejected
    ) {
      throw new ConflictException(
        'Projects cannot be edited once closed or rejected',
      );
    }

    const currentValues: ProjectEditableValues = {
      name: current.name,
      description: current.description,
      context: current.context,
      location: current.location,
      source: current.source,
      startDate: current.startDate,
      endDate: current.endDate,
      estimatedCost: current.estimatedCost,
      requiresLegalization: current.requiresLegalization,
      isPrivate: current.isPrivate,
      facultyAdvisor: current.facultyAdvisor,
      teamRequirements: current.teamRequirements,
      expectedOutcomes: current.expectedOutcomes,
      deliverables: current.deliverables.map(
        (deliverable) => deliverable.description,
      ),
    };

    const changeRows = diffProjectUpdate(
      currentValues,
      this.mergeUpdateFields(currentValues, fields),
    );
    const data = this.buildProjectUpdateData(fields);

    const project = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.project.update({
        where: { id: projectId },
        data,
        include: projectInclude,
      });

      if (changeRows.length > 0) {
        await transaction.projectChangeHistory.createMany({
          data: changeRows.map((row) => ({
            projectId,
            authorUserId: user.id,
            field: row.field,
            previousValue: row.previousValue,
            newValue: row.newValue,
          })),
        });
      }

      return updated;
    });

    return mapProjectDetailResponse(project, true, user);
  }

  /** Aplica los campos enviados sobre los valores actuales del proyecto. */
  private mergeUpdateFields(
    current: ProjectEditableValues,
    fields: ProjectUpdateFields,
  ): ProjectEditableValues {
    return {
      name: fields.name ?? current.name,
      description: fields.description ?? current.description,
      context: fields.context ?? current.context,
      location:
        fields.location !== undefined ? fields.location : current.location,
      source: fields.source ?? current.source,
      startDate:
        fields.startDate !== undefined ? fields.startDate : current.startDate,
      endDate: fields.endDate !== undefined ? fields.endDate : current.endDate,
      estimatedCost:
        fields.estimatedCost !== undefined
          ? fields.estimatedCost
          : current.estimatedCost,
      requiresLegalization:
        fields.requiresLegalization ?? current.requiresLegalization,
      isPrivate: fields.isPrivate ?? current.isPrivate,
      facultyAdvisor:
        fields.facultyAdvisor !== undefined
          ? fields.facultyAdvisor
          : current.facultyAdvisor,
      teamRequirements:
        fields.teamRequirements !== undefined
          ? fields.teamRequirements
          : current.teamRequirements,
      expectedOutcomes:
        fields.expectedOutcomes !== undefined
          ? fields.expectedOutcomes
          : current.expectedOutcomes,
      deliverables: fields.deliverables ?? current.deliverables,
    };
  }

  private buildProjectUpdateData(
    fields: ProjectUpdateFields,
  ): Prisma.ProjectUpdateInput {
    const data: Prisma.ProjectUpdateInput = {};

    if (fields.name !== undefined) data.name = fields.name;
    if (fields.description !== undefined) data.description = fields.description;
    if (fields.context !== undefined) data.context = fields.context;
    if (fields.location !== undefined) data.location = fields.location;
    if (fields.source !== undefined) data.source = fields.source;
    if (fields.startDate !== undefined) data.startDate = fields.startDate;
    if (fields.endDate !== undefined) data.endDate = fields.endDate;
    if (fields.estimatedCost !== undefined)
      data.estimatedCost = fields.estimatedCost;
    if (fields.requiresLegalization !== undefined)
      data.requiresLegalization = fields.requiresLegalization;
    if (fields.isPrivate !== undefined) data.isPrivate = fields.isPrivate;
    if (fields.facultyAdvisor !== undefined)
      data.facultyAdvisor = fields.facultyAdvisor;
    if (fields.teamRequirements !== undefined)
      data.teamRequirements = fields.teamRequirements;
    if (fields.expectedOutcomes !== undefined)
      data.expectedOutcomes = fields.expectedOutcomes;

    if (fields.deliverables !== undefined) {
      data.deliverables = {
        deleteMany: {},
        create: fields.deliverables.map((description) => ({ description })),
      };
    }

    return data;
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
