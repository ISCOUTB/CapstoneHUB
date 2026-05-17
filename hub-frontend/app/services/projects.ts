import { ProjectItem } from "./schemas";

const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

function getApiUrl(path: string) {
  if (typeof window === "undefined") {
    const fallback = "http://localhost:3000";
    return `${apiBaseUrl || fallback}${path}`;
  }

  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

export type CreateProjectPayload = {
  name: string;
  description: string;
  context: string;
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

export async function createProject(payload: CreateProjectPayload) {
  const res = await fetch(getApiUrl("/api/projects"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
