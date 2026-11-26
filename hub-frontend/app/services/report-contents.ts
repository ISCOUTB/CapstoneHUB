import { ProjectReportContentItem } from "./schemas";
import { REPORT_CONFLICT_MESSAGE } from "./reports";
import { normalizeReportUploadFile } from "./utils";
import { apiRequest, apiRequestVoid } from "@/lib/http";
import { getApiUrl } from "@/lib/api";

export type CreateReportContentPayload =
  | { kind: "text"; textContent: string }
  | { kind: "link"; url: string; label?: string | null };

export type UpdateReportContentPayload = {
  textContent?: string;
  url?: string;
  label?: string | null;
};

export function createReportContent(
  id: string,
  reportId: number,
  payload: CreateReportContentPayload,
): Promise<ProjectReportContentItem> {
  return apiRequest<ProjectReportContentItem>(
    `/api/projects/${id}/reports/${reportId}/contents`,
    {
      method: "POST",
      body: payload,
      action: "agregar el contenido de la entrega",
      conflictMessage: REPORT_CONFLICT_MESSAGE,
    },
  );
}

/**
 * Sube un archivo de entrega a través del backend (multipart). Usa
 * XMLHttpRequest porque `fetch` no expone el progreso de subida.
 */
export function uploadReportContentFile(
  id: string,
  reportId: number,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<ProjectReportContentItem> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", normalizeReportUploadFile(file));

    const request = new XMLHttpRequest();
    request.open(
      "POST",
      getApiUrl(`/api/projects/${id}/reports/${reportId}/contents/files`),
    );

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(JSON.parse(request.responseText) as ProjectReportContentItem);
        return;
      }

      reject(
        new Error(readUploadError(request.responseText, request.status)),
      );
    };

    request.onerror = () =>
      reject(
        new Error(
          "No se pudo conectar con el servidor para subir el archivo.",
        ),
      );
    request.onabort = () => reject(new Error("La subida fue cancelada."));

    request.send(formData);
  });
}

function readUploadError(responseText: string, status: number): string {
  try {
    const body = JSON.parse(responseText) as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(" ");
    }

    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // La respuesta no era JSON; se usa el mensaje genérico.
  }

  return `No se pudo subir el archivo (HTTP ${status}).`;
}

export function updateReportContent(
  id: string,
  reportId: number,
  contentId: number,
  payload: UpdateReportContentPayload,
): Promise<ProjectReportContentItem> {
  return apiRequest<ProjectReportContentItem>(
    `/api/projects/${id}/reports/${reportId}/contents/${contentId}`,
    {
      method: "PATCH",
      body: payload,
      action: "editar el contenido de la entrega",
      conflictMessage: REPORT_CONFLICT_MESSAGE,
    },
  );
}

export function deleteReportContent(
  id: string,
  reportId: number,
  contentId: number,
): Promise<void> {
  return apiRequestVoid(
    `/api/projects/${id}/reports/${reportId}/contents/${contentId}`,
    {
      method: "DELETE",
      action: "eliminar el contenido de la entrega",
      conflictMessage: REPORT_CONFLICT_MESSAGE,
    },
  );
}

/**
 * URL del stream inline (imagen/video/archivo). La cookie httpOnly de sesión
 * viaja sola en la petición same-origin, así que no hace falta token en query.
 */
export function getReportContentStreamUrl(
  id: string,
  reportId: number,
  contentId: number,
): string {
  return getApiUrl(
    `/api/projects/${id}/reports/${reportId}/contents/${contentId}/stream`,
  );
}
