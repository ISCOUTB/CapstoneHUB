import {
  ProjectAttachmentItem,
  ProjectDetails,
  ProjectItem,
  ProjectMilestoneItem,
  ProjectObservationItem,
  ProjectReportItem,
  ProjectSource,
  UserSummary,
  MyProject,
} from "./schemas";
import { getAuthToken } from "./auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

function getApiUrl(path: string) {
  if (typeof window === "undefined") {
    const fallback = "http://localhost:3000";
    return `${apiBaseUrl || fallback}${path}`;
  }

  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export type CreateProjectPayload = {
  name: string;
  namep: string;
  correo: string;
  description: string;
  context: string;
  requiresLegalization?: boolean;
  isPrivate?: boolean;
  source?: ProjectSource;
  ncedua?: string;
  facultyAdvisor?: string;
  teamRequirements?: string;
  expectedOutcomes?: string;
  deliverables?: string[];
};

export async function getProjects(): Promise<{
  projects: ProjectItem[];
  status?: number;
  error?: string;
}> {
  try {
    const response = await fetch(getApiUrl("/api/projects"), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        projects: [],
        status: response.status,
        error: `Backend responded with status ${response.status}`,
      };
    }

    const data = (await response.json()) as ProjectItem[];
    return {
      projects: Array.isArray(data) ? data : [],
    };
  } catch (err) {
    return {
      projects: [],
      error: "Unable to reach the backend projects endpoint: " + err,
    };
  }
}

export async function getMyProjects(): Promise<{
  projects: MyProject[];
  error?: string;
}> {
  try {
    const response = await fetch(getApiUrl("/api/projects/mine"), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        projects: [],
        error: `Backend responded with status ${response.status}`,
      };
    }

    const data = (await response.json()) as MyProject[];
    return {
      projects: Array.isArray(data) ? data : [],
    };
  } catch (err) {
    return {
      projects: [],
      error:
        "Unable to reach the backend projects endpoint: " + err,
    };
  }
}

export async function getProjectById(id: string): Promise<{
  project?: ProjectDetails;
  status?: number;
  error?: string;
}> {
  try {
    const response = await fetch(getApiUrl(`/api/projects/${id}`), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        status: response.status,
        error: `Backend responded with status ${response.status}`,
      };
    }

    const data = (await response.json()) as ProjectDetails;
    return {
      project: data,
    };
  } catch (err) {
    return {
      error: "Unable to reach the backend project endpoint: " + err,
    };
  }
}

export async function updateProjectStatus(
  id: string,
  status: string,
  description?: string,
): Promise<ProjectDetails> {
  const response = await fetch(getApiUrl(`/api/projects/${id}/status`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status, description }),
  });

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return (await response.json()) as ProjectDetails;
}

