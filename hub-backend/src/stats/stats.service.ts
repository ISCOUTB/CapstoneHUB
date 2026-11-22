import { Injectable } from '@nestjs/common';
import {
  ActorRole,
  Prisma,
  ProjectPhase,
  ProjectStatus,
  ReportStatus,
} from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuthorizationService } from '../auth/authorization.service';
import { PrismaService } from '../prisma.service';
import { buildSemesterStats, SemesterStatsResponse } from './semester-stats';
import { findMilestoneAssessmentTemplate } from '../milestone-assessments/milestone-assessment-templates';
import { summarizeMilestoneAssessment } from '../milestone-assessments/milestone-assessment-progress';

/** Máximo de pendientes listados por sección. */
const PENDING_ITEMS_LIMIT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
const LAST_WEEK_DAYS = 7;
const LAST_MONTH_DAYS = 30;
const MS_PER_HOUR = 60 * 60 * 1000;

/** Estados con ejecución vigente incluidos en el avance de evaluación de hitos. */
const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.approved,
  ProjectStatus.in_progress,
  ProjectStatus.paused,
];

export type KpiPendingProposal = {
  id: number;
  name: string;
  proposerName: string | null;
  createdAt: Date;
};

export type KpiPendingReview = {
  projectId: number;
  projectName: string;
  reportId: number;
  title: string;
  dueDate: Date;
  submittedAt: Date | null;
  overdue: boolean;
};

export type KpiMilestoneAssessmentProgressItem = {
  projectId: number;
  projectName: string;
  programId: string;
  programName: string;
  answeredItems: number;
  totalItems: number;
  percent: number;
};

export type KpiMilestoneAssessmentProgress = {
  percent: number | null;
  answeredItems: number;
  totalItems: number;
  pendingPrograms: number;
  items: KpiMilestoneAssessmentProgressItem[];
};

export type KpiReviewWindow = {
  total: number;
  accepted: number;
  rejected: number;
  averageHours: number | null;
};

export type KpiResponse = {
  scope: 'global' | 'assigned';
  projects: {
    total: number;
    byStatus: { status: ProjectStatus; count: number }[];
    byPhase: { phase: ProjectPhase; count: number }[];
  };
  pendingProposals: { count: number; items: KpiPendingProposal[] };
  pendingReviews: {
    count: number;
    overdueCount: number;
    items: KpiPendingReview[];
  };
  milestoneAssessmentProgress: KpiMilestoneAssessmentProgress;
  myReviews: {
    all: KpiReviewWindow;
    last30Days: KpiReviewWindow;
    lastWeek: KpiReviewWindow;
  };
};

type ReviewedReportRow = {
  status: ReportStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
};

type AssessmentProjectRow = {
  id: number;
  name: string;
  programRequirements: { programId: string }[];
  milestoneAssessments: { programId: string; answers: unknown }[];
};

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

function roundHours(hours: number): number {
  return Math.round(hours * 10) / 10;
}

