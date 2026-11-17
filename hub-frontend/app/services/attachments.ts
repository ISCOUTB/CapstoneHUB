import { ProjectAttachmentItem } from "./schemas";
import { apiRequest, apiRequestVoid, ensureOk } from "@/lib/http";
import { getApiUrl } from "@/lib/api";
import { downloadResponseFile } from "@/lib/download";

export function getProjectAttachments(
  id: string,
): Promise<ProjectAttachmentItem[]> {
  return apiRequest<ProjectAttachmentItem[]>(`/api/projects/${id}/attachments`, {
    action: "consultar el anexo",
  });
}

export async function uploadProjectAttachment(
  id: string,
  file: File,
  reportId?: number,
): Promise<ProjectAttachmentItem> {
  const formData = new FormData();
  formData.append("file", file);

  if (reportId !== undefined) {
    formData.append("reportId", String(reportId));
  }

  const response = await fetch(getApiUrl(`/api/projects/${id}/attachments`), {
    method: "POST",
    body: formData,
  });

  await ensureOk(response, { action: "subir el anexo" });

  return (await response.json()) as ProjectAttachmentItem;
}

export function deleteProjectAttachment(
  id: string,
  attachmentId: number,
): Promise<void> {
  return apiRequestVoid(`/api/projects/${id}/attachments/${attachmentId}`, {
    method: "DELETE",
    action: "eliminar el anexo",
  });
}

export async function downloadProjectAttachment(
  id: string,
  attachmentId: number,
  fileName: string,
): Promise<void> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/attachments/${attachmentId}/download`),
    {
      cache: "no-store",
    },
  );

  await ensureOk(response, { action: "descargar el anexo" });
  await downloadResponseFile(response, fileName);
}
