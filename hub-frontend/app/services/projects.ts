import { ProjectDetails, ProjectItem, UserSummary } from "./schemas";
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
  ncedua: string;
  age: number;
  correo: string;
  description: string;
  context: string;
  location: string;
  executiontime: string;
  estimatedCost: number;
  startDate: string;
};

export async function getProjects(): Promise<{
  projects: ProjectItem[];
  error?: string;
}> {
  try {
    const response = await fetch(getApiUrl("/api/projects"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        projects: [],
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

export async function getProjectById(id: string): Promise<{
  project?: ProjectDetails;
  error?: string;
}> {
  try {
    const response = await fetch(getApiUrl(`/api/projects/${id}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
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
): Promise<ProjectDetails> {
  const response = await fetch(getApiUrl(`/api/projects/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Backend responded with status ${response.status}`);
  }

  return (await response.json()) as ProjectDetails;
}

export async function createProjectObservation(
  id: string,
  content: string,
): Promise<{ id: number; projectId: number; content: string; createdAt: string }> {
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

  return (await response.json()) as {
    id: number;
    projectId: number;
    content: string;
    createdAt: string;
  };
}

export async function createProject(payload: CreateProjectPayload) {
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

  return (await res.json()) as {
    id: number;
    name: string;
    description: string;
    context: string;
    status: string;
    strartDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  };
}

export async function getUsers(): Promise<{ users: UserSummary[]; error?: string }> {
  try {
    const response = await fetch(getApiUrl("/api/auth/users"), {
      cache: "no-store",
    });

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
