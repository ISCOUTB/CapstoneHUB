import { apiRequest } from "@/lib/http";

export type KpiProjectStatus =
  | "proposed"
  | "under_review"
  | "approved"
  | "in_progress"
  | "paused"
  | "closed"
  | "cancelled"
  | "rejected";

export type KpiPhase = "semester_1" | "semester_2";

export type KpiPendingProposal = {
  id: number;
  name: string;
  proposerName: string | null;
  createdAt: string;
};

export type KpiPendingReview = {
  projectId: number;
  projectName: string;
  reportId: number;
  title: string;
  dueDate: string;
  submittedAt: string | null;
  overdue: boolean;
};

export type KpiOverdueMilestone = {
  projectId: number;
  projectName: string;
  milestoneId: number;
  title: string;
  dueDate: string;
};

export type KpiReviewWindow = {
  total: number;
  accepted: number;
  rejected: number;
  averageHours: number | null;
};

export type KpiResponse = {
  scope: "global" | "assigned";
  projects: {
    total: number;
    byStatus: { status: KpiProjectStatus; count: number }[];
    byPhase: { phase: KpiPhase; count: number }[];
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

export async function getKpis(): Promise<KpiResponse> {
  const kpis = await apiRequest<KpiResponse>("/api/stats/kpis", {
    action: "consultar los indicadores",
  });

  if (!kpis?.projects) {
    throw new Error(
      `Respuesta inesperada de /stats/kpis. Claves recibidas: ${
        Object.keys(kpis ?? {}).join(", ") || "(vacía)"
      }`,
    );
  }

  return kpis;
}
const KPI_ROLES = ["admin", "directivo", "teacher", "evaluator"] as const;

/**
 * El panel está disponible para docentes, evaluadores, directivos y
 * administradores. Docentes y evaluadores solo ven sus proyectos asignados.
 */
export function canViewKpis(roles: readonly string[]): boolean {
  return roles.some((role) =>
    (KPI_ROLES as readonly string[]).includes(role),
  );
}

export type SemesterBucket = {
  projects: number;
  /** Proyectos con decisión tomada (ya no están en propuesta/revisión). */
  decided: number;
  /** Proyectos con decisión que no fueron rechazados. */
  accepted: number;
  rejected: number;
  inProgress: number;
  closed: number;
  byStatus: { status: KpiProjectStatus; count: number }[];
  minimumMilestones: { total: number; completed: number };
  reports: { total: number; accepted: number };
};

export type CalendarSemester = SemesterBucket & {
  /** Semestre académico, p. ej. "2026-1". */
  period: string;
  year: number;
  half: 1 | 2;
};

export type PhaseSemester = SemesterBucket & { phase: KpiPhase };

export type SemesterStatsResponse = {
  totalProjects: number;
  calendar: CalendarSemester[];
  phases: PhaseSemester[];
};

export function getSemesterStats(): Promise<SemesterStatsResponse> {
  return apiRequest<SemesterStatsResponse>("/api/stats/semesters", {
    action: "consultar el panorama por semestre",
  });
}

const SEMESTER_STATS_ROLES = ["admin", "evaluator"] as const;

/** Solo quienes pueden ver todos los proyectos acceden al panorama global. */
export function canViewSemesterStats(roles: readonly string[]): boolean {
  return roles.some((role) =>
    (SEMESTER_STATS_ROLES as readonly string[]).includes(role),
  );
}
