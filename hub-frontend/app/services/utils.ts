export function formatStatus(status: string): string {
  switch (status) {
    case "proposed":
      return "Propuesto";
    case "in_progress":
      return "En progreso";
    case "paused":
      return "En pausa";
    case "under_review":
      return "En revisión";
    case "approved":
      return "Aprobado";
    case "closed":
      return "Finalizado";
    case "cancelled":
      return "Cancelado";
    case "rejected":
      return "Rechazado";
    default:
      return status;
  }
}

export function formatProjectSource(source: string): string {
  switch (source) {
    case "external_entity":
      return "Entidad externa";
    case "research":
      return "Investigación";
    case "internal_need":
      return "Necesidad interna";
    case "social_impact":
      return "Impacto social";
    default:
      return source;
  }
}

export const PROJECT_PHASES = ["semester_1", "semester_2"] as const;

export function formatPhase(phase: string | null | undefined): string {
  switch (phase) {
    case "semester_1":
      return "Semestre 1";
    case "semester_2":
      return "Semestre 2";
    default:
      return phase ?? "";
  }
}

export function formatRole(role: string): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "evaluator":
      return "Evaluador";
    case "coordinator":
      return "Coordinador";
    case "advisor":
      return "Asesor";
    case "student":
      return "Estudiante";
    case "proposer":
      return "Proponente";
    default:
      return role;
  }
}

export function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

export const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

export function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export function toDateTimeLocal(dateValue: string): string {
  const date = new Date(dateValue);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "El archivo supera el límite de 10 MB.";
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return "Tipo de archivo no permitido.";
  }

  return null;
}

export const MAX_REPORT_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export const REPORT_TEXT_MAX_LENGTH = 20_000;

/** Opciones de MIME permitidos para el tipo de entrega Archivo. */
export const REPORT_FILE_MIME_OPTIONS: {
  label: string;
  values: string[];
}[] = [
  { label: "PDF", values: ["application/pdf"] },
  {
    label: "Word",
    values: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  {
    label: "Excel",
    values: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  { label: "PNG", values: ["image/png"] },
  { label: "JPEG", values: ["image/jpeg"] },
  { label: "WebP", values: ["image/webp"] },
  { label: "GIF", values: ["image/gif"] },
  { label: "MP4", values: ["video/mp4"] },
  { label: "WebM", values: ["video/webm"] },
  { label: "OGG", values: ["video/ogg"] },
];

export function validateReportFile(
  file: File,
  allowedMimeTypes: string[],
): string | null {
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return "Tipo de archivo no permitido para esta entrega.";
  }

  if (file.size > MAX_REPORT_FILE_SIZE_BYTES) {
    return "El archivo supera el límite de 100 MB.";
  }

  return null;
}

export function validateReportLink(url: string): string | null {
  const trimmed = url.trim();

  if (!trimmed) {
    return "Ingresa una URL.";
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return "La URL no es válida.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "La URL debe comenzar por http:// o https://.";
  }

  return null;
}
