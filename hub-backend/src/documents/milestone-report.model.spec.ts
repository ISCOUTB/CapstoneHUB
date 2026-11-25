import {
  ActorRole,
  ProjectPhase,
  ProjectStatus,
} from '../generated/prisma/client';
import {
  buildMilestoneReport,
  type MilestoneReportInput,
} from './milestone-report.model';

const generatedAt = new Date('2026-11-25T15:00:00Z');

function input(
  overrides: Partial<MilestoneReportInput> = {},
): MilestoneReportInput {
  return {
    project: {
      id: 12,
      name: 'Proyecto Demo',
      status: ProjectStatus.in_progress,
      phase: ProjectPhase.semester_1,
      programRequirements: [
        {
          programId: 'ingenieria-industrial',
          programName: 'Ingeniería Industrial',
          schoolName: 'Escuela de Ingeniería',
          studentCount: 2,
        },
        {
          programId: 'ingenieria-civil',
          programName: 'Ingeniería Civil',
          schoolName: 'Escuela de Ingeniería',
          studentCount: 1,
        },
      ],
    },
    assessments: [
      {
        programId: 'ingenieria-industrial',
        answers: {
          'overview-1': { status: 'yes', observation: 'Cumple' },
          'overview-2': { status: 'no', observation: 'Falta el diagnóstico' },
          '1.1': { status: 'na', observation: '' },
        },
        updatedAt: new Date('2026-11-20T10:00:00Z'),
        updatedBy: 'Docente Demo',
      },
    ],
    team: null,
    generatedAt,
    generatedBy: 'Admin <admin@example.com>',
    ...overrides,
  };
}

describe('buildMilestoneReport', () => {
  it('calcula el avance por programa y el total del proyecto', () => {
    const report = buildMilestoneReport(input());
    const [industrial, civil] = report.programs;

    expect(industrial).toMatchObject({
      programName: 'Ingeniería Industrial',
      schoolName: 'Escuela de Ingeniería',
      studentCount: 2,
      hasTemplate: true,
      percent: 8,
      updatedBy: 'Docente Demo',
      summary: {
        totalItems: 37,
        answeredItems: 3,
        yes: 1,
        no: 1,
        na: 1,
        pending: 34,
      },
    });
    expect(civil).toMatchObject({
      hasTemplate: false,
      percent: null,
      sections: [],
      summary: { totalItems: 0, answeredItems: 0 },
    });
    expect(report.totals).toEqual({
      totalItems: 37,
      answeredItems: 3,
      yes: 1,
      no: 1,
      na: 1,
      pending: 34,
    });
    expect(report.percent).toBe(8);
  });

  it('marca como pendientes los requisitos de un programa sin evaluación guardada', () => {
    const report = buildMilestoneReport(input({ assessments: [] }));
    const [industrial] = report.programs;

    expect(industrial).toMatchObject({
      percent: 0,
      updatedAt: null,
      updatedBy: null,
      summary: { totalItems: 37, answeredItems: 0, pending: 37 },
    });
    const statuses = industrial.sections.flatMap((section) =>
      section.items.map((item) => item.status),
    );
    expect(statuses.every((status) => status === null)).toBe(true);
  });

  it('conserva el orden del formato, con el resumen general primero', () => {
    const [industrial] = buildMilestoneReport(input()).programs;
    const [overview, firstSection] = industrial.sections;

    expect(overview.title).toBe('Resumen general de hitos');
    expect(overview.items).toHaveLength(7);
    expect(overview.items[0]).toEqual({
      code: '',
      label: 'Eje temático definido',
      status: 'yes',
      observation: 'Cumple',
    });
    expect(firstSection.title).toBe('1. Eje temático claramente definido');
    expect(firstSection.items[0]).toEqual({
      code: '1.1',
      label: 'Factores humanos (Seguridad y ergonomía, talento humano)',
      status: 'na',
      observation: '',
    });
  });

  it('incluye la introducción y las notas de la plantilla', () => {
    const [industrial] = buildMilestoneReport(input()).programs;

    expect(industrial.introduction).toContain('ingeniería industrial');
    expect(industrial.notes).toHaveLength(2);
  });

  it('expone el equipo solo cuando se proporciona', () => {
    const team = [
      {
        fullName: 'Docente Demo',
        role: ActorRole.teacher,
        email: 'docente@example.com',
      },
    ];

    expect(buildMilestoneReport(input({ team })).team).toEqual(team);
    expect(buildMilestoneReport(input({ team: null })).team).toBeNull();
  });
});
