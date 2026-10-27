import { apiRequest, apiRequestVoid } from "@/lib/http";
import type { ProjectPhase } from "./schemas";
import type { RubricTemplateItem } from "./rubrics";

export type ProjectEvaluationCriterionItem = {
  id: number;
  position: number;
  title: string;
  weightPercent: number;
  score: number;
  comment: string | null;
};

export type ProjectEvaluationItem = {
  id: number;
  projectId: number;
  phase: ProjectPhase;
  rubricTemplateId: number;
  totalScore: number;
  generalComment: string | null;
  submittedAt: string;
  updatedAt: string;
  evaluator: {
    id: number;
    fullName: string;
    email: string;
  };
  criteria: ProjectEvaluationCriterionItem[];
};

export type PhaseRequiredEvaluator = {
  userId: number;
  fullName: string;
  evaluatedAt: string | null;
};

export type PhaseEvaluation = {
  phase: ProjectPhase;
  isCurrent: boolean;
  rubric: RubricTemplateItem;
  evaluations: ProjectEvaluationItem[];
  averageScore: number | null;
  requiredEvaluators: PhaseRequiredEvaluator[];
  missingEvaluators: { userId: number; fullName: string }[];
  completed: boolean;
  canEvaluate: boolean;
  canAssignRubric: boolean;
};

export type ProjectEvaluationsResponse = {
  project: {
    id: number;
    name: string;
    status: string;
    phase: ProjectPhase;
  };
  phases: PhaseEvaluation[];
  availableTemplates?: RubricTemplateItem[];
};

export type SaveProjectEvaluationPayload = {
  criteria: {
    criterionId: number;
    score: number;
    comment?: string;
  }[];
  generalComment?: string;
};

export function getProjectEvaluations(
  projectId: number | string,
): Promise<ProjectEvaluationsResponse> {
  return apiRequest<ProjectEvaluationsResponse>(
    `/api/projects/${projectId}/evaluations`,
    { action: "consultar la evaluación del proyecto" },
  );
}

export function saveProjectEvaluation(
  projectId: number | string,
  phase: ProjectPhase,
  payload: SaveProjectEvaluationPayload,
): Promise<ProjectEvaluationsResponse> {
  return apiRequest<ProjectEvaluationsResponse>(
    `/api/projects/${projectId}/evaluations/${phase}`,
    {
      method: "PUT",
      body: payload,
      action: "guardar la evaluación del proyecto",
    },
  );
}

export function assignProjectRubric(
  projectId: number | string,
  phase: ProjectPhase,
  rubricTemplateId: number,
): Promise<RubricTemplateItem> {
  return apiRequest<RubricTemplateItem>(
    `/api/projects/${projectId}/rubric-assignments/${phase}`,
    {
      method: "PUT",
      body: { rubricTemplateId },
      action: "asignar la rúbrica al proyecto",
    },
  );
}

export function clearProjectRubric(
  projectId: number | string,
  phase: ProjectPhase,
): Promise<void> {
  return apiRequestVoid(
    `/api/projects/${projectId}/rubric-assignments/${phase}`,
    {
      method: "DELETE",
      action: "volver a la rúbrica general",
    },
  );
}
