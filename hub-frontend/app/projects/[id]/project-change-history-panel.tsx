import { ProjectChangeHistoryItem } from "../../services/schemas";
import { RUBRIC_TEMPLATES } from "./milestones/rubric-templates";
import { formatPhase, formatProjectSource } from "../../services/utils";
import { formatCurrency, formatDate } from "./project-formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  description: "Descripción",
  context: "Contexto",
  location: "Ubicación",
  source: "Fuente del proyecto",
  phase: "Fase (semestre)",
  startDate: "Fecha de inicio",
  endDate: "Fecha de finalización",
  estimatedCost: "Costo estimado",
  requiresLegalization: "Requiere legalización",
  isPrivate: "Proyecto privado",
  facultyAdvisor: "Asesor de la facultad",
  teamRequirements: "Equipo requerido",
  expectedOutcomes: "Expectativas al finalizar",
  deliverables: "Entregables",
};


type MilestoneHistoryValue = {
  programId?: string;
  itemId?: string;
  answer?: { status?: string | null; observation?: string } | null;
};

function parseMilestoneHistoryValue(value: string | null): MilestoneHistoryValue | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as MilestoneHistoryValue;
  } catch {
    return null;
  }
}

function formatMilestoneAnswer(value: MilestoneHistoryValue | null): string {
  if (!value) return "Sin información";
  const statusLabels: Record<string, string> = {
    yes: "Sí",
    no: "No",
    na: "N/A",
  };
  const status = value.answer?.status
    ? statusLabels[value.answer.status] ?? value.answer.status
    : "Sin estado";
  const observation = value.answer?.observation?.trim();
  return observation ? `${status} · ${observation}` : status;
}

function getMilestoneHistoryLabel(value: MilestoneHistoryValue | null): string {
  if (!value?.programId || !value.itemId) return "Evaluación de hitos";
  const template = RUBRIC_TEMPLATES[value.programId];
  const item = template?.overviewItems.find((entry) => entry.id === value.itemId)
    ?? template?.sections.flatMap((section) => section.items).find((entry) => entry.id === value.itemId);
  return item ? `${template.programName} · ${item.label}` : `${value.programId} · ${value.itemId}`;
}

function formatChangedAt(dateValue: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatFieldValue(field: string, value: string | null): string {
  if (value === null) {
    return "Sin información";
  }

  if (field === "requiresLegalization" || field === "isPrivate") {
    return value === "true" ? "Sí" : "No";
  }

  if (field === "source") {
    return formatProjectSource(value);
  }

  if (field === "phase") {
    return formatPhase(value);
  }

  if (field === "startDate" || field === "endDate") {
    return formatDate(value);
  }

  if (field === "estimatedCost") {
    return formatCurrency(value);
  }

  if (field === "deliverables") {
    try {
      const list = JSON.parse(value) as unknown;

      if (Array.isArray(list)) {
        return list.length > 0 ? list.join(", ") : "Sin entregables";
      }
    } catch {
      // Valor inesperado: se muestra tal cual.
    }
  }

  return value;
}

type ProjectChangeHistoryPanelProps = {
  readonly history: ProjectChangeHistoryItem[];
};

export default function ProjectChangeHistoryPanel({
  history,
}: ProjectChangeHistoryPanelProps) {
  const entries = history
    .slice()
    .sort(
      (left, right) =>
        new Date(right.changedAt).getTime() -
          new Date(left.changedAt).getTime() || right.id - left.id,
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de cambios del proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Sin historial</EmptyTitle>
              <EmptyDescription>
                No hay cambios en los datos del proyecto registrados.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="flex flex-col gap-4">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card size="sm">
                  <CardContent className="flex flex-col gap-2 pt-4">
                    {entry.field === "milestone_rubric" ? (
                      <>
                        {(() => {
                          const previous = parseMilestoneHistoryValue(entry.previousValue);
                          const next = parseMilestoneHistoryValue(entry.newValue);
                          return (
                            <>
                              <p className="text-sm font-medium">
                                Hitos · {getMilestoneHistoryLabel(next ?? previous)}
                              </p>
                              <p className="text-sm">
                                <span className="text-muted-foreground line-through">
                                  {formatMilestoneAnswer(previous)}
                                </span>{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                <span className="text-foreground">
                                  {formatMilestoneAnswer(next)}
                                </span>
                              </p>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          {FIELD_LABELS[entry.field] ?? entry.field}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground line-through">
                            {formatFieldValue(entry.field, entry.previousValue)}
                          </span>{" "}
                          <span className="text-muted-foreground">→</span>{" "}
                          <span className="text-foreground">
                            {formatFieldValue(entry.field, entry.newValue)}
                          </span>
                        </p>
                      </>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {entry.author
                        ? `Por ${entry.author.fullName}`
                        : "Por usuario desconocido"}{" "}
                      · {formatChangedAt(entry.changedAt)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
