import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectPhase,
  ProjectStatus,
  UserRole,
} from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import {
  CreateRubricTemplateDto,
  RubricCriterionDto,
  UpdateRubricTemplateDto,
} from './rubrics.dto';

const rubricTemplateSelect = {
  id: true,
  name: true,
  description: true,
  area: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  criteria: {
    select: {
      id: true,
      position: true,
      title: true,
      description: true,
      weightPercent: true,
    },
    orderBy: { position: 'asc' },
  },
} as const satisfies Prisma.RubricTemplateSelect;

export type RubricCriterionResponse = {
  id: number;
  position: number;
  title: string;
  description: string | null;
  weightPercent: number;
};

export type RubricTemplateResponse = {
  id: number;
  name: string;
  description: string | null;
  area: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  criteria: RubricCriterionResponse[];
};

const TERMINAL_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.closed,
  ProjectStatus.cancelled,
  ProjectStatus.rejected,
];

function managerRole(user: AuthenticatedUser): boolean {
  return (
    user.roles.includes(UserRole.admin) ||
    user.roles.includes(UserRole.directivo)
  );
}

/** Valida que los porcentajes de una plantilla sumen exactamente 100. */
export function assertCriteriaWeights(criteria: RubricCriterionDto[]): void {
  if (criteria.length === 0) {
    throw new BadRequestException('A rubric needs at least one criterion');
  }

  if (
    criteria.some(
      (criterion) =>
        !Number.isInteger(criterion.weightPercent) ||
        criterion.weightPercent < 1 ||
        criterion.weightPercent > 100,
    )
  ) {
    throw new BadRequestException(
      'Every rubric criterion must weigh between 1 and 100 percent',
    );
  }

  const total = criteria.reduce(
    (sum, criterion) => sum + criterion.weightPercent,
    0,
  );

  if (total !== 100) {
    throw new BadRequestException(
      `Rubric criterion weights must add up to 100 (got ${total})`,
    );
  }
}

@Injectable()
export class RubricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async templates(user: AuthenticatedUser): Promise<RubricTemplateResponse[]> {
    this.authorization.assertCanManageRubrics(user);

    const templates = await this.prisma.rubricTemplate.findMany({
      select: rubricTemplateSelect,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return templates.map((template) => this.mapTemplate(template));
  }

  async template(
    user: AuthenticatedUser,
    id: number,
  ): Promise<RubricTemplateResponse> {
    this.authorization.assertCanManageRubrics(user);

    const template = await this.prisma.rubricTemplate.findUnique({
      where: { id },
      select: rubricTemplateSelect,
    });

    if (!template) {
      throw new NotFoundException(`Rubric template ${id} not found`);
    }

    return this.mapTemplate(template);
  }

  async createTemplate(
    user: AuthenticatedUser,
    data: CreateRubricTemplateDto,
  ): Promise<RubricTemplateResponse> {
    this.authorization.assertCanManageRubrics(user);
    assertCriteriaWeights(data.criteria);

    const name = data.name.trim();
    if (!name) {
      throw new BadRequestException('Rubric template name is required');
    }

    const template = await this.prisma.rubricTemplate.create({
      data: {
        name,
        description: data.description?.trim() || null,
        area: data.area?.trim() || null,
        createdBy: { connect: { id: user.id } },
        criteria: {
          create: data.criteria.map((criterion, index) => ({
            position: index + 1,
            title: criterion.title.trim(),
            description: criterion.description?.trim() || null,
            weightPercent: criterion.weightPercent,
          })),
        },
      },
      select: rubricTemplateSelect,
    });

    return this.mapTemplate(template);
  }

  async updateTemplate(
    user: AuthenticatedUser,
    id: number,
    data: UpdateRubricTemplateDto,
  ): Promise<RubricTemplateResponse> {
    this.authorization.assertCanManageRubrics(user);

    const current = await this.prisma.rubricTemplate.findUnique({
      where: { id },
      select: { id: true, isDefault: true },
    });

    if (!current) {
      throw new NotFoundException(`Rubric template ${id} not found`);
    }

    if (current.isDefault) {
      throw new BadRequestException(
        'The default rubric template cannot be edited',
      );
    }

    if (data.criteria !== undefined) {
      assertCriteriaWeights(data.criteria);
    }

    const evaluationCount = await this.prisma.projectEvaluation.count({
      where: { rubricTemplateId: id },
    });

    if (evaluationCount > 0) {
      throw new ConflictException(
        'A rubric template with submitted evaluations cannot be edited; create a new template instead',
      );
    }

    const updateData: Prisma.RubricTemplateUpdateInput = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestException('Rubric template name is required');
      }
      updateData.name = name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }

