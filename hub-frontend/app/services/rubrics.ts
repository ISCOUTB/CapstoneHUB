import { apiRequest } from "@/lib/http";

export type RubricCriterionItem = {
  id: number;
  position: number;
  title: string;
  description: string | null;
  weightPercent: number;
};

export type RubricTemplateItem = {
  id: number;
  name: string;
  description: string | null;
  area: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  criteria: RubricCriterionItem[];
};

export type RubricCriterionPayload = {
  title: string;
  description?: string;
  weightPercent: number;
};

export type RubricTemplatePayload = {
  name: string;
  description?: string;
  area?: string;
  criteria: RubricCriterionPayload[];
};

export function getRubricTemplates(): Promise<RubricTemplateItem[]> {
  return apiRequest<RubricTemplateItem[]>("/api/rubrics/templates", {
    action: "consultar las rúbricas",
  });
}

export function getRubricTemplate(id: number): Promise<RubricTemplateItem> {
  return apiRequest<RubricTemplateItem>(`/api/rubrics/templates/${id}`, {
    action: "consultar la rúbrica",
  });
}

export function createRubricTemplate(
  payload: RubricTemplatePayload,
): Promise<RubricTemplateItem> {
  return apiRequest<RubricTemplateItem>("/api/rubrics/templates", {
    method: "POST",
    body: payload,
    action: "crear la rúbrica",
  });
}

export function updateRubricTemplate(
  id: number,
  payload: RubricTemplatePayload,
): Promise<RubricTemplateItem> {
  return apiRequest<RubricTemplateItem>(`/api/rubrics/templates/${id}`, {
    method: "PATCH",
    body: payload,
    action: "actualizar la rúbrica",
  });
}

export function archiveRubricTemplate(id: number): Promise<RubricTemplateItem> {
  return apiRequest<RubricTemplateItem>(
    `/api/rubrics/templates/${id}/archive`,
    {
      method: "PATCH",
      action: "archivar la rúbrica",
    },
  );
}
