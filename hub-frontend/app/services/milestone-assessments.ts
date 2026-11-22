import { apiRequest } from "@/lib/http";

export type MilestoneAssessmentItem = {
  readonly id: string;
  readonly label: string;
};

export type MilestoneAssessmentSection = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly MilestoneAssessmentItem[];
};

export type MilestoneAssessmentTemplate = {
  readonly programId: string;
  readonly programName: string;
  readonly introduction: string;
  readonly overviewItems: readonly MilestoneAssessmentItem[];
  readonly sections: readonly MilestoneAssessmentSection[];
  readonly notes?: readonly string[];
};

export type MilestoneAssessmentAnswer = {
  status: "yes" | "no" | "na" | null;
  observation: string;
};

export type MilestoneAssessmentAnswers = Record<
  string,
  MilestoneAssessmentAnswer
>;

export type MilestoneAssessmentSummary = {
  totalItems: number;
  answeredItems: number;
  yes: number;
  no: number;
  na: number;
  pending: number;
};

export type ProjectMilestoneAssessment = {
  id: number | null;
  projectId: number;
  programId: string;
  programName: string;
  answers: MilestoneAssessmentAnswers;
  updatedAt: string | null;
  template: MilestoneAssessmentTemplate | null;
  summary: MilestoneAssessmentSummary;
};

export function getProjectMilestoneAssessments(
  id: string,
): Promise<ProjectMilestoneAssessment[]> {
  return apiRequest<ProjectMilestoneAssessment[]>(
    `/api/projects/${id}/milestone-assessments`,
    {
      action: "consultar la evaluación de hitos",
    },
  );
}

export function saveProjectMilestoneAssessment(
  id: string,
  programId: string,
  answers: MilestoneAssessmentAnswers,
): Promise<ProjectMilestoneAssessment> {
  return apiRequest<ProjectMilestoneAssessment>(
    `/api/projects/${id}/milestone-assessments/${programId}`,
    {
      method: "PUT",
      body: { answers },
      action: "guardar la evaluación de hitos",
    },
  );
}
