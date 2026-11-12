import PDFDocumentModule from 'pdfkit';
import { ProjectDetailResponse } from './projects.select';
import {
  ENGINEERING_AREA_LABELS,
  formatBoolean,
  formatCurrency,
  formatDate,
  formatDateTime,
  monetaryResourcesLabel,
  phaseLabel,
  safePdfText,
  sourceLabel,
  statusLabel,
  actorRoleLabel,
} from './project-exports.labels';

type PDFDocumentInstance = PDFKit.PDFDocument;
type PDFDocumentConstructor = new (
  options?: PDFKit.PDFDocumentOptions,
) => PDFDocumentInstance;

// El paquete @types/pdfkit tipa el export como una instancia, pero en runtime
// `pdfkit` exporta el constructor. El cast mantiene los tipos del documento.
const PDFDocument = PDFDocumentModule as unknown as PDFDocumentConstructor;

const PAGE_MARGIN = 48;

const COLORS = {
  deepBlue: '#05174a',
  blue: '#0a41f5',
  pale: '#93b4ff',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  soft: '#f8fafc',
};

function ensureSpace(doc: PDFDocumentInstance, needed: number): void {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function sectionTitle(doc: PDFDocumentInstance, title: string): void {
  ensureSpace(doc, 42);
  doc.moveDown(0.7);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.blue)
    .text(safePdfText(title));

  doc.moveDown(0.2);
  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .stroke();
  doc.moveDown(0.45);
}

function paragraph(doc: PDFDocumentInstance, text: string): void {
  ensureSpace(doc, 28);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(COLORS.text)
    .text(safePdfText(text), { lineGap: 2 });
}

function labelValue(
  doc: PDFDocumentInstance,
  label: string,
  value: string,
): void {
  ensureSpace(doc, 18);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`${label}: `, { continued: true });
  doc
    .font('Helvetica')
    .fillColor(COLORS.text)
    .text(safePdfText(value), { lineGap: 1 });
}

function bulletList(doc: PDFDocumentInstance, items: string[]): void {
  for (const item of items) {
    ensureSpace(doc, 18);
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(COLORS.text)
      .text(`• ${safePdfText(item)}`, { indent: 10, lineGap: 1 });
  }
}

function drawHeader(
  doc: PDFDocumentInstance,
  project: ProjectDetailResponse,
): void {
  doc.rect(0, 0, doc.page.width, 118).fill(COLORS.deepBlue);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('CapstoneHUB', PAGE_MARGIN, 30);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.pale)
    .text('Universidad Tecnológica de Bolívar', PAGE_MARGIN, 54);

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#ffffff')
    .text(safePdfText(project.name), PAGE_MARGIN, 74, {
      width: doc.page.width - PAGE_MARGIN * 2,
      height: 22,
      ellipsis: true,
    });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.pale)
    .text(
      `Proyecto #${project.id} · ${statusLabel(project.status)} · Generado el ${formatDateTime(new Date())}`,
      PAGE_MARGIN,
      100,
      { width: doc.page.width - PAGE_MARGIN * 2 },
    );

  doc.y = 136;
}

function drawSummary(
  doc: PDFDocumentInstance,
  project: ProjectDetailResponse,
): void {
  sectionTitle(doc, 'Resumen');

  labelValue(doc, 'Estado', statusLabel(project.status));
  labelValue(doc, 'Fase', phaseLabel(project.phase));
  labelValue(doc, 'Fuente', sourceLabel(project.source));
  labelValue(doc, 'Privado', formatBoolean(project.isPrivate));
  labelValue(doc, 'Legalización', formatBoolean(project.requiresLegalization));
  labelValue(doc, 'Creado', formatDateTime(project.createdAt));
  labelValue(doc, 'Actualizado', formatDateTime(project.updatedAt));
  labelValue(
    doc,
    'Proponente',
    project.proposer?.fullName ?? 'Sin información',
  );
}

function drawProposer(
  doc: PDFDocumentInstance,
  project: ProjectDetailResponse,
): void {
  sectionTitle(doc, 'Proponente');

  if (!project.proposer) {
    paragraph(doc, 'Sin información del proponente.');
    return;
  }

  labelValue(doc, 'Nombre', project.proposer.fullName);
  labelValue(doc, 'Cédula', project.proposer.idNumber ?? 'Sin información');
  labelValue(doc, 'Correo', project.proposer.email ?? 'Sin información');
}

