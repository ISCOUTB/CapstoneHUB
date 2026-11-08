import { apiRequest } from "@/lib/http";
import type { RubricAnswers } from "../projects/[id]/milestones/rubric-templates";

export type ProjectMilestoneRubric = {
  id: number;
  projectId: number;
  programId: string;
  answers: RubricAnswers;
  updatedAt: string;
};

export function getProjectMilestoneRubrics(projectId: number): Promise<ProjectMilestoneRubric[]> {
  return apiRequest<ProjectMilestoneRubric[]>(`/api/projects/${projectId}/milestones/rubrics`, {
    action: "consultar las evaluaciones de hitos",
  });
}

export function saveProjectMilestoneRubric(
  projectId: number,
  programId: string,
  answers: RubricAnswers,
): Promise<ProjectMilestoneRubric> {
  return apiRequest<ProjectMilestoneRubric>(`/api/projects/${projectId}/milestones/rubrics/${programId}`, {
    method: "PUT",
    body: { answers },
    action: "guardar la evaluación de hitos",
  });
}
