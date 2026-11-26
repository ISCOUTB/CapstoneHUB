import { ProjectPhase, ProjectStatus } from '../generated/prisma/client';
import {
  MILESTONE_ASSESSMENT_TEMPLATES,
  templateItems,
} from '../milestone-assessments/milestone-assessment-templates';
import {
  buildMilestoneReport,
  type MilestoneReportInput,
} from './milestone-report.model';
import { buildMilestoneReportPdf } from './milestone-report.pdf';

const base: MilestoneReportInput = {
  project: {
    id: 3,
    name: 'Proyecto de prueba',
    status: ProjectStatus.in_progress,
    phase: ProjectPhase.semester_1,
    programRequirements: [],
  },
  assessments: [],
  team: null,
  generatedAt: new Date('2026-11-25T15:00:00Z'),
  generatedBy: 'Admin <admin@example.com>',
};

function countPages(buffer: Buffer): number {
  return buffer.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
}

describe('buildMilestoneReportPdf', () => {
  it('genera un PDF de una página cuando el proyecto no tiene programas', async () => {
    const buffer = await buildMilestoneReportPdf(buildMilestoneReport(base));

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(countPages(buffer)).toBe(1);
  });

  it('pagina el informe cuando las observaciones son largas', async () => {
    const observation =
      'Observación con suficiente texto para ocupar varias líneas del informe. '.repeat(
        13,
      );
    const answers = Object.fromEntries(
      templateItems(
        MILESTONE_ASSESSMENT_TEMPLATES['ingenieria-industrial'],
      ).map((item) => [item.id, { status: 'no', observation }]),
    );

    const buffer = await buildMilestoneReportPdf(
      buildMilestoneReport({
        ...base,
        project: {
          ...base.project,
          programRequirements: [
            {
              programId: 'ingenieria-industrial',
              programName: 'Ingeniería Industrial',
              schoolName: null,
              studentCount: 2,
            },
          ],
        },
        assessments: [
          {
            programId: 'ingenieria-industrial',
            answers,
            updatedAt: new Date('2026-11-20T10:00:00Z'),
            updatedBy: 'Docente Demo',
          },
        ],
      }),
    );

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(countPages(buffer)).toBeGreaterThan(2);
  });

  it('acepta observaciones con caracteres fuera de Latin-1', async () => {
    const buffer = await buildMilestoneReportPdf(
      buildMilestoneReport({
        ...base,
        project: {
          ...base.project,
          programRequirements: [
            {
              programId: 'ingenieria-industrial',
              programName: 'Ingeniería Industrial',
              schoolName: null,
              studentCount: 1,
            },
          ],
        },
        assessments: [
          {
            programId: 'ingenieria-industrial',
            answers: {
              'overview-1': {
                status: 'yes',
                observation: 'Cumple ≥ 80 % → aprobado 🚀',
              },
            },
            updatedAt: new Date('2026-11-20T10:00:00Z'),
            updatedBy: null,
          },
        ],
      }),
    );

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
