import { apiFormRequest, apiRequest, apiRequestVoid } from "@/lib/http";
import type { UserRole } from "./roles";
import { formatRole } from "./utils";

export type GuideCategory = "format" | "template" | "guide";

export type GuideDocumentItem = {
  id: number;
  title: string;
  description: string | null;
  category: GuideCategory;
  audiences: UserRole[];
  externalUrl: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  isPublished: boolean;
  hasFile: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GuideDocumentPayload = {
  title: string;
  description?: string;
  category: GuideCategory;
  audiences: UserRole[];
  externalUrl?: string;
  isPublished: boolean;
};

export type GuideFileKind =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "zip"
  | "file"
  | "link"
  | "none";

export const GUIDE_CATEGORY_ORDER: readonly GuideCategory[] = [
  "format",
  "template",
  "guide",
];

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  format: "Formatos de entregables",
  template: "Plantillas",
  guide: "Guías y procedimientos",
};

export const GUIDE_CATEGORY_DESCRIPTIONS: Record<GuideCategory, string> = {
  format: "Documentos base para preparar y presentar los entregables.",
  template: "Plantillas editables para actas, presentaciones y seguimiento.",
  guide: "Instructivos y guías sobre los procesos de la plataforma.",
};

export const GUIDE_FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip";

export const MAX_GUIDE_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function formatGuideCategory(category: GuideCategory): string {
  return GUIDE_CATEGORY_LABELS[category] ?? category;
}

export function formatGuideAudiences(
  audiences: readonly UserRole[],
): string {
  if (audiences.length === 0) {
    return "Todos los roles";
  }

  return audiences.map((role) => formatRole(role)).join(", ");
}

export function guideFileKind(
  document: Pick<
    GuideDocumentItem,
    "externalUrl" | "mimeType" | "originalName"
  >,
): GuideFileKind {
  if (document.externalUrl) {
    return "link";
  }

  const mimeType = document.mimeType ?? "";

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (
    mimeType === "application/msword" ||
    mimeType.includes("wordprocessingml")
  ) {
    return "word";
  }

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType.includes("spreadsheetml")
  ) {
    return "excel";
  }

  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType.includes("presentationml")
  ) {
    return "powerpoint";
  }

  if (mimeType.includes("zip")) {
    return "zip";
  }

  return document.originalName ? "file" : "none";
}

export function formatGuideFileSize(sizeBytes: number | null): string {
  if (sizeBytes === null || sizeBytes <= 0) {
    return "";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function guideDownloadHref(documentId: number): string {
  return `/api/guides/documents/${documentId}/download`;
}

export function getGuideDocuments(): Promise<GuideDocumentItem[]> {
  return apiRequest<GuideDocumentItem[]>("/api/guides/documents", {
    action: "consultar las guías",
  });
}

export function getAdminGuideDocuments(): Promise<GuideDocumentItem[]> {
  return apiRequest<GuideDocumentItem[]>("/api/guides/admin/documents", {
    action: "consultar las guías",
  });
}

export function getAdminGuideDocument(
  id: number,
): Promise<GuideDocumentItem> {
  return apiRequest<GuideDocumentItem>(`/api/guides/admin/documents/${id}`, {
    action: "consultar el documento",
  });
}

export function createGuideDocument(
  payload: GuideDocumentPayload,
): Promise<GuideDocumentItem> {
  return apiRequest<GuideDocumentItem>("/api/guides/documents", {
    method: "POST",
    body: payload,
    action: "crear el documento",
  });
}

export function updateGuideDocument(
  id: number,
  payload: GuideDocumentPayload,
): Promise<GuideDocumentItem> {
  return apiRequest<GuideDocumentItem>(`/api/guides/documents/${id}`, {
    method: "PATCH",
    body: payload,
    action: "actualizar el documento",
  });
}

export function deleteGuideDocument(id: number): Promise<void> {
  return apiRequestVoid(`/api/guides/documents/${id}`, {
    method: "DELETE",
    action: "eliminar el documento",
  });
}

export function uploadGuideDocumentFile(
  id: number,
  file: File,
): Promise<GuideDocumentItem> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<GuideDocumentItem>(
    `/api/guides/documents/${id}/file`,
    formData,
    { action: "subir el archivo" },
  );
}

export function deleteGuideDocumentFile(
  id: number,
): Promise<GuideDocumentItem> {
  return apiRequest<GuideDocumentItem>(`/api/guides/documents/${id}/file`, {
    method: "DELETE",
    action: "quitar el archivo",
  });
}
