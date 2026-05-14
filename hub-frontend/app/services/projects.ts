import { ProjectItem } from "./schemas";

const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

export async function getProjects(): Promise<{
  projects: ProjectItem[];
  error?: string;
}> {
  try {
    const response = await fetch(`${backendUrl}/projects`, {
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
  } catch {
    return {
      projects: [],
      error: "Unable to reach the backend projects endpoint",
    };
  }
}
