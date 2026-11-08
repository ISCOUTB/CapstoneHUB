import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus } from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import { assertProjectExists } from '../common/lookups';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';

const milestoneSelect = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  dueDate: true,
  completed: true,
  isMinimum: true,
  phase: true,
  createdAt: true,
  reportLinks: {
    select: {
      report: { select: { id: true, title: true, status: true } },
    },
  },
} as const satisfies Prisma.ProjectMilestonesSelect;

export type SelectedMilestone = Prisma.ProjectMilestonesGetPayload<{
  select: typeof milestoneSelect;
}>;

export type MilestoneReportSummary = {
  id: number;
  title: string;
  status: ReportStatus;
};

export type ProjectMilestoneResponse = Omit<
  SelectedMilestone,
  'reportLinks'
> & {
  reports: MilestoneReportSummary[];
};

function mapMilestone(milestone: SelectedMilestone): ProjectMilestoneResponse {
  const { reportLinks, ...rest } = milestone;
  return {
    ...rest,
    reports: reportLinks.map((link) => ({
      id: link.report.id,
      title: link.report.title,
      status: link.report.status,
    })),
  };
}

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async rubricsByProject(projectId: number, user: AuthenticatedUser) {
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertProjectMember(user, projectId);

    const rubrics = await this.prisma.projectMilestoneRubric.findMany({
      where: { projectId },
      orderBy: { programId: 'asc' },
      select: {
        id: true,
        projectId: true,
        programId: true,
        answers: true,
        updatedAt: true,
      },
    });

    if (await this.authorization.canManageMilestone(user, projectId)) {
      return rubrics;
    }

    return rubrics.map((rubric) => {
      const answers = rubric.answers;
      if (
        typeof answers !== 'object' ||
        answers === null ||
        Array.isArray(answers)
      ) {
        return { ...rubric, answers: {} };
      }

      const visibleAnswers = Object.fromEntries(
        Object.entries(answers).flatMap(([itemId, value]) => {
          if (
            typeof value !== 'object' ||
            value === null ||
            Array.isArray(value)
          ) {
            return [];
          }

          const answer = value as { status?: unknown; observation?: unknown };
          const observation =
            typeof answer.observation === 'string' ? answer.observation : '';
          if (answer.status !== 'yes' && !observation.trim()) {
            return [];
          }

          return [
            [
              itemId,
              {
                status: answer.status === 'yes' ? 'yes' : null,
                observation,
              },
            ],
          ];
        }),
      );

      return { ...rubric, answers: visibleAnswers };
    });
  }

  async saveProjectRubric(params: {
    projectId: number;
    programId: string;
    answers: Record<string, unknown>;
    user: AuthenticatedUser;
  }) {
    await assertProjectExists(this.prisma, params.projectId);
    await this.authorization.assertCanManageMilestone(
      params.user,
      params.projectId,
    );
    const requirement = await this.prisma.projectProgramRequirement.findUnique({
      where: {
        projectId_programId: {
          projectId: params.projectId,
          programId: params.programId,
        },
      },
      select: { id: true },
    });
    if (!requirement) {
      throw new BadRequestException(
        'The program is not associated with this project',
      );
    }

    for (const [itemId, value] of Object.entries(params.answers)) {
      if (
        !/^(\d+(\.\d+)?|overview-\d+)$/.test(itemId) ||
        typeof value !== 'object' ||
        value === null
      ) {
        throw new BadRequestException('Invalid rubric answer');
      }
      const answer = value as { status?: unknown; observation?: unknown };
      if (![null, 'yes', 'no', 'na'].includes(answer.status as string | null)) {
        throw new BadRequestException(
          `Invalid status for rubric item ${itemId}`,
        );
      }
      if (
        typeof answer.observation !== 'string' ||
        answer.observation.length > 1000
      ) {
        throw new BadRequestException(
          `Invalid observation for rubric item ${itemId}`,
        );
      }
    }

    return this.prisma.$transaction(async (transaction) => {
      const rubricKey = {
        projectId_programId: {
          projectId: params.projectId,
          programId: params.programId,
        },
      };
      const previousRubric =
        await transaction.projectMilestoneRubric.findUnique({
          where: rubricKey,
          select: { answers: true },
        });
      const previousAnswers =
        typeof previousRubric?.answers === 'object' &&
        previousRubric.answers !== null &&
        !Array.isArray(previousRubric.answers)
          ? (previousRubric.answers as Record<string, unknown>)
          : {};
      const changedItems = Object.keys({
        ...previousAnswers,
        ...params.answers,
      }).flatMap((itemId) => {
        const previousValue = previousAnswers[itemId] ?? null;
        const newValue = params.answers[itemId] ?? null;
        if (JSON.stringify(previousValue) === JSON.stringify(newValue)) {
          return [];
        }

        return [
          {
            projectId: params.projectId,
            authorUserId: params.user.id,
            field: 'milestone_rubric',
            previousValue: JSON.stringify({
              programId: params.programId,
              itemId,
              answer: previousValue,
            }),
            newValue: JSON.stringify({
              programId: params.programId,
              itemId,
              answer: newValue,
            }),
          },
        ];
      });

      const savedRubric = await transaction.projectMilestoneRubric.upsert({
        where: rubricKey,
        create: {
          projectId: params.projectId,
          programId: params.programId,
          answers: params.answers as Prisma.InputJsonValue,
          updatedByUserId: params.user.id,
        },
        update: {
          answers: params.answers as Prisma.InputJsonValue,
          updatedByUserId: params.user.id,
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

      return savedRubric;
    });
  }

  async milestonesByProject(
    projectId: number,
    user: AuthenticatedUser,
  ): Promise<ProjectMilestoneResponse[]> {
    await assertProjectExists(this.prisma, projectId);
    await this.authorization.assertProjectMember(user, projectId);

    const milestones = await this.prisma.projectMilestones.findMany({
      where: { projectId },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      select: milestoneSelect,
    });

    return milestones.map(mapMilestone);
  }

  async createMilestone(params: {
    projectId: number;
    data: CreateMilestoneDto;
    user: AuthenticatedUser;
  }): Promise<ProjectMilestoneResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true, phase: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${params.projectId} not found`);
    }
    await this.authorization.assertCanManageMilestone(
      params.user,
      params.projectId,
    );

    const title = params.data.title.trim();
    if (!title) {
      throw new BadRequestException('Milestone title is required');
    }

    const reportIds = this.normalizeReportIds(params.data.reportIds);
    await this.assertReportsBelongToProject(params.projectId, reportIds);

    const milestoneId = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.projectMilestones.create({
        data: {
          projectId: params.projectId,
          title,
          description: params.data.description?.trim() || null,
          dueDate: params.data.dueDate,
          completed: params.data.completed ?? false,
          isMinimum: params.data.isMinimum ?? false,
          phase: params.data.phase ?? project.phase,
        },
        select: { id: true },
      });

      if (reportIds.length > 0) {
        await transaction.milestoneReportLink.createMany({
          data: reportIds.map((reportId) => ({
            milestoneId: created.id,
            reportId,
          })),
        });
      }

      if (params.data.completed === true) {
        await this.assertLinkedReportsAccepted(transaction, created.id);
      }

      return created.id;
    });

    return this.getMilestoneOrThrow(milestoneId);
  }

  async updateMilestone(params: {
    projectId: number;
    milestoneId: number;
    data: UpdateMilestoneDto;
    user: AuthenticatedUser;
  }): Promise<ProjectMilestoneResponse> {
    await assertProjectExists(this.prisma, params.projectId);
    await this.authorization.assertCanManageMilestone(
      params.user,
      params.projectId,
    );
    await this.assertMilestoneBelongsToProject(
      params.projectId,
      params.milestoneId,
    );

    const updateData: Prisma.ProjectMilestonesUpdateInput = {};

    if (params.data.title !== undefined) {
      const title = params.data.title.trim();
      if (!title) {
        throw new BadRequestException('Milestone title is required');
      }
      updateData.title = title;
    }
    if (params.data.description !== undefined) {
      updateData.description = params.data.description.trim() || null;
    }
    if (params.data.dueDate !== undefined) {
      updateData.dueDate = params.data.dueDate;
    }
    if (params.data.isMinimum !== undefined) {
      updateData.isMinimum = params.data.isMinimum;
    }
    if (params.data.phase !== undefined) {
      updateData.phase = params.data.phase;
    }

    const reportIds =
      params.data.reportIds !== undefined
        ? this.normalizeReportIds(params.data.reportIds)
        : undefined;
    if (reportIds !== undefined) {
      await this.assertReportsBelongToProject(params.projectId, reportIds);
    }

    const hasFieldUpdate = Object.keys(updateData).length > 0;
    const hasCompletedUpdate = params.data.completed !== undefined;
    if (!hasFieldUpdate && reportIds === undefined && !hasCompletedUpdate) {
      throw new BadRequestException('No update fields provided');
    }

    await this.prisma.$transaction(async (transaction) => {
      if (reportIds !== undefined) {
        await transaction.milestoneReportLink.deleteMany({
          where: { milestoneId: params.milestoneId },
        });
        if (reportIds.length > 0) {
          await transaction.milestoneReportLink.createMany({
            data: reportIds.map((reportId) => ({
              milestoneId: params.milestoneId,
              reportId,
            })),
          });
        }
      }

      if (hasFieldUpdate) {
        await transaction.projectMilestones.update({
          where: { id: params.milestoneId },
          data: updateData,
        });
      }

      if (params.data.completed === true) {
        await this.assertLinkedReportsAccepted(transaction, params.milestoneId);
        await transaction.projectMilestones.update({
          where: { id: params.milestoneId },
          data: { completed: true },
        });
      } else if (params.data.completed === false) {
        await transaction.projectMilestones.update({
          where: { id: params.milestoneId },
          data: { completed: false },
        });
      }
    });

    return this.getMilestoneOrThrow(params.milestoneId);
  }

  async deleteMilestone(params: {
    projectId: number;
    milestoneId: number;
    user: AuthenticatedUser;
  }): Promise<ProjectMilestoneResponse> {
    await assertProjectExists(this.prisma, params.projectId);
    await this.authorization.assertCanManageMilestone(
      params.user,
      params.projectId,
    );
    await this.assertMilestoneBelongsToProject(
      params.projectId,
      params.milestoneId,
    );

    const milestone = await this.prisma.projectMilestones.delete({
      where: { id: params.milestoneId },
      select: milestoneSelect,
    });

    return mapMilestone(milestone);
  }

  private async getMilestoneOrThrow(
    milestoneId: number,
  ): Promise<ProjectMilestoneResponse> {
    const milestone = await this.prisma.projectMilestones.findUnique({
      where: { id: milestoneId },
      select: milestoneSelect,
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone ${milestoneId} not found`);
    }
    return mapMilestone(milestone);
  }

  private normalizeReportIds(reportIds?: number[]): number[] {
    if (!reportIds || reportIds.length === 0) {
      return [];
    }
    return [...new Set(reportIds)];
  }

  private async assertReportsBelongToProject(
    projectId: number,
    reportIds: number[],
  ): Promise<void> {
    if (reportIds.length === 0) {
      return;
    }
    const reports = await this.prisma.projectReport.findMany({
      where: { id: { in: reportIds }, projectId },
      select: { id: true },
    });
    if (reports.length !== reportIds.length) {
      throw new BadRequestException(
        'Some reports do not belong to this project',
      );
    }
  }

  /** Bloquea completar un hito si alguna entrega vinculada no está aceptada. */
  private async assertLinkedReportsAccepted(
    transaction: Prisma.TransactionClient,
    milestoneId: number,
  ): Promise<void> {
    const links = await transaction.milestoneReportLink.findMany({
      where: { milestoneId },
      select: {
        report: { select: { id: true, title: true, status: true } },
      },
    });
    const pending = links
      .map((link) => link.report)
      .filter((report) => report.status !== ReportStatus.accepted);

    if (pending.length > 0) {
      throw new ConflictException(
        `Cannot complete the milestone while linked reports are not accepted: ${pending
          .map((report) => report.title)
          .join(', ')}`,
      );
    }
  }

  private async assertMilestoneBelongsToProject(
    projectId: number,
    milestoneId: number,
  ): Promise<void> {
    const milestone = await this.prisma.projectMilestones.findFirst({
      where: { id: milestoneId, projectId },
      select: { id: true },
    });

    if (!milestone) {
      throw new NotFoundException(
        `Milestone ${milestoneId} not found in project ${projectId}`,
      );
    }
  }
}
