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

/** Máximo de pendientes listados por sección. */
const PENDING_ITEMS_LIMIT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
const LAST_WEEK_DAYS = 7;
const LAST_MONTH_DAYS = 30;
const MS_PER_HOUR = 60 * 60 * 1000;

/** Estados con ejecución vigente para los que se vigilan hitos vencidos. */
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

export type KpiOverdueMilestone = {
  projectId: number;
  projectName: string;
  milestoneId: number;
  title: string;
  dueDate: Date;
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
  overdueMilestones: { count: number; items: KpiOverdueMilestone[] };
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
        milestones: { select: { isMinimum: true, completed: true } },
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
      overdueMilestoneCount,
      milestoneItems,
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
      this.prisma.projectMilestones.count({
        where: {
          completed: false,
          dueDate: { lt: now },
          project: activeScope,
        },
      }),
      this.prisma.projectMilestones.findMany({
        where: {
          completed: false,
          dueDate: { lt: now },
          project: activeScope,
        },
        orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        take: PENDING_ITEMS_LIMIT,
        select: {
          id: true,
          title: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
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
      overdueMilestones: {
        count: overdueMilestoneCount,
        items: milestoneItems.map((milestone) => ({
          projectId: milestone.project.id,
          projectName: milestone.project.name,
          milestoneId: milestone.id,
          title: milestone.title,
          dueDate: milestone.dueDate,
        })),
      },
      myReviews: {
        all: reviewWindow(reviewRows),
        last30Days: reviewWindow(reviewRows, daysAgo(now, LAST_MONTH_DAYS)),
        lastWeek: reviewWindow(reviewRows, daysAgo(now, LAST_WEEK_DAYS)),
      },
    };
  }

  /**
   * Los revisores globales (admin/evaluador) ven todo el sistema; el resto,
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