export async function createProjectObservation(
  id: string,
  content: string,
): Promise<ProjectObservationItem> {
  const response = await fetch(getApiUrl(`/api/projects/${id}/observations`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return (await response.json()) as ProjectObservationItem;
}

export type CreateProjectMilestonePayload = {
  title: string;
  description?: string | null;
  dueDate: string;
  completed?: boolean;
};

export type UpdateProjectMilestonePayload = Partial<
  CreateProjectMilestonePayload
>;

export async function getProjectMilestones(
  id: string,
): Promise<ProjectMilestoneItem[]> {
  const response = await fetch(getApiUrl(`/api/projects/${id}/milestones`), {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return (await response.json()) as ProjectMilestoneItem[];
}

export async function createProjectMilestone(
  id: string,
  payload: CreateProjectMilestonePayload,
): Promise<ProjectMilestoneItem> {
  const response = await fetch(getApiUrl(`/api/projects/${id}/milestones`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return (await response.json()) as ProjectMilestoneItem;
}

export async function updateProjectMilestone(
  id: string,
  milestoneId: number,
  payload: UpdateProjectMilestonePayload,
): Promise<ProjectMilestoneItem> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/milestones/${milestoneId}`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return (await response.json()) as ProjectMilestoneItem;
}

export async function deleteProjectMilestone(
  id: string,
  milestoneId: number,
): Promise<void> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/milestones/${milestoneId}`),
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<ProjectDetails> {
  const res = await fetch(getApiUrl("/api/projects"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Backend responded with status ${res.status}, ${res.url}`);
  }

  return (await res.json()) as ProjectDetails;
}

export async function getAssignableUsers(
  projectId: number,
): Promise<{ users: UserSummary[]; error?: string }> {
  try {
    const response = await fetch(
      getApiUrl(`/api/projects/${projectId}/assignable-users`),
      {
        headers: getAuthHeaders(),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        users: [],
        error: `Backend responded with status ${response.status}`,
      };
    }

    const data = (await response.json()) as UserSummary[];
    return {
      users: Array.isArray(data) ? data : [],
    };
  } catch (err) {
    return {
      users: [],
      error: "Unable to reach the backend users endpoint: " + err,
    };
  }
}

export async function addProjectActorAssignment(
  projectId: number,
  payload: { userId: number; role: string },
): Promise<{
  id: number;
  projectId: number;
  userId: number;
  role: string;
  assignedAt: string;
  project: { id: number; name: string };
  user: { id: number; fullName: string; email: string };
}> {
  const response = await fetch(getApiUrl(`/api/projects/${projectId}/actors`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return (await response.json()) as {
    id: number;
    projectId: number;
    userId: number;
    role: string;
    assignedAt: string;
    project: { id: number; name: string };
    user: { id: number; fullName: string; email: string };
  };
}

function attachmentRequestError(response: Response, action: string): Error {
  if (response.status === 401) {
    return new Error(`Inicia sesión para ${action} este anexo.`);
  }

  if (response.status === 403) {
    return new Error(`No tienes permisos para ${action} este anexo.`);
  }

  return new Error(`Backend responded with status ${response.status}`);
}

export async function getProjectAttachments(
  id: string,
): Promise<ProjectAttachmentItem[]> {
  const response = await fetch(getApiUrl(`/api/projects/${id}/attachments`), {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw attachmentRequestError(response, "consultar");
  }

  return (await response.json()) as ProjectAttachmentItem[];
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
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw attachmentRequestError(response, "subir");
  }

  return (await response.json()) as ProjectAttachmentItem;
}

export async function deleteProjectAttachment(
  id: string,
  attachmentId: number,
): Promise<void> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/attachments/${attachmentId}`),
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw attachmentRequestError(response, "eliminar");
  }
}

export async function downloadProjectAttachment(
  id: string,
  attachmentId: number,
  fileName: string,
): Promise<void> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/attachments/${attachmentId}/download`),
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw attachmentRequestError(response, "descargar");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function reportRequestError(response: Response, action: string): Error {
  if (response.status === 401) {
    return new Error(`Inicia sesión para ${action} esta entrega.`);
  }

  if (response.status === 403) {
    return new Error(`No tienes permisos para ${action} esta entrega.`);
  }

  if (response.status === 409) {
    return new Error(
      "La entrega no está en un estado válido para esta acción.",
    );
  }

  return new Error(`Backend responded with status ${response.status}`);
}

export type CreateProjectReportPayload = {
  title: string;
  description?: string | null;
  dueDate: string;
};

export type UpdateProjectReportPayload = Partial<CreateProjectReportPayload>;

export async function getProjectReports(
  id: string,
): Promise<ProjectReportItem[]> {
  const response = await fetch(getApiUrl(`/api/projects/${id}/reports`), {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw reportRequestError(response, "consultar");
  }

  return (await response.json()) as ProjectReportItem[];
}

export async function createProjectReport(
  id: string,
  payload: CreateProjectReportPayload,
): Promise<ProjectReportItem> {
  const response = await fetch(getApiUrl(`/api/projects/${id}/reports`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw reportRequestError(response, "crear");
  }

  return (await response.json()) as ProjectReportItem;
}

export async function updateProjectReport(
  id: string,
  reportId: number,
  payload: UpdateProjectReportPayload,
): Promise<ProjectReportItem> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/reports/${reportId}`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw reportRequestError(response, "editar");
  }

  return (await response.json()) as ProjectReportItem;
}

export async function deleteProjectReport(
  id: string,
  reportId: number,
): Promise<void> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/reports/${reportId}`),
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw reportRequestError(response, "eliminar");
  }
}

export async function submitProjectReport(
  id: string,
  reportId: number,
  attachmentIds: number[] = [],
): Promise<ProjectReportItem> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/reports/${reportId}/submit`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ attachmentIds }),
    },
  );

  if (!response.ok) {
    throw reportRequestError(response, "enviar");
  }

  return (await response.json()) as ProjectReportItem;
}

export async function reviewProjectReport(
  id: string,
  reportId: number,
  decision: "accepted" | "rejected",
  comment?: string,
): Promise<ProjectReportItem> {
  const response = await fetch(
    getApiUrl(`/api/projects/${id}/reports/${reportId}/review`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ decision, comment }),
    },
  );

  if (!response.ok) {
    throw reportRequestError(response, "revisar");
  }

  return (await response.json()) as ProjectReportItem;
}
