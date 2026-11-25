import type { MilestoneAssessmentSummary } from '../milestone-assessments/milestone-assessment-progress';
import {
  PAGE_MARGIN,
  PDF_COLORS,
  type PDFDocumentInstance,
  attachRunningHeader,
  bulletList,
  collectPdfBuffer,
  createPdfDocument,
  drawDocumentTitle,
  drawFooter,
  drawTable,
  ensureSpace,
  labelValue,
  paragraph,
  safePdfText,
  sectionTitle,
} from '../common/pdf/pdf-layout';
import {
  actorRoleLabel,
  formatDateTime,
  phaseLabel,
  statusLabel,
} from '../projects/project-exports.labels';
import type {
  MilestoneReport,
  MilestoneReportAnswerStatus,
  MilestoneReportProgram,
  MilestoneReportSection,
} from './milestone-report.model';

const RUNNING_HEADER = 'CapstoneHUB · Informe de evaluación de hitos';

const INFORMATIVE_NOTE =
  'La evaluación de hitos es informativa: no bloquea el avance de fase ni el cierre del proyecto.';

const ANSWER_LABELS: Record<
  Exclude<MilestoneReportAnswerStatus, null>,
  string
> = {
  yes: 'Sí',
  no: 'No',
  na: 'N/A',
};

function answerLabel(status: MilestoneReportAnswerStatus): string {
  return status ? ANSWER_LABELS[status] : 'Pendiente';
}

function percentLabel(percent: number | null): string {
  return percent === null ? 'Sin formato' : `${percent}%`;
}

function progressLabel(
  summary: MilestoneAssessmentSummary,
  percent: number | null,
): string {
  if (percent === null) {
    return 'Sin formato de evaluación';
  }

  return `${percent}% (${summary.answeredItems} de ${summary.totalItems} requisitos evaluados)`;
}

function updatedLabel(program: MilestoneReportProgram): string {
  if (!program.updatedAt) {
    return 'Sin evaluar';
  }

  return `${formatDateTime(program.updatedAt)} por ${program.updatedBy ?? 'usuario no disponible'}`;
}

function subsectionTitle(doc: PDFDocumentInstance, title: string): void {
  ensureSpace(doc, 100);
  doc.moveDown(0.5);
  doc.x = PAGE_MARGIN;
  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(PDF_COLORS.black)
    .text(safePdfText(title));
  doc.moveDown(0.2);
}

function drawSummary(doc: PDFDocumentInstance, report: MilestoneReport): void {
  sectionTitle(doc, 'Resumen');

  labelValue(doc, 'Estado', statusLabel(report.project.status));
  labelValue(doc, 'Fase', phaseLabel(report.project.phase));
  labelValue(doc, 'Programas', String(report.programs.length));
  labelValue(
    doc,
    'Avance general',
    progressLabel(report.totals, report.percent),
  );
  labelValue(doc, 'Generado por', report.generatedBy);
  paragraph(doc, INFORMATIVE_NOTE);
}

function drawProgramSummary(
  doc: PDFDocumentInstance,
  report: MilestoneReport,
): void {
  sectionTitle(doc, 'Avance por programa');

  if (report.programs.length === 0) {
    paragraph(doc, 'Este proyecto no tiene programas académicos asociados.');
    return;
  }

  const rows = report.programs.map((program) => {
    if (!program.hasTemplate) {
      return [
        program.programName,
        String(program.studentCount),
        '-',
        '-',
        '-',
        '-',
        '-',
        'Sin formato',
      ];
    }

    const { summary } = program;
    return [
      program.programName,
      String(program.studentCount),
      `${summary.answeredItems} de ${summary.totalItems}`,
      String(summary.yes),
      String(summary.no),
      String(summary.na),
      String(summary.pending),
      percentLabel(program.percent),
    ];
  });

  const { totals } = report;
  rows.push([
    'Total',
    '',
    `${totals.answeredItems} de ${totals.totalItems}`,
    String(totals.yes),
    String(totals.no),
    String(totals.na),
    String(totals.pending),
    percentLabel(report.percent),
  ]);

  drawTable(
    doc,
    [
      'Programa',
      'Estudiantes',
      'Evaluados',
      'Sí',
      'No',
      'N/A',
      'Pendientes',
      'Avance',
    ],
    rows,
    [0.25, 0.13, 0.12, 0.07, 0.07, 0.07, 0.12, 0.17],
  );
  doc.moveDown(0.4);
}

function drawTeam(doc: PDFDocumentInstance, report: MilestoneReport): void {
  if (!report.team || report.team.length === 0) {
    return;
  }

  sectionTitle(doc, 'Equipo');
  drawTable(
    doc,
    ['Nombre', 'Rol', 'Correo'],
    report.team.map((member) => [
      member.fullName,
      actorRoleLabel(member.role),
      member.email,
    ]),
    [0.36, 0.24, 0.4],
  );
  doc.moveDown(0.4);
}

function drawSection(
  doc: PDFDocumentInstance,
  section: MilestoneReportSection,
): void {
  subsectionTitle(doc, section.title);
  drawTable(
    doc,
    ['Ítem', 'Requisito', 'Estado', 'Observación'],
    section.items.map((item) => [
      item.code,
      item.label,
      answerLabel(item.status),
      item.observation,
    ]),
    [0.09, 0.41, 0.12, 0.38],
  );
}

function drawProgram(
  doc: PDFDocumentInstance,
  program: MilestoneReportProgram,
): void {
  ensureSpace(doc, 140);
  sectionTitle(doc, program.programName);
  labelValue(doc, 'Escuela', program.schoolName ?? 'Sin información');
  labelValue(doc, 'Estudiantes', String(program.studentCount));

  if (!program.hasTemplate) {
    paragraph(
      doc,
      'Este programa no tiene formato de evaluación de hitos configurado.',
    );
    return;
  }

  labelValue(doc, 'Avance', progressLabel(program.summary, program.percent));
  labelValue(doc, 'Última actualización', updatedLabel(program));

  if (program.introduction) {
    paragraph(doc, program.introduction);
  }

  for (const section of program.sections) {
    drawSection(doc, section);
  }

  if (program.notes.length > 0) {
    subsectionTitle(doc, 'Notas del formato');
    bulletList(doc, program.notes);
  }
}

/**
 * Genera el informe de hitos: resumen por programa y, para cada uno, el estado
 * y la observación de cada requisito del formato.
 */
export async function buildMilestoneReportPdf(
  report: MilestoneReport,
): Promise<Buffer> {
  const doc = createPdfDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Informe de hitos - Proyecto ${report.project.id}`,
      Author: 'CapstoneHUB',
    },
  });

  const finished = collectPdfBuffer(doc);
  attachRunningHeader(doc, RUNNING_HEADER);

  drawDocumentTitle(
    doc,
    report.project.name,
    `Informe de hitos · Proyecto #${report.project.id} · Generado el ${formatDateTime(report.generatedAt)}`,
  );
  drawSummary(doc, report);
  drawProgramSummary(doc, report);
  drawTeam(doc, report);

  for (const program of report.programs) {
    drawProgram(doc, program);
  }

  drawFooter(doc, formatDateTime(report.generatedAt));

  doc.end();

  return finished;
}
