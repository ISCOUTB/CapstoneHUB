import {
  ActorRole,
  Prisma,
  ProjectPhase,
  ProjectSource,
  ProjectStatus,
} from '../generated/prisma/client';

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  ProjectStatus.proposed,
  ProjectStatus.under_review,
  ProjectStatus.approved,
  ProjectStatus.in_progress,
  ProjectStatus.paused,
  ProjectStatus.closed,
  ProjectStatus.cancelled,
  ProjectStatus.rejected,
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.proposed]: 'Propuesto',
  [ProjectStatus.under_review]: 'En revisión',
  [ProjectStatus.approved]: 'Aprobado',
  [ProjectStatus.in_progress]: 'En progreso',
  [ProjectStatus.paused]: 'En pausa',
  [ProjectStatus.closed]: 'Finalizado',
  [ProjectStatus.cancelled]: 'Cancelado',
  [ProjectStatus.rejected]: 'Rechazado',
};

const PHASE_LABELS: Record<ProjectPhase, string> = {
  [ProjectPhase.semester_1]: 'Semestre 1',
  [ProjectPhase.semester_2]: 'Semestre 2',
};

const SOURCE_LABELS: Record<ProjectSource, string> = {
  [ProjectSource.external_entity]: 'Entidad externa',
  [ProjectSource.research]: 'Investigación',
  [ProjectSource.internal_need]: 'Necesidad interna',
  [ProjectSource.social_impact]: 'Impacto social',
};

const ACTOR_ROLE_LABELS: Record<ActorRole, string> = {
  [ActorRole.teacher]: 'Docente',
  [ActorRole.evaluator]: 'Evaluador',
  [ActorRole.student]: 'Estudiante',
};

export const ENGINEERING_AREA_LABELS: Record<string, string> = {
  systems: 'Ingeniería de Sistemas y Computación',
  industrial: 'Ingeniería Industrial',
  civil: 'Ingeniería Civil',
  electrical: 'Ingeniería Eléctrica y Electrónica',
  mechanical: 'Ingeniería Mecánica',
  environmental: 'Ingeniería Ambiental',
  other: 'Otra área o ingeniería',
};

const MONETARY_RESOURCE_LABELS: Record<string, string> = {
  yes: 'Sí',
  no: 'No',
  na: 'N/A',
};

export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function phaseLabel(phase: ProjectPhase | null | undefined): string {
  return phase ? (PHASE_LABELS[phase] ?? phase) : 'Sin fase';
}

export function sourceLabel(source: ProjectSource): string {
  return SOURCE_LABELS[source] ?? source;
}

export function actorRoleLabel(role: ActorRole): string {
  return ACTOR_ROLE_LABELS[role] ?? role;
}

export function monetaryResourcesLabel(value: string): string {
  return MONETARY_RESOURCE_LABELS[value] ?? value;
}

export function formatBoolean(value: boolean): string {
  return value ? 'Sí' : 'No';
}

export function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(value);
}

export function formatDateTime(value: Date | null | undefined): string {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(value);
}

export function formatCurrency(
  value: Prisma.Decimal | null | undefined,
): string {
  if (value === null || value === undefined) {
    return 'No definido';
  }

  const numericValue = Number(value.toString());

  if (Number.isNaN(numericValue)) {
    return value.toString();
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numericValue);
}

/**
 * Evita que un valor de texto sea interpretado como fórmula al abrir el Excel.
 * Los nombres de proyecto y de personas son datos de usuario.
 */
export function safeExcelText(value: string | null | undefined): string {
  const text = (value ?? '').trim();

  if (!text) {
    return '';
  }

  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export function slugifyFileName(value: string, fallback: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

  return slug || fallback;
}
