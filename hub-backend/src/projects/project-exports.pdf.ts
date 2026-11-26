import { ProjectDetailResponse } from './projects.select';
import {
  ENGINEERING_AREA_LABELS,
  formatBoolean,
  formatCurrency,
  formatDate,
  formatDateTime,
  monetaryResourcesLabel,
  phaseLabel,
  sourceLabel,
  statusLabel,
  actorRoleLabel,
} from './project-exports.labels';
import {
  PAGE_MARGIN,
  type PDFDocumentInstance,
  attachRunningHeader,
  bulletList,
  collectPdfBuffer,
  createPdfDocument,
  drawDocumentTitle,
  drawFooter,
  drawTable,
  labelValue,
  paragraph,
  sectionTitle,
} from '../common/pdf/pdf-layout';

function drawHeader(
  doc: PDFDocumentInstance,
  project: ProjectDetailResponse,
): void {
  drawDocumentTitle(
    doc,
    project.name,
    `Proyecto #${project.id} · ${statusLabel(project.status)} · Generado el ${formatDateTime(new Date())}`,
  );
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

  sectionTitle(doc, 'Fechas, ubicación y costos');
  labelValue(doc, 'Inicio', formatDate(project.startDate));
  labelValue(doc, 'Fin', formatDate(project.endDate));
  labelValue(doc, 'Ubicación', project.location ?? 'Sin información');
  labelValue(doc, 'Costo estimado', formatCurrency(project.estimatedCost));
}

function drawTeam(
  doc: PDFDocumentInstance,
  project: ProjectDetailResponse,
): void {
  if (!project.canViewSensitiveData) {
    return;
  }

  if (project.actorAssignments.length > 0) {
    sectionTitle(doc, 'Equipo');
    drawTable(
      doc,
      ['Nombre', 'Rol', 'Correo'],
      project.actorAssignments.map((assignment) => [
        assignment.user.fullName,
        actorRoleLabel(assignment.role),
        assignment.user.email,
      ]),
      [0.36, 0.24, 0.4],
    );
    doc.moveDown(0.4);
  }
}

/**
 * Genera el PDF de información general del proyecto. Incluye equipo
 * solo cuando el espectador puede ver datos sensibles.
 */
export async function buildProjectPdf(
  project: ProjectDetailResponse,
): Promise<Buffer> {
  const doc = createPdfDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Proyecto ${project.id} - ${project.name}`,
      Author: 'CapstoneHUB',
    },
  });

  const finished = collectPdfBuffer(doc);
  attachRunningHeader(doc, 'CapstoneHUB · Información del proyecto');

  drawHeader(doc, project);
  drawSummary(doc, project);
  drawProjectSections(doc, project);
  drawTeam(doc, project);
  drawFooter(doc, formatDateTime(new Date()));

  doc.end();

  return finished;
}
