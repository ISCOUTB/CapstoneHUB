import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import { assertProjectExists } from '../common/lookups';
import { findProjectProgram } from '../projects/project-programs.constants';
import {
  findMilestoneAssessmentTemplate,
  templateItemIds,
  templateItems,
  type MilestoneAssessmentAnswers,
  type MilestoneAssessmentTemplate,
} from './milestone-assessment-templates';
import {
  parseMilestoneAssessmentAnswers,
  summarizeMilestoneAssessment,
  type MilestoneAssessmentSummary,
} from './milestone-assessment-progress';

export type { MilestoneAssessmentSummary } from './milestone-assessment-progress';

export type ProjectMilestoneAssessmentResponse = {
  id: number | null;
  projectId: number;
  programId: string;
  programName: string;
  answers: MilestoneAssessmentAnswers;
  updatedAt: Date | null;
  template: MilestoneAssessmentTemplate | null;
  summary: MilestoneAssessmentSummary;
};

type SavedAssessment = {
  id: number;
  projectId: number;
  programId: string;
  answers: Prisma.JsonValue;
  updatedAt: Date;
};

@Injectable()
export class MilestoneAssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async assessmentsByProject(
    projectId: number,
    user: AuthenticatedUser,
  ): Promise<ProjectMilestoneAssessmentResponse[]> {
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertProjectMember(user, projectId);

    const [programRequirements, savedAssessments, canManage] =
      await Promise.all([
        this.prisma.projectProgramRequirement.findMany({
          where: { projectId },
          orderBy: { id: 'asc' },
          select: { programId: true },
        }),
        this.prisma.projectMilestoneAssessment.findMany({
          where: { projectId },
          select: {
            id: true,
            projectId: true,
            programId: true,
            answers: true,
            updatedAt: true,
          },
        }),
        this.authorization.canManageMilestoneAssessment(user, projectId),
      ]);

    const savedByProgram = new Map(
      savedAssessments.map((assessment) => [assessment.programId, assessment]),
    );

    return programRequirements.map(({ programId }) =>
      this.mapAssessment(
        projectId,
        programId,
        savedByProgram.get(programId),
        canManage,
      ),
    );
  }

  async saveAssessment(params: {
    projectId: number;
    programId: string;
    answers: Record<string, unknown>;
    user: AuthenticatedUser;
  }): Promise<ProjectMilestoneAssessmentResponse> {
    const { projectId, programId, answers, user } = params;
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertCanManageMilestoneAssessment(
      user,
      projectId,
    );

    const requirement = await this.prisma.projectProgramRequirement.findUnique({
      where: {
        projectId_programId: { projectId, programId },
      },
      select: { id: true },
    });
    if (!requirement) {
      throw new BadRequestException(
        'The program is not associated with this project',
      );
    }

    const template = findMilestoneAssessmentTemplate(programId);
    if (!template) {
      throw new BadRequestException(
        'There is no milestone assessment template for this program',
      );
    }

    const validItemIds = templateItemIds(template);
    const normalizedAnswers = this.normalizeAnswers(
      answers,
      validItemIds,
      template,
    );

    const saved = await this.prisma.$transaction(async (transaction) => {
      const assessmentKey = {
        projectId_programId: { projectId, programId },
      };
      const previous = await transaction.projectMilestoneAssessment.findUnique({
        where: assessmentKey,
        select: { answers: true },
      });
      const previousAnswers = parseMilestoneAssessmentAnswers(
        previous?.answers,
      );
      const changedItems = this.changedItems({
        projectId,
        programId,
        programName: template.programName,
        template,
        previousAnswers,
        nextAnswers: normalizedAnswers,
        userId: user.id,
      });

      const assessment = await transaction.projectMilestoneAssessment.upsert({
        where: assessmentKey,
        create: {
          projectId,
          programId,
          answers: normalizedAnswers as Prisma.InputJsonValue,
          updatedByUserId: user.id,
        },
        update: {
          answers: normalizedAnswers as Prisma.InputJsonValue,
          updatedByUserId: user.id,
        },
        select: {
          id: true,
          projectId: true,
          programId: true,
          answers: true,
          updatedAt: true,
        },
      });

      if (changedItems.length > 0) {
        await transaction.projectChangeHistory.createMany({
          data: changedItems,
        });
      }

      return assessment;
    });

    return this.mapAssessment(projectId, programId, saved, true);
  }

  private normalizeAnswers(
    answers: Record<string, unknown>,
    validItemIds: Set<string>,
    template: MilestoneAssessmentTemplate,
  ): MilestoneAssessmentAnswers {
    const itemsById = new Map(
      templateItems(template).map((item) => [item.id, item]),
    );
    const normalized: MilestoneAssessmentAnswers = {};

    for (const [itemId, value] of Object.entries(answers)) {
      if (!validItemIds.has(itemId)) {
        throw new BadRequestException(
          `Unknown milestone assessment item: ${itemId}`,
        );
      }

      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new BadRequestException(
          `Invalid milestone assessment answer for item ${itemId}`,
        );
      }

      const answer = value as { status?: unknown; observation?: unknown };
      if (![null, 'yes', 'no', 'na'].includes(answer.status as string | null)) {
        throw new BadRequestException(
          `Invalid status for milestone assessment item ${itemId}`,
        );
      }

      if (
        typeof answer.observation !== 'string' ||
        answer.observation.length > 1000
      ) {
        throw new BadRequestException(
          `Invalid observation for milestone assessment item ${itemId}`,
        );
      }

      normalized[itemId] = {
        status: answer.status as 'yes' | 'no' | 'na' | null,
        observation: answer.observation,
      };
    }

    // Keep unknown saved keys out of the response but preserve the template
    // order for stable frontend rendering and change detection.
    return Object.fromEntries(
      [...itemsById.keys()]
        .filter((itemId) => normalized[itemId] !== undefined)
        .map((itemId) => [itemId, normalized[itemId]]),
    );
  }

  private changedItems(params: {
    projectId: number;
    programId: string;
    programName: string;
    template: MilestoneAssessmentTemplate;
    previousAnswers: MilestoneAssessmentAnswers;
    nextAnswers: MilestoneAssessmentAnswers;
    userId: number;
  }): Prisma.ProjectChangeHistoryCreateManyInput[] {
    const itemLabels = new Map(
      templateItems(params.template).map((item) => [item.id, item.label]),
    );
    const itemIds = new Set([
      ...Object.keys(params.previousAnswers),
      ...Object.keys(params.nextAnswers),
    ]);

    return [...itemIds].flatMap((itemId) => {
      const previousValue = params.previousAnswers[itemId] ?? null;
      const newValue = params.nextAnswers[itemId] ?? null;
      if (JSON.stringify(previousValue) === JSON.stringify(newValue)) {
        return [];
      }

      return [
        {
          projectId: params.projectId,
          authorUserId: params.userId,
          field: 'milestone_assessment',
          previousValue: JSON.stringify({
            programId: params.programId,
            programName: params.programName,
            itemId,
            itemLabel: itemLabels.get(itemId) ?? itemId,
            answer: previousValue,
          }),
          newValue: JSON.stringify({
            programId: params.programId,
            programName: params.programName,
            itemId,
            itemLabel: itemLabels.get(itemId) ?? itemId,
            answer: newValue,
          }),
        },
      ];
    });
  }

  private mapAssessment(
    projectId: number,
    programId: string,
    saved: SavedAssessment | undefined,
    canManage: boolean,
  ): ProjectMilestoneAssessmentResponse {
    const template = findMilestoneAssessmentTemplate(programId) ?? null;
    const rawAnswers = parseMilestoneAssessmentAnswers(saved?.answers);
    const knownAnswers = template
      ? this.filterKnownAnswers(rawAnswers, template)
      : {};
    let answers: MilestoneAssessmentAnswers = {};
    if (template) {
      answers = canManage
        ? knownAnswers
        : this.filterStudentAnswers(knownAnswers);
    }

    return {
      id: saved?.id ?? null,
      projectId,
      programId,
      programName:
        template?.programName ??
        findProjectProgram(programId)?.name ??
        programId,
      answers,
      updatedAt: saved?.updatedAt ?? null,
      template,
      summary: summarizeMilestoneAssessment(programId, saved?.answers),
    };
  }

  private filterKnownAnswers(
    answers: MilestoneAssessmentAnswers,
    template: MilestoneAssessmentTemplate,
  ): MilestoneAssessmentAnswers {
    const itemIds = templateItemIds(template);
    return Object.fromEntries(
      Object.entries(answers).filter(([itemId]) => itemIds.has(itemId)),
    );
  }

  private filterStudentAnswers(
    answers: MilestoneAssessmentAnswers,
  ): MilestoneAssessmentAnswers {
    return Object.fromEntries(
      Object.entries(answers).flatMap(([itemId, answer]) => {
        if (answer.status !== 'yes' && !answer.observation.trim()) {
          return [];
        }

        return [
          [
            itemId,
            {
              status: answer.status === 'yes' ? 'yes' : null,
              observation: answer.observation,
            },
          ],
        ];
      }),
    );
  }
}