function drawProjectSections(
  doc: PDFDocumentInstance,
  project: ProjectDetailResponse,
): void {
  drawProposer(doc, project);

  sectionTitle(doc, 'Descripción');
  paragraph(doc, project.description || 'Sin información.');

  sectionTitle(doc, 'Contexto');
  paragraph(doc, project.context || 'Sin información.');

  sectionTitle(doc, 'Fuente del proyecto');
  labelValue(doc, 'Fuente', sourceLabel(project.source));
  if (project.sourceDetails) {
    paragraph(doc, project.sourceDetails);
  }

  if (project.programRequirements.length > 0) {
    sectionTitle(doc, 'Programas académicos requeridos');
    bulletList(
      doc,
      project.programRequirements.map((requirement) => {
        const school = requirement.schoolName
          ? ` — ${requirement.schoolName}`
          : '';
        const students =
          requirement.studentCount === 1 ? 'estudiante' : 'estudiantes';
        return `${requirement.programName}${school} (${requirement.studentCount} ${students})`;
      }),
    );
  }

  if (project.engineeringArea) {
    sectionTitle(doc, 'Área o ingeniería');
    bulletList(
      doc,
      project.engineeringArea
        .split(',')
        .map((area) => area.trim())
        .filter(Boolean)
        .map((area) => ENGINEERING_AREA_LABELS[area] ?? area),
    );
  }

  if (project.facultyAdvisors.length > 0) {
    sectionTitle(doc, 'Profesores de contacto');
    bulletList(doc, project.facultyAdvisors);
  } else if (project.facultyAdvisor) {
    sectionTitle(doc, 'Asesor de la facultad');
    paragraph(doc, project.facultyAdvisor);
  }

  if (project.source === 'external_entity') {
    const externalDetails = [
      project.nit ? `NIT: ${project.nit}` : null,
      project.externalAdvisorName
        ? `Asesor externo: ${project.externalAdvisorName}`
        : null,
      project.externalAdvisorEmail
        ? `Correo: ${project.externalAdvisorEmail}`
        : null,
    ].filter((detail): detail is string => detail !== null);

    if (externalDetails.length > 0) {
      sectionTitle(doc, 'Contacto externo');
      bulletList(doc, externalDetails);
    }
  }

  if (project.researchGroup) {
    sectionTitle(doc, 'Grupo de investigación');
    paragraph(doc, project.researchGroup);
  }

  if (
    project.socialOrganization ||
    project.socialLocation ||
    (project.source === 'social_impact' && project.nit)
  ) {
    sectionTitle(doc, 'Información de impacto social');
    const socialDetails = [
      project.socialOrganization
        ? `Junta de Acción Comunal: ${project.socialOrganization}`
        : null,
      project.socialLocation ? `Localización: ${project.socialLocation}` : null,
      project.nit ? `NIT: ${project.nit}` : null,
    ].filter((detail): detail is string => detail !== null);
    bulletList(doc, socialDetails);
  }

  if (project.monetaryResources) {
    sectionTitle(doc, 'Recursos monetarios');
    paragraph(doc, monetaryResourcesLabel(project.monetaryResources));
    if (project.monetaryResourcesDescription) {
      paragraph(doc, project.monetaryResourcesDescription);
    }
  }

  if (project.deliverables.length > 0) {
    sectionTitle(doc, 'Entregables');
    bulletList(
      doc,
      project.deliverables.map((deliverable) => deliverable.description),
    );
  }

  if (project.expectedOutcomes) {
    sectionTitle(doc, 'Expectativas al finalizar');
    paragraph(doc, project.expectedOutcomes);
  }

  sectionTitle(doc, 'Conocimientos requeridos');
  paragraph(doc, project.teamRequirements || 'N/A');

  if (project.projectScope) {
    sectionTitle(doc, 'Alcance del proyecto');
    paragraph(doc, project.projectScope);
  }

  sectionTitle(doc, 'Proceso de legalización');
  paragraph(
    doc,
    project.requiresLegalization
      ? 'El proyecto requiere proceso de legalización (contrato de confidencialidad, convenio u otros trámites con el proponente).'
      : 'El proyecto no requiere proceso de legalización.',
  );

  sectionTitle(doc, 'Fechas, ubicación y costos');
  labelValue(doc, 'Inicio', formatDate(project.startDate));
  labelValue(doc, 'Fin', formatDate(project.endDate));
  labelValue(doc, 'Ubicación', project.location ?? 'Sin información');
  labelValue(doc, 'Costo estimado', formatCurrency(project.estimatedCost));
}

function drawTeamAndMilestones(
  doc: PDFDocumentInstance,
  project: ProjectDetailResponse,
): void {
  if (!project.canViewSensitiveData) {
    return;
  }

  if (project.actorAssignments.length > 0) {
    sectionTitle(doc, 'Equipo');
    bulletList(
      doc,
      project.actorAssignments.map(
        (assignment) =>
          `${assignment.user.fullName} — ${actorRoleLabel(assignment.role)} — ${assignment.user.email}`,
      ),
    );
  }

  if (project.milestones.length > 0) {
    sectionTitle(doc, 'Hitos');
    bulletList(
      doc,
      project.milestones.map(
        (milestone) =>
          `${milestone.title} — ${phaseLabel(milestone.phase)} — vence ${formatDate(milestone.dueDate)} — mínimo: ${formatBoolean(milestone.isMinimum)} — completado: ${formatBoolean(milestone.completed)}`,
      ),
    );
  }
}

function drawFooter(doc: PDFDocumentInstance): void {
  const range = doc.bufferedPageRange();
  const generated = formatDateTime(new Date());

  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);

    const previousBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = doc.page.height - 34;

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text(`Generado el ${generated} · CapstoneHUB`, PAGE_MARGIN, y, {
        width: doc.page.width - PAGE_MARGIN * 2,
        align: 'left',
        lineBreak: false,
      });

    doc.text(`Página ${index + 1} de ${range.count}`, PAGE_MARGIN, y, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'right',
      lineBreak: false,
    });

    doc.page.margins.bottom = previousBottom;
  }
}

/**
 * Genera el PDF de información general del proyecto. Incluye equipo e hitos
 * solo cuando el espectador puede ver datos sensibles.
 */
export async function buildProjectPdf(
  project: ProjectDetailResponse,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Proyecto ${project.id} - ${project.name}`,
      Author: 'CapstoneHUB',
    },
  });

  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.from(chunk));
    });
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.on('pageAdded', () => {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text('CapstoneHUB · Información del proyecto', PAGE_MARGIN, 24, {
        lineBreak: false,
      });

    doc
      .moveTo(PAGE_MARGIN, 36)
      .lineTo(doc.page.width - PAGE_MARGIN, 36)
      .strokeColor(COLORS.border)
      .lineWidth(0.6)
      .stroke();

    doc.y = 48;
  });

  drawHeader(doc, project);
  drawSummary(doc, project);
  drawProjectSections(doc, project);
  drawTeamAndMilestones(doc, project);
  drawFooter(doc);

  doc.end();

  return finished;
}