/** Cuenta y promedia las revisiones propias, opcionalmente desde una fecha. */
function reviewWindow(
  rows: ReviewedReportRow[],
  since?: Date,
): KpiReviewWindow {
  const included = since
    ? rows.filter((row) => row.reviewedAt !== null && row.reviewedAt >= since)
    : rows;

  const durations = included.flatMap((row) =>
    row.reviewedAt === null || row.submittedAt === null
      ? []
      : [(row.reviewedAt.getTime() - row.submittedAt.getTime()) / MS_PER_HOUR],
  );

  const averageHours =
    durations.length > 0
      ? roundHours(
          durations.reduce((total, hours) => total + hours, 0) /
            durations.length,
        )
      : null;

  return {
    total: included.length,
    accepted: included.filter((row) => row.status === ReportStatus.accepted)
      .length,
    rejected: included.filter((row) => row.status === ReportStatus.rejected)
      .length,
    averageHours,
  };
}

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  /**
   * Panorama global por semestre. Solo para quienes pueden ver todos los
   * proyectos, porque incluye también los privados.
   */
  async semesterStats(user: AuthenticatedUser): Promise<SemesterStatsResponse> {
    this.authorization.assertCanViewAllProjectsStats(user);

    const rows = await this.prisma.project.findMany({
      select: {
        status: true,
        phase: true,
        startDate: true,
        createdAt: true,
        programRequirements: { select: { programId: true } },
        milestoneAssessments: { select: { programId: true, answers: true } },
        reports: { select: { status: true } },
      },
    });

    return buildSemesterStats(rows);
  }

  async kpisForUser(user: AuthenticatedUser): Promise<KpiResponse> {
    this.authorization.assertCanViewKpis(user);

    const global = this.authorization.canReviewAnyProject(user);
    const scope = this.projectScope(user, global);
    const activeScope: Prisma.ProjectWhereInput = {
      ...scope,
      status: { in: ACTIVE_PROJECT_STATUSES },
    };
    const now = new Date();

    const [
      total,
      byStatus,
      byPhase,
      pendingProposalCount,
      proposalItems,
      pendingReviewCount,
      overdueReviewCount,
      reviewItems,
      assessmentProjects,
      reviewRows,
    ] = await Promise.all([
      this.prisma.project.count({ where: scope }),
      this.prisma.project.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      }),
      this.prisma.project.groupBy({
        by: ['phase'],
        where: scope,
        _count: { _all: true },
      }),
      this.prisma.project.count({
        where: { ...scope, status: ProjectStatus.proposed },
      }),
      this.prisma.project.findMany({
        where: { ...scope, status: ProjectStatus.proposed },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: PENDING_ITEMS_LIMIT,
        select: {
          id: true,
          name: true,
          createdAt: true,
          proposer: { select: { fullName: true } },
          naturalProposer: { select: { fullName: true } },
        },
      }),
      this.prisma.projectReport.count({
        where: { status: ReportStatus.submitted, project: scope },
      }),
      this.prisma.projectReport.count({
        where: {
          status: ReportStatus.submitted,
          dueDate: { lt: now },
          project: scope,
        },
      }),
      this.prisma.projectReport.findMany({
        where: { status: ReportStatus.submitted, project: scope },
        orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
        take: PENDING_ITEMS_LIMIT,
        select: {
          id: true,
          title: true,
          dueDate: true,
          submittedAt: true,
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.project.findMany({
        where: activeScope,
        orderBy: [{ id: 'asc' }],
        select: {
          id: true,
          name: true,
          programRequirements: { select: { programId: true } },
          milestoneAssessments: {
            select: { programId: true, answers: true },
          },
        },
      }),
      this.prisma.projectReport.findMany({
        where: { reviewedByUserId: user.id, reviewedAt: { not: null } },
        select: { status: true, submittedAt: true, reviewedAt: true },
      }),
    ]);

    return {
      scope: global ? 'global' : 'assigned',
      projects: {
        total,
        byStatus: byStatus.map((group) => ({
          status: group.status,
          count: group._count._all,
        })),
        byPhase: byPhase.map((group) => ({
          phase: group.phase,
          count: group._count._all,
        })),
      },
      pendingProposals: {
        count: pendingProposalCount,
        items: proposalItems.map((project) => ({
          id: project.id,
          name: project.name,
          proposerName:
            project.proposer?.fullName ??
            project.naturalProposer?.fullName ??
            null,
          createdAt: project.createdAt,
        })),
      },
      pendingReviews: {
        count: pendingReviewCount,
        overdueCount: overdueReviewCount,
        items: reviewItems.map((report) => ({
          projectId: report.project.id,
          projectName: report.project.name,
          reportId: report.id,
          title: report.title,
          dueDate: report.dueDate,
          submittedAt: report.submittedAt,
          overdue: report.dueDate.getTime() < now.getTime(),
        })),
      },
      milestoneAssessmentProgress:
        this.milestoneAssessmentProgress(assessmentProjects),
      myReviews: {
        all: reviewWindow(reviewRows),
        last30Days: reviewWindow(reviewRows, daysAgo(now, LAST_MONTH_DAYS)),
        lastWeek: reviewWindow(reviewRows, daysAgo(now, LAST_WEEK_DAYS)),
      },
    };
  }

  private milestoneAssessmentProgress(
    projects: AssessmentProjectRow[],
  ): KpiMilestoneAssessmentProgress {
    const items: KpiMilestoneAssessmentProgressItem[] = [];

    for (const project of projects) {
      const savedByProgram = new Map(
        project.milestoneAssessments.map((assessment) => [
          assessment.programId,
          assessment.answers,
        ]),
      );

      for (const requirement of project.programRequirements) {
        const template = findMilestoneAssessmentTemplate(requirement.programId);
        if (!template) {
          continue;
        }

        const summary = summarizeMilestoneAssessment(
          requirement.programId,
          savedByProgram.get(requirement.programId),
        );
        if (summary.totalItems === 0) {
          continue;
        }

        items.push({
          projectId: project.id,
          projectName: project.name,
          programId: requirement.programId,
          programName: template.programName,
          answeredItems: summary.answeredItems,
          totalItems: summary.totalItems,
          percent: Math.round(
            (summary.answeredItems / summary.totalItems) * 100,
          ),
        });
      }
    }

    const answeredItems = items.reduce(
      (total, item) => total + item.answeredItems,
      0,
    );
    const totalItems = items.reduce(
      (total, item) => total + item.totalItems,
      0,
    );
    const pending = items
      .filter((item) => item.answeredItems < item.totalItems)
      .sort(
        (left, right) =>
          left.percent - right.percent ||
          left.projectName.localeCompare(right.projectName),
      );

    return {
      percent:
        totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : null,
      answeredItems,
      totalItems,
      pendingPrograms: pending.length,
      items: pending.slice(0, PENDING_ITEMS_LIMIT),
    };
  }

  /**
   * Los revisores globales (admin/directivo) ven todo el sistema; el resto,
   * solo los proyectos asignados como docente/evaluador o propuestos.
   */
  private projectScope(
    user: AuthenticatedUser,
    global: boolean,
  ): Prisma.ProjectWhereInput {
    if (global) {
      return {};
    }

    return {
      OR: [
        {
          actorAssignments: {
            some: {
              userId: user.id,
              role: { in: [ActorRole.teacher, ActorRole.evaluator] },
            },
          },
        },
        { proposerUserId: user.id },
      ],
    };
  }
}
