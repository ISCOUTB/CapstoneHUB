import {
  ProjectPhase,
  ProjectStatus,
  ReportStatus,
} from '../generated/prisma/client';

/** Fila mínima de proyecto necesaria para calcular las estadísticas. */
export type SemesterStatsRow = {
  status: ProjectStatus;
  phase: ProjectPhase;
  startDate: Date | null;
  createdAt: Date;
  milestones: { isMinimum: boolean; completed: boolean }[];
  reports: { status: ReportStatus }[];
};

export type SemesterStatsBucket = {
  projects: number;
  /** Proyectos con decisión tomada (ya no están en propuesta/revisión). */
  decided: number;
  /** Proyectos con decisión que no fueron rechazados. */
  accepted: number;
  rejected: number;
  inProgress: number;
  closed: number;
  byStatus: { status: ProjectStatus; count: number }[];
  minimumMilestones: { total: number; completed: number };
  reports: { total: number; accepted: number };
};

export type CalendarSemesterStats = SemesterStatsBucket & {
  /** Etiqueta del semestre académico, p. ej. "2026-1". */
  period: string;
  year: number;
  half: 1 | 2;
};

export type PhaseStats = SemesterStatsBucket & { phase: ProjectPhase };

export type SemesterStatsResponse = {
  totalProjects: number;
  /** Semestres académicos (año-semestre) según la fecha de inicio. */
  calendar: CalendarSemesterStats[];
  /** Proyectos agrupados por la fase interna en la que se encuentran. */
  phases: PhaseStats[];
};

const STATUS_ORDER = Object.values(ProjectStatus);
const PHASE_ORDER = Object.values(ProjectPhase);

/** Estados en los que todavía no hay una decisión sobre la propuesta. */
const UNDECIDED_STATUSES: ProjectStatus[] = [
  ProjectStatus.proposed,
  ProjectStatus.under_review,
];

/**
 * Semestre académico de una fecha: enero-junio es el semestre 1 y
 * julio-diciembre el 2. Se usa UTC para que el resultado no dependa de la
 * zona horaria del servidor.
 */
export function academicSemester(date: Date): { year: number; half: 1 | 2 } {
  return {
    year: date.getUTCFullYear(),
    half: date.getUTCMonth() < 6 ? 1 : 2,
  };
}

function summarize(rows: SemesterStatsRow[]): SemesterStatsBucket {
  const counts = new Map<ProjectStatus, number>();
  const minimumMilestones = { total: 0, completed: 0 };
  const reports = { total: 0, accepted: 0 };

  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);

    for (const milestone of row.milestones) {
      if (!milestone.isMinimum) {
        continue;
      }
      minimumMilestones.total += 1;
      if (milestone.completed) {
        minimumMilestones.completed += 1;
      }
    }

    for (const report of row.reports) {
      reports.total += 1;
      if (report.status === ReportStatus.accepted) {
        reports.accepted += 1;
      }
    }
  }

  const count = (status: ProjectStatus) => counts.get(status) ?? 0;
  const undecided = UNDECIDED_STATUSES.reduce(
    (total, status) => total + count(status),
    0,
  );
  const decided = rows.length - undecided;
  const rejected = count(ProjectStatus.rejected);

  return {
    projects: rows.length,
    decided,
    accepted: decided - rejected,
    rejected,
    inProgress: count(ProjectStatus.in_progress),
    closed: count(ProjectStatus.closed),
    byStatus: STATUS_ORDER.map((status) => ({
      status,
      count: count(status),
    })),
    minimumMilestones,
    reports,
  };
}

/**
 * Agrupa los proyectos por semestre académico (año-semestre, según la fecha
 * de inicio o, si falta, la de creación) y por fase interna del proyecto.
 */
export function buildSemesterStats(
  rows: SemesterStatsRow[],
): SemesterStatsResponse {
  const byPeriod = new Map<
    string,
    { year: number; half: 1 | 2; rows: SemesterStatsRow[] }
  >();

  for (const row of rows) {
    const { year, half } = academicSemester(row.startDate ?? row.createdAt);
    const period = `${year}-${half}`;
    const bucket = byPeriod.get(period) ?? { year, half, rows: [] };
    bucket.rows.push(row);
    byPeriod.set(period, bucket);
  }

  const calendar = [...byPeriod.entries()]
    .map(([period, bucket]) => ({
      period,
      year: bucket.year,
      half: bucket.half,
      ...summarize(bucket.rows),
    }))
    .sort((a, b) => a.year - b.year || a.half - b.half);

  const phases = PHASE_ORDER.map((phase) => ({
    phase,
    ...summarize(rows.filter((row) => row.phase === phase)),
  }));

  return { totalProjects: rows.length, calendar, phases };
}