    if (data.area !== undefined) {
      updateData.area = data.area.trim() || null;
    }

    const template = await this.prisma.$transaction(async (transaction) => {
      if (data.criteria !== undefined) {
        await transaction.rubricCriterion.deleteMany({
          where: { rubricTemplateId: id },
        });
        await transaction.rubricCriterion.createMany({
          data: data.criteria.map((criterion, index) => ({
            rubricTemplateId: id,
            position: index + 1,
            title: criterion.title.trim(),
            description: criterion.description?.trim() || null,
            weightPercent: criterion.weightPercent,
          })),
        });
      }

      return transaction.rubricTemplate.update({
        where: { id },
        data: updateData,
        select: rubricTemplateSelect,
      });
    });

    return this.mapTemplate(template);
  }

  async archiveTemplate(
    user: AuthenticatedUser,
    id: number,
  ): Promise<RubricTemplateResponse> {
    this.authorization.assertCanManageRubrics(user);

    const template = await this.prisma.rubricTemplate.findUnique({
      where: { id },
      select: { id: true, isDefault: true, isActive: true },
    });

    if (!template) {
      throw new NotFoundException(`Rubric template ${id} not found`);
    }

    if (template.isDefault) {
      throw new BadRequestException(
        'The default rubric template cannot be archived',
      );
    }

    if (!template.isActive) {
      return this.template(user, id);
    }

    const [assignmentCount, evaluationCount] = await Promise.all([
      this.prisma.projectRubricAssignment.count({
        where: { rubricTemplateId: id },
      }),
      this.prisma.projectEvaluation.count({ where: { rubricTemplateId: id } }),
    ]);

    if (assignmentCount > 0) {
      throw new ConflictException(
        'This rubric template is assigned to one or more projects and cannot be archived',
      );
    }

    if (evaluationCount > 0) {
      throw new ConflictException(
        'This rubric template has evaluations and cannot be archived',
      );
    }

    await this.prisma.rubricTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return this.template(user, id);
  }

  /**
   * Rúbrica vigente para un proyecto y fase: la asignación explícita o, si no
   * existe, la plantilla general del sistema.
   */
  async rubricForPhase(
    projectId: number,
    phase: ProjectPhase,
  ): Promise<RubricTemplateResponse> {
    const assignment = await this.prisma.projectRubricAssignment.findUnique({
      where: { projectId_phase: { projectId, phase } },
      select: {
        rubricTemplate: { select: rubricTemplateSelect },
      },
    });

    if (assignment) {
      return this.mapTemplate(assignment.rubricTemplate);
    }

    const defaultTemplate = await this.prisma.rubricTemplate.findFirst({
      where: { isDefault: true, isActive: true },
      select: rubricTemplateSelect,
    });

    if (!defaultTemplate) {
      throw new ConflictException(
        'The default rubric template is not configured',
      );
    }

    return this.mapTemplate(defaultTemplate);
  }

  async assignTemplate(params: {
    user: AuthenticatedUser;
    projectId: number;
    phase: ProjectPhase;
    rubricTemplateId: number;
  }): Promise<RubricTemplateResponse> {
    const { user, projectId, phase, rubricTemplateId } = params;
    this.authorization.assertCanManageRubrics(user);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (TERMINAL_PROJECT_STATUSES.includes(project.status)) {
      throw new BadRequestException(
        'Rubrics cannot be assigned to a closed project',
      );
    }

    const template = await this.prisma.rubricTemplate.findUnique({
      where: { id: rubricTemplateId },
      select: { id: true, name: true, isActive: true, isDefault: true },
    });

    if (!template) {
      throw new NotFoundException(
        `Rubric template ${rubricTemplateId} not found`,
      );
    }

    if (!template.isActive) {
      throw new BadRequestException(
        'Only active rubric templates can be assigned',
      );
    }

    await this.assertPhaseHasNoEvaluations(projectId, phase);

    const previous = await this.prisma.projectRubricAssignment.findUnique({
      where: { projectId_phase: { projectId, phase } },
      select: {
        rubricTemplateId: true,
        rubricTemplate: { select: { name: true } },
      },
    });

    if (previous?.rubricTemplateId === rubricTemplateId) {
      return this.rubricForPhase(projectId, phase);
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.projectRubricAssignment.upsert({
        where: { projectId_phase: { projectId, phase } },
        create: {
          projectId,
          phase,
          rubricTemplateId,
          assignedByUserId: user.id,
        },
        update: {
          rubricTemplateId,
          assignedByUserId: user.id,
          assignedAt: new Date(),
        },
      });

      await transaction.projectChangeHistory.create({
        data: {
          projectId,
          authorUserId: user.id,
          field: `rubric_${phase}`,
          previousValue: previous?.rubricTemplate.name ?? 'Nota general',
          newValue: template.name,
        },
      });
    });

    return this.rubricForPhase(projectId, phase);
  }

  async clearTemplate(params: {
    user: AuthenticatedUser;
    projectId: number;
    phase: ProjectPhase;
  }): Promise<RubricTemplateResponse> {
    const { user, projectId, phase } = params;
    this.authorization.assertCanManageRubrics(user);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (TERMINAL_PROJECT_STATUSES.includes(project.status)) {
      throw new BadRequestException(
        'Rubrics cannot be changed on a closed project',
      );
    }

    await this.assertPhaseHasNoEvaluations(projectId, phase);

    const previous = await this.prisma.projectRubricAssignment.findUnique({
      where: { projectId_phase: { projectId, phase } },
      select: { rubricTemplate: { select: { name: true } } },
    });

    if (!previous) {
      return this.rubricForPhase(projectId, phase);
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.projectRubricAssignment.delete({
        where: { projectId_phase: { projectId, phase } },
      });
      await transaction.projectChangeHistory.create({
        data: {
          projectId,
          authorUserId: user.id,
          field: `rubric_${phase}`,
          previousValue: previous.rubricTemplate.name,
          newValue: 'Nota general',
        },
      });
    });

    return this.rubricForPhase(projectId, phase);
  }

  isManager(user: AuthenticatedUser): boolean {
    return managerRole(user);
  }

  private async assertPhaseHasNoEvaluations(
    projectId: number,
    phase: ProjectPhase,
  ): Promise<void> {
    const count = await this.prisma.projectEvaluation.count({
      where: { projectId, phase },
    });

    if (count > 0) {
      throw new ConflictException(
        'The rubric cannot be changed after the phase has evaluations',
      );
    }
  }

  private mapTemplate(
    template: Prisma.RubricTemplateGetPayload<{
      select: typeof rubricTemplateSelect;
    }>,
  ): RubricTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      area: template.area,
      isDefault: template.isDefault,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      criteria: template.criteria.map((criterion) => ({
        id: criterion.id,
        position: criterion.position,
        title: criterion.title,
        description: criterion.description,
        weightPercent: criterion.weightPercent,
      })),
    };
  }
}
