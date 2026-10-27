import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorRole,
  Prisma,
  ProjectPhase,
  ProjectStatus,
  UserRole,
} from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import {
  RubricTemplateResponse,
  RubricsService,
} from '../rubrics/rubrics.service';
import { SaveProjectEvaluationDto } from './evaluations.dto';

const evaluationSelect = {
  id: true,
  projectId: true,
  phase: true,
  rubricTemplateId: true,
  totalScore: true,
  generalComment: true,
  submittedAt: true,
  updatedAt: true,
  evaluator: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  criteria: {
    select: {
      id: true,
      position: true,
      title: true,
      weightPercent: true,
      score: true,
      comment: true,
    },
    orderBy: { position: 'asc' },
  },
} as const satisfies Prisma.ProjectEvaluationSelect;

export type ProjectEvaluationResponse = {
  id: number;
  projectId: number;
  phase: ProjectPhase;
  rubricTemplateId: number;
  totalScore: number;
  generalComment: string | null;
  submittedAt: Date;
  updatedAt: Date;
  evaluator: {
    id: number;
    fullName: string;
    email: string;
  };
  criteria: {
    id: number;
    position: number;
    title: string;
    weightPercent: number;
    score: number;
    comment: string | null;
  }[];
};

export type PhaseRequiredEvaluatorResponse = {
  userId: number;
  fullName: string;
  evaluatedAt: Date | null;
};

export type PhaseEvaluationResponse = {
  phase: ProjectPhase;
  isCurrent: boolean;
  rubric: RubricTemplateResponse;
  evaluations: ProjectEvaluationResponse[];
  averageScore: number | null;
  requiredEvaluators: PhaseRequiredEvaluatorResponse[];
  missingEvaluators: { userId: number; fullName: string }[];
  completed: boolean;
  canEvaluate: boolean;
  canAssignRubric: boolean;
};

export type ProjectEvaluationsResponse = {
  project: {
    id: number;
    name: string;
    status: ProjectStatus;
    phase: ProjectPhase;
  };
  phases: PhaseEvaluationResponse[];
  availableTemplates?: RubricTemplateResponse[];
};

export type EvaluationGateResponse = {
  phase: ProjectPhase;
  completed: boolean;
  missingEvaluators: { userId: number; fullName: string }[];
};

const TERMINAL_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.closed,
  ProjectStatus.cancelled,
  ProjectStatus.rejected,
];

const EVALUATION_PHASES: ProjectPhase[] = [
  ProjectPhase.semester_1,
  ProjectPhase.semester_2,
];

function roundScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isManager(user: AuthenticatedUser): boolean {
  return (
    user.roles.includes(UserRole.admin) ||
    user.roles.includes(UserRole.directivo)
  );
}

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
    private readonly rubrics: RubricsService,
  ) {}

  async listProjectEvaluations(
    user: AuthenticatedUser,
    projectId: number,
  ): Promise<ProjectEvaluationsResponse> {
    await this.authorization.assertCanViewProjectEvaluations(user, projectId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true, phase: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const manager = isManager(user);
    const isAdmin = user.roles.includes(UserRole.admin);
    const isAssignedEvaluator = await this.isAssignedEvaluator(
      user.id,
      projectId,
    );

    const phases = await Promise.all(
      EVALUATION_PHASES.map(async (phase) => {
        const [rubric, evaluations, evaluators] = await Promise.all([
          this.rubrics.rubricForPhase(projectId, phase),
          this.prisma.projectEvaluation.findMany({
            where: { projectId, phase },
            select: evaluationSelect,
            orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
          }),
          this.prisma.projectActorAssignment.findMany({
            where: { projectId, role: ActorRole.evaluator },
            select: {
              userId: true,
              assignedAt: true,
              user: { select: { fullName: true } },
            },
            orderBy: [{ assignedAt: 'asc' }, { id: 'asc' }],
          }),
        ]);

        const evaluationByUser = new Map(
          evaluations.map((evaluation) => [
            evaluation.evaluator.id,
            evaluation,
          ]),
        );

        const requiredEvaluators = evaluators.map((evaluator) => ({
          userId: evaluator.userId,
          fullName: evaluator.user.fullName,
          evaluatedAt:
            evaluationByUser.get(evaluator.userId)?.submittedAt ?? null,
        }));

        const missingEvaluators = requiredEvaluators
          .filter((evaluator) => evaluator.evaluatedAt === null)
          .map(({ userId, fullName }) => ({ userId, fullName }));

        const completed =
          evaluators.length > 0
            ? missingEvaluators.length === 0
            : evaluations.length > 0;

        const averageScore =
          evaluations.length > 0
            ? roundScore(
                evaluations.reduce(
                  (sum, evaluation) => sum + Number(evaluation.totalScore),
                  0,
                ) / evaluations.length,
              )
            : null;

        const canSubmit =
          (isAdmin || isAssignedEvaluator) &&
          project.status === ProjectStatus.in_progress &&
          project.phase === phase;

        return {
          phase,
          isCurrent: project.phase === phase,
          rubric,
          evaluations: evaluations.map((evaluation) =>
            this.mapEvaluation(evaluation),
          ),
          averageScore,
          requiredEvaluators,
          missingEvaluators,
          completed,
          canEvaluate: canSubmit,
          canAssignRubric:
            manager &&
            !TERMINAL_PROJECT_STATUSES.includes(project.status) &&
            evaluations.length === 0,
        } satisfies PhaseEvaluationResponse;
      }),
    );

    return {
      project,
      phases,
      availableTemplates: manager
        ? await this.rubrics.templates(user)
        : undefined,
    };
  }

  async saveEvaluation(params: {
    user: AuthenticatedUser;
    projectId: number;
    phase: ProjectPhase;
    data: SaveProjectEvaluationDto;
  }): Promise<ProjectEvaluationsResponse> {
    const { user, projectId, phase, data } = params;
    await this.authorization.assertCanSubmitProjectEvaluation(user, projectId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true, phase: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.status !== ProjectStatus.in_progress) {
      throw new BadRequestException(
        'The project must be in progress to submit an evaluation',
      );
    }

    if (project.phase !== phase) {
      throw new BadRequestException(
        'Evaluations can only be submitted for the current project phase',
      );
    }

    const rubric = await this.rubrics.rubricForPhase(projectId, phase);
    const rubricCriteria = new Map(
      rubric.criteria.map((criterion) => [criterion.id, criterion]),
    );

    if (data.criteria.length !== rubric.criteria.length) {
      throw new BadRequestException(
        'Every rubric criterion must be evaluated exactly once',
      );
    }

    const seen = new Set<number>();
    for (const criterion of data.criteria) {
      if (!rubricCriteria.has(criterion.criterionId)) {
        throw new BadRequestException(
          `Criterion ${criterion.criterionId} does not belong to the current rubric`,
        );
      }
      if (seen.has(criterion.criterionId)) {
        throw new BadRequestException(
          `Criterion ${criterion.criterionId} was evaluated more than once`,
        );
      }
      seen.add(criterion.criterionId);
    }

    if (seen.size !== rubric.criteria.length) {
      throw new BadRequestException(
        'Every rubric criterion must be evaluated exactly once',
      );
    }

    const totalScore = roundScore(
      data.criteria.reduce((sum, criterion) => {
        const rubricCriterion = rubricCriteria.get(criterion.criterionId)!;
        return sum + (criterion.score * rubricCriterion.weightPercent) / 100;
      }, 0),
    );

    const generalComment = data.generalComment?.trim() || null;
    const criteriaData = data.criteria.map((criterion) => {
      const rubricCriterion = rubricCriteria.get(criterion.criterionId)!;
      return {
        position: rubricCriterion.position,
        title: rubricCriterion.title,
        weightPercent: rubricCriterion.weightPercent,
        score: criterion.score,
        comment: criterion.comment?.trim() || null,
      };
    });

    const existing = await this.prisma.projectEvaluation.findUnique({
      where: {
        projectId_phase_evaluatorUserId: {
          projectId,
          phase,
          evaluatorUserId: user.id,
        },
      },
      select: { id: true },
    });

    await this.prisma.$transaction(async (transaction) => {
      if (existing) {
        await transaction.projectEvaluation.update({
          where: { id: existing.id },
          data: {
            rubricTemplateId: rubric.id,
            totalScore,
            generalComment,
            criteria: {
              deleteMany: {},
              create: criteriaData,
            },
          },
        });
        return;
      }

      await transaction.projectEvaluation.create({
        data: {
          project: { connect: { id: projectId } },
          phase,
          evaluator: { connect: { id: user.id } },
          rubricTemplate: { connect: { id: rubric.id } },
          totalScore,
          generalComment,
          criteria: { create: criteriaData },
        },
      });
    });

    return this.listProjectEvaluations(user, projectId);
  }

  /**
   * Estado mínimo de evaluación de una fase, sin notas. Se usa para bloquear
   * el avance y para el resumen del detalle del proyecto.
   */
  async phaseGate(
    projectId: number,
    phase: ProjectPhase,
  ): Promise<EvaluationGateResponse> {
    const [evaluators, evaluations] = await Promise.all([
      this.prisma.projectActorAssignment.findMany({
        where: { projectId, role: ActorRole.evaluator },
        select: {
          userId: true,
          assignedAt: true,
          user: { select: { fullName: true } },
        },
        orderBy: [{ assignedAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.projectEvaluation.findMany({
        where: { projectId, phase },
        select: { evaluatorUserId: true },
      }),
    ]);

    const evaluated = new Set(
      evaluations.map((evaluation) => evaluation.evaluatorUserId),
    );

    const missingEvaluators = evaluators
      .filter((evaluator) => !evaluated.has(evaluator.userId))
      .map((evaluator) => ({
        userId: evaluator.userId,
        fullName: evaluator.user.fullName,
      }));

    return {
      phase,
      completed:
        evaluators.length > 0
          ? missingEvaluators.length === 0
          : evaluations.length > 0,
      missingEvaluators,
    };
  }

  async assertPhaseEvaluated(
    projectId: number,
    phase: ProjectPhase,
    action: 'advance' | 'close',
  ): Promise<void> {
    const gate = await this.phaseGate(projectId, phase);

    if (gate.completed) {
      return;
    }

    const actionLabel =
      action === 'advance' ? 'advance to the next phase' : 'close the project';

    if (gate.missingEvaluators.length > 0) {
      throw new ConflictException(
        `Cannot ${actionLabel} until every assigned evaluator submits an evaluation: ${gate.missingEvaluators
          .map((evaluator) => evaluator.fullName)
          .join(', ')}`,
      );
    }

    throw new ConflictException(
      `Cannot ${actionLabel} until at least one evaluation is submitted for the current phase`,
    );
  }

  private async isAssignedEvaluator(
    userId: number,
    projectId: number,
  ): Promise<boolean> {
    const assignment = await this.prisma.projectActorAssignment.findFirst({
      where: { projectId, userId, role: ActorRole.evaluator },
      select: { id: true },
    });

    return assignment !== null;
  }

  private mapEvaluation(
    evaluation: Prisma.ProjectEvaluationGetPayload<{
      select: typeof evaluationSelect;
    }>,
  ): ProjectEvaluationResponse {
    return {
      id: evaluation.id,
      projectId: evaluation.projectId,
      phase: evaluation.phase,
      rubricTemplateId: evaluation.rubricTemplateId,
      totalScore: Number(evaluation.totalScore),
      generalComment: evaluation.generalComment,
      submittedAt: evaluation.submittedAt,
      updatedAt: evaluation.updatedAt,
      evaluator: evaluation.evaluator,
      criteria: evaluation.criteria.map((criterion) => ({
        id: criterion.id,
        position: criterion.position,
        title: criterion.title,
        weightPercent: criterion.weightPercent,
        score: Number(criterion.score),
        comment: criterion.comment,
      })),
    };
  }
}
