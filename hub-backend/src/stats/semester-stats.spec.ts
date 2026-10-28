import {
  ProjectPhase,
  ProjectStatus,
  ReportStatus,
} from '../generated/prisma/client';
import {
  academicSemester,
  buildSemesterStats,
  SemesterStatsRow,
} from './semester-stats';

function row(overrides: Partial<SemesterStatsRow> = {}): SemesterStatsRow {
  return {
    status: ProjectStatus.in_progress,
    phase: ProjectPhase.semester_1,
    startDate: new Date('2026-02-10T12:00:00Z'),
    createdAt: new Date('2026-01-05T12:00:00Z'),
    milestones: [],
    reports: [],
    ...overrides,
  };
}

describe('academicSemester', () => {
  it('asigna enero-junio al semestre 1 y julio-diciembre al 2', () => {
    expect(academicSemester(new Date('2026-01-01T00:00:00Z'))).toEqual({
      year: 2026,
      half: 1,
    });
    expect(academicSemester(new Date('2026-06-30T23:59:59Z'))).toEqual({
      year: 2026,
      half: 1,
    });
    expect(academicSemester(new Date('2026-07-01T00:00:00Z'))).toEqual({
      year: 2026,
      half: 2,
    });
  });
});

describe('buildSemesterStats', () => {
  it('devuelve estructuras vacías cuando no hay proyectos', () => {
    const result = buildSemesterStats([]);

    expect(result.totalProjects).toBe(0);
    expect(result.calendar).toEqual([]);
    expect(result.phases.map((phase) => phase.phase)).toEqual([
      ProjectPhase.semester_1,
      ProjectPhase.semester_2,
    ]);
    expect(result.phases[0].projects).toBe(0);
  });

  it('agrupa por semestre académico en orden cronológico', () => {
    const result = buildSemesterStats([
      row({ startDate: new Date('2026-08-01T12:00:00Z') }),
      row({ startDate: new Date('2025-09-01T12:00:00Z') }),
      row({ startDate: new Date('2026-03-01T12:00:00Z') }),
      row({ startDate: new Date('2026-04-01T12:00:00Z') }),
    ]);

    expect(result.calendar.map((item) => [item.period, item.projects])).toEqual(
      [
        ['2025-2', 1],
        ['2026-1', 2],
        ['2026-2', 1],
      ],
    );
  });

  it('usa la fecha de creación cuando el proyecto no tiene fecha de inicio', () => {
    const result = buildSemesterStats([
      row({
        startDate: null,
        createdAt: new Date('2026-09-15T12:00:00Z'),
      }),
    ]);

    expect(result.calendar[0].period).toBe('2026-2');
  });

  it('calcula decisiones, rechazos y aceptados sin contar propuestas pendientes', () => {
    const result = buildSemesterStats([
      row({ status: ProjectStatus.proposed }),
      row({ status: ProjectStatus.under_review }),
      row({ status: ProjectStatus.in_progress }),
      row({ status: ProjectStatus.closed }),
      row({ status: ProjectStatus.rejected }),
    ]);

    const [bucket] = result.calendar;
    expect(bucket.projects).toBe(5);
    expect(bucket.decided).toBe(3);
    expect(bucket.rejected).toBe(1);
    expect(bucket.accepted).toBe(2);
    expect(bucket.inProgress).toBe(1);
    expect(bucket.closed).toBe(1);
    expect(bucket.byStatus.find((s) => s.status === 'rejected')?.count).toBe(1);
  });

  it('cuenta solo los hitos mínimos y las entregas aceptadas', () => {
    const result = buildSemesterStats([
      row({
        milestones: [
          { isMinimum: true, completed: true },
          { isMinimum: true, completed: false },
          { isMinimum: false, completed: true },
        ],
        reports: [
          { status: ReportStatus.accepted },
          { status: ReportStatus.rejected },
          { status: ReportStatus.submitted },
        ],
      }),
    ]);

    const [bucket] = result.calendar;
    expect(bucket.minimumMilestones).toEqual({ total: 2, completed: 1 });
    expect(bucket.reports).toEqual({ total: 3, accepted: 1 });
  });

  it('separa los proyectos por fase interna', () => {
    const result = buildSemesterStats([
      row({ phase: ProjectPhase.semester_1 }),
      row({ phase: ProjectPhase.semester_2 }),
      row({ phase: ProjectPhase.semester_2 }),
    ]);

    expect(result.phases.map((phase) => [phase.phase, phase.projects])).toEqual(
      [
        [ProjectPhase.semester_1, 1],
        [ProjectPhase.semester_2, 2],
      ],
    );
  });
});
