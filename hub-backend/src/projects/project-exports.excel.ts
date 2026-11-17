import ExcelJS from 'exceljs';
import {
  ProjectActorResponse,
  ProjectListResponse,
  ProjectProgramRequirementResponse,
} from './projects.select';
import {
  PROJECT_STATUS_ORDER,
  actorRoleLabel,
  formatBoolean,
  formatDateTime,
  phaseLabel,
  safeExcelText,
  sourceLabel,
  statusLabel,
} from './project-exports.labels';
import { ProjectPhase, ProjectStatus } from '../generated/prisma/client';

const EXPORT_COLUMNS = [
  { key: 'id', header: 'ID', width: 8 },
  { key: 'name', header: 'Nombre', width: 34 },
  { key: 'status', header: 'Estado', width: 16 },
  { key: 'phase', header: 'Fase', width: 14 },
  { key: 'source', header: 'Fuente', width: 18 },
  { key: 'proposer', header: 'Proponente', width: 26 },
  { key: 'startDate', header: 'Fecha de inicio', width: 15 },
  { key: 'location', header: 'Ubicación', width: 22 },
  { key: 'legalization', header: 'Legalización', width: 13 },
  { key: 'isPrivate', header: 'Privado', width: 10 },
  { key: 'team', header: 'Equipo', width: 36 },
  { key: 'programs', header: 'Programas requeridos', width: 38 },
] as const;

const HEADER_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FF0A41F5' },
};

const TITLE_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FF05174A' },
};

const BORDER = {
  style: 'thin' as const,
  color: { argb: 'FFE2E8F0' },
};

function formatTeam(actors: ProjectActorResponse[]): string {
  return actors
    .map((actor) => `${actor.user.fullName} (${actorRoleLabel(actor.role)})`)
    .join('; ');
}

function formatPrograms(
  requirements: ProjectProgramRequirementResponse[],
): string {
  return requirements
    .map((requirement) => {
      const label =
        requirement.studentCount === 1 ? 'estudiante' : 'estudiantes';
      return `${requirement.programName} (${requirement.studentCount} ${label})`;
    })
    .join('; ');
}

function styleSummaryHeader(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
  });
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  projects: ProjectListResponse[],
  meta: { generatedAt: Date; generatedBy: string },
): void {
  const summary = workbook.addWorksheet('Resumen');
  summary.columns = [{ width: 34 }, { width: 18 }];
  summary.mergeCells('A1:B1');

  const title = summary.getCell('A1');
  title.value = 'CapstoneHUB · Resumen de proyectos';
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.fill = TITLE_FILL;
  title.alignment = { vertical: 'middle' };
  summary.getRow(1).height = 28;

  summary.addRow([]);
  summary.addRow(['Generado el', formatDateTime(meta.generatedAt)]);
  summary.addRow(['Generado por', meta.generatedBy]);
  summary.addRow(['Total de proyectos', projects.length]);
  summary.addRow([]);
  summary.addRow([
    'Solo incluye los proyectos visibles para el usuario que generó el archivo.',
  ]);

  summary.addRow([]);
  styleSummaryHeader(summary.addRow(['Estado', 'Cantidad']));

  const statusCounts = new Map<ProjectStatus, number>();
  for (const project of projects) {
    statusCounts.set(
      project.status,
      (statusCounts.get(project.status) ?? 0) + 1,
    );
  }

  for (const status of PROJECT_STATUS_ORDER) {
    summary.addRow([statusLabel(status), statusCounts.get(status) ?? 0]);
  }

  summary.addRow([]);
  styleSummaryHeader(summary.addRow(['Fase', 'Cantidad']));

  const phaseCounts = new Map<ProjectPhase, number>();
  for (const project of projects) {
    phaseCounts.set(project.phase, (phaseCounts.get(project.phase) ?? 0) + 1);
  }

  for (const phase of [ProjectPhase.semester_1, ProjectPhase.semester_2]) {
    summary.addRow([phaseLabel(phase), phaseCounts.get(phase) ?? 0]);
  }
}

/**
 * Genera el libro XLSX con el listado general de proyectos y una hoja de
 * resumen por estado y fase.
 */
export async function buildProjectsExcel(
  projects: ProjectListResponse[],
  meta: { generatedAt: Date; generatedBy: string },
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CapstoneHUB';
  workbook.created = meta.generatedAt;
  workbook.modified = meta.generatedAt;

  const sheet = workbook.addWorksheet('Proyectos', {
    views: [{ state: 'frozen', ySplit: 3 }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  sheet.mergeCells(1, 1, 1, EXPORT_COLUMNS.length);
  const title = sheet.getCell(1, 1);
  title.value = 'CapstoneHUB · Proyectos';
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.fill = TITLE_FILL;
  title.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, EXPORT_COLUMNS.length);
  const subtitle = sheet.getCell(2, 1);
  subtitle.value = `Generado el ${formatDateTime(meta.generatedAt)} por ${meta.generatedBy} · ${projects.length} proyecto(s)`;
  subtitle.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
  subtitle.alignment = { vertical: 'middle' };
  sheet.getRow(2).height = 20;

  const headerRow = sheet.getRow(3);
  EXPORT_COLUMNS.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = { bottom: BORDER };
    sheet.getColumn(index + 1).width = column.width;
  });
  headerRow.height = 26;

  projects.forEach((project, index) => {
    const row = sheet.addRow([
      project.id,
      safeExcelText(project.name),
      statusLabel(project.status),
      phaseLabel(project.phase),
      sourceLabel(project.source),
      safeExcelText(project.proposer?.fullName ?? '—'),
      project.startDate ?? '',
      safeExcelText(project.location ?? '—'),
      formatBoolean(project.requiresLegalization),
      formatBoolean(project.isPrivate),
      safeExcelText(formatTeam(project.actors)),
      safeExcelText(formatPrograms(project.programRequirements)),
    ]);

    if (project.startDate) {
      const dateCell = row.getCell(7);
      dateCell.value = project.startDate;
      dateCell.numFmt = 'dd/mm/yyyy';
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = { bottom: BORDER };

      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });
  });

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: EXPORT_COLUMNS.length },
  };

  addSummarySheet(workbook, projects, meta);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
