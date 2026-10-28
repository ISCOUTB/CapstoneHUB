"use client";

import { useMemo, useState, useTransition } from "react";
import { RiCheckLine, RiErrorWarningLine, RiLockLine } from "@remixicon/react";
import {
  assignProjectRubric,
  clearProjectRubric,
  getProjectEvaluations,
  PhaseEvaluation,
  ProjectEvaluationItem,
  saveProjectEvaluation,
} from "../../services/evaluations";
import { useApiResource } from "@/lib/use-api-resource";
import { ProjectDetails, ProjectPhase } from "../../services/schemas";
import { formatDate, formatGrade, formatPhase } from "../../services/utils";
import { useAuth } from "../../components/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type ProjectEvaluationTabProps = {
  project: ProjectDetails;
  onProjectChange: () => Promise<void>;
};

function phaseLabel(phase: ProjectPhase): string {
  return formatPhase(phase);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function evaluationSubmitLabel(
  isPending: boolean,
  hasEvaluation: boolean,
): string {
  if (isPending) {
    return "Guardando evaluación...";
  }

  return hasEvaluation ? "Actualizar evaluación" : "Guardar evaluación";
}

function rubricDescription(rubric: PhaseEvaluation["rubric"]): string {
  const parts = [rubric.name];

  if (rubric.area) {
    parts.push(`· ${rubric.area}`);
  }

  if (rubric.isDefault) {
    parts.push("· Rúbrica general");
  }

  return parts.join(" ");
}

function PhaseStatusBadge({
  phaseEvaluation,
  projectPhase,
}: Readonly<{
  phaseEvaluation: PhaseEvaluation;
  projectPhase?: ProjectPhase;
}>) {
  if (phaseEvaluation.isCurrent) {
    return <Badge>Fase actual</Badge>;
  }

  if (
    phaseEvaluation.phase === "semester_2" &&
    projectPhase === "semester_1"
  ) {
    return <Badge variant="outline">Próxima</Badge>;
  }

  return <Badge variant="outline">Historial</Badge>;
}

function EvaluationCompletionBadge({
  completed,
}: Readonly<{ completed: boolean }>) {
  if (completed) {
    return (
      <Badge variant="secondary">
        <RiCheckLine data-icon="inline-start" />
        Evaluación completa
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      <RiErrorWarningLine data-icon="inline-start" />
      Evaluación pendiente
    </Badge>
  );
}

function RubricAssignControl({
  projectId,
  phase,
  phaseEvaluation,
  templates,
  onChanged,
}: Readonly<{
  projectId: number;
  phase: ProjectPhase;
  phaseEvaluation: PhaseEvaluation;
  templates: PhaseEvaluation["rubric"][];
  onChanged: () => Promise<void>;
}>) {
  const [selection, setSelection] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const selected =
    selection ??
    (phaseEvaluation.rubric.isDefault
      ? "default"
      : String(phaseEvaluation.rubric.id));

  if (!phaseEvaluation.canAssignRubric) {
    return (
      <p className="text-xs text-muted-foreground">
        La rúbrica queda bloqueada en cuanto exista una evaluación de esta fase.
      </p>
    );
  }

  const options = templates.filter(
    (template) => template.isActive && !template.isDefault,
  );

  function handleApply() {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        if (selected === "default") {
          await clearProjectRubric(projectId, phase);
        } else {
          await assignProjectRubric(projectId, phase, Number(selected));
        }
        setSaved(true);
        setSelection(null);
        await onChanged();
      } catch (assignError) {
        setError(
          errorMessage(assignError, "No se pudo asignar la rúbrica."),
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={selected}
          onValueChange={(value) => {
            if (value) {
              setSelection(value);
            }
          }}
          disabled={isPending}
        >
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue>
              {selected === "default"
                ? "Rúbrica general (por defecto)"
                : options.find((template) => String(template.id) === selected)
                    ?.name ?? "Selecciona una rúbrica"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              Rúbrica general (por defecto)
            </SelectItem>
            {options.map((template) => (
              <SelectItem key={template.id} value={String(template.id)}>
                {template.name}
                {template.area ? ` · ${template.area}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleApply}
          disabled={isPending}
        >
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          {isPending ? "Guardando..." : "Aplicar rúbrica"}
        </Button>
      </div>

      {saved ? (
        <p className="text-xs font-medium text-success">Rúbrica actualizada.</p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function EvaluationForm({
  projectId,
  phaseEvaluation,
  onSaved,
}: Readonly<{
  projectId: number;
  phaseEvaluation: PhaseEvaluation;
  onSaved: () => Promise<void>;
}>) {
  const { session } = useAuth();
  const currentUserId = session?.user.id;
  const mine = phaseEvaluation.evaluations.find(
    (evaluation) => evaluation.evaluator.id === currentUserId,
  );

  const [scores, setScores] = useState<Record<number, string>>(() => {
    const next: Record<number, string> = {};
    for (const criterion of phaseEvaluation.rubric.criteria) {
      const existing = mine?.criteria.find(
        (item) => item.position === criterion.position,
      );
      next[criterion.id] = existing ? String(existing.score) : "";
    }
    return next;
  });
  const [comments, setComments] = useState<Record<number, string>>(() => {
    const next: Record<number, string> = {};
    for (const criterion of phaseEvaluation.rubric.criteria) {
      const existing = mine?.criteria.find(
        (item) => item.position === criterion.position,
      );
      next[criterion.id] = existing?.comment ?? "";
    }
    return next;
  });
  const [generalComment, setGeneralComment] = useState(
    mine?.generalComment ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const previewTotal = useMemo(
    () =>
      phaseEvaluation.rubric.criteria.reduce((sum, criterion) => {
        const score = Number(scores[criterion.id]);
        return Number.isFinite(score)
          ? sum + (score * criterion.weightPercent) / 100
          : sum;
      }, 0),
    [phaseEvaluation.rubric.criteria, scores],
  );

  const allScoresPresent = phaseEvaluation.rubric.criteria.every((criterion) => {
    const raw = scores[criterion.id];
    if (raw === undefined || raw.trim() === "") {
      return false;
    }
    const score = Number(raw);
    return Number.isFinite(score) && score >= 0 && score <= 5;
  });

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!allScoresPresent) {
      setError("Debes calificar todos los criterios entre 0.0 y 5.0.");
      return;
    }

    startTransition(async () => {
      try {
        await saveProjectEvaluation(projectId, phaseEvaluation.phase, {
          generalComment: generalComment.trim() || undefined,
          criteria: phaseEvaluation.rubric.criteria.map((criterion) => ({
            criterionId: criterion.id,
            score: Number(scores[criterion.id]),
            comment: comments[criterion.id]?.trim() || undefined,
          })),
        });
        setSaved(true);
        await onSaved();
      } catch (saveError) {
        setError(
          errorMessage(saveError, "No se pudo guardar la evaluación."),
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <FieldGroup>
        <div className="flex flex-col gap-3">
          {phaseEvaluation.rubric.criteria.map((criterion) => (
            <Card key={criterion.id} className="shadow-none">
              <CardContent className="pt-6">
                <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                  <div>
                    <p className="font-medium">{criterion.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Peso: {criterion.weightPercent}%
                    </p>
                    {criterion.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {criterion.description}
                      </p>
                    ) : null}
                  </div>

                  <Field>
                    <FieldLabel
                      htmlFor={`score-${phaseEvaluation.phase}-${criterion.id}`}
                    >
                      Nota (0.0–5.0)
                    </FieldLabel>
                    <Input
                      id={`score-${phaseEvaluation.phase}-${criterion.id}`}
                      type="number"
                      min={0}
                      max={5}
                      step={0.01}
                      value={scores[criterion.id] ?? ""}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [criterion.id]: event.target.value,
                        }))
                      }
                      disabled={isPending}
                      required
                    />
                  </Field>
                </div>

                <Field className="mt-3">
                  <FieldLabel
                    htmlFor={`comment-${phaseEvaluation.phase}-${criterion.id}`}
                  >
                    Comentario del criterio
                  </FieldLabel>
                  <Textarea
                    id={`comment-${phaseEvaluation.phase}-${criterion.id}`}
                    value={comments[criterion.id] ?? ""}
                    onChange={(event) =>
                      setComments((current) => ({
                        ...current,
                        [criterion.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Opcional"
                    disabled={isPending}
                  />
                </Field>
              </CardContent>
            </Card>
          ))}
        </div>

        <Field>
          <FieldLabel htmlFor={`general-comment-${phaseEvaluation.phase}`}>
            Comentario general
          </FieldLabel>
          <Textarea
            id={`general-comment-${phaseEvaluation.phase}`}
            value={generalComment}
            onChange={(event) => setGeneralComment(event.target.value)}
            rows={3}
            placeholder="Observaciones generales de la evaluación (opcional)"
            disabled={isPending}
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Nota ponderada calculada
          </span>
          <span className="text-sm font-semibold">{formatGrade(previewTotal)}</span>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {saved ? (
          <Alert>
            <AlertDescription>Evaluación guardada correctamente.</AlertDescription>
          </Alert>
        ) : null}

        <div>
          <Button type="submit" disabled={isPending || !allScoresPresent}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {evaluationSubmitLabel(isPending, Boolean(mine))}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function EvaluationSection({
  project,
  phaseEvaluation,
  onChanged,
}: Readonly<{
  project: ProjectDetails;
  phaseEvaluation: PhaseEvaluation;
  onChanged: () => Promise<void>;
}>) {
  if (!phaseEvaluation.isCurrent) {
    return null;
  }

  if (project.status !== "in_progress") {
    return (
      <Alert className="mt-4">
        <AlertDescription>
          La evaluación solo se puede editar mientras el proyecto está en
          progreso.
        </AlertDescription>
      </Alert>
    );
  }

  if (!phaseEvaluation.canEvaluate) {
    return (
      <Alert className="mt-4">
        <AlertDescription>
          Solo los evaluadores asignados y administradores pueden enviar la
          evaluación. Los directivos pueden consultar y asignar la rúbrica.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <EvaluationForm
      key={`${phaseEvaluation.phase}-${phaseEvaluation.rubric.id}`}
      projectId={project.id}
      phaseEvaluation={phaseEvaluation}
      onSaved={onChanged}
    />
  );
}

function EvaluationDetails({
  evaluation,
}: Readonly<{
  evaluation: ProjectEvaluationItem;
}>) {
  return (
    <details className="rounded-xl border border-border/70 px-4 py-3">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{evaluation.evaluator.fullName}</span>
        <Badge variant="outline">{formatGrade(evaluation.totalScore)}</Badge>
        <span className="text-xs text-muted-foreground">
          {formatDate(evaluation.submittedAt)}
        </span>
      </summary>

      <div className="mt-3 flex flex-col gap-2">
        {evaluation.criteria.map((criterion) => (
          <div
            key={criterion.id}
            className="flex flex-wrap items-start justify-between gap-2 text-sm"
          >
            <div>
              <p className="font-medium">{criterion.title}</p>
              <p className="text-xs text-muted-foreground">
                Peso {criterion.weightPercent}%
              </p>
              {criterion.comment ? (
                <p className="mt-1 text-muted-foreground">
                  {criterion.comment}
                </p>
              ) : null}
            </div>
            <Badge variant="secondary">{formatGrade(criterion.score)}</Badge>
          </div>
        ))}

        {evaluation.generalComment ? (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {evaluation.generalComment}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function PhaseEvaluationCard({
  project,
  phaseEvaluation,
  templates,
  canManageRubrics,
  onChanged,
}: Readonly<{
  project: ProjectDetails;
  phaseEvaluation: PhaseEvaluation;
  templates: PhaseEvaluation["rubric"][];
  canManageRubrics: boolean;
  onChanged: () => Promise<void>;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {phaseLabel(phaseEvaluation.phase)}
          <PhaseStatusBadge
            phaseEvaluation={phaseEvaluation}
            projectPhase={project.phase}
          />
          <EvaluationCompletionBadge completed={phaseEvaluation.completed} />
        </CardTitle>
        <CardDescription>
          {rubricDescription(phaseEvaluation.rubric)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Promedio de fase</span>
          <Badge variant="secondary">
            {formatGrade(phaseEvaluation.averageScore)}
          </Badge>
          {phaseEvaluation.missingEvaluators.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              Faltan:{" "}
              {phaseEvaluation.missingEvaluators
                .map((evaluator) => evaluator.fullName)
                .join(", ")}
            </span>
          ) : null}
        </div>

        {canManageRubrics ? (
          <div className="mt-4">
            <RubricAssignControl
              projectId={project.id}
              phase={phaseEvaluation.phase}
              phaseEvaluation={phaseEvaluation}
              templates={templates}
              onChanged={onChanged}
            />
          </div>
        ) : null}

        <EvaluationSection
          project={project}
          phaseEvaluation={phaseEvaluation}
          onChanged={onChanged}
        />

        <div className="mt-5 flex flex-col gap-2">
          <p className="text-sm font-medium">Evaluaciones recibidas</p>
          {phaseEvaluation.evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay evaluaciones para esta fase.
            </p>
          ) : (
            phaseEvaluation.evaluations.map((evaluation) => (
              <EvaluationDetails
                key={evaluation.id}
                evaluation={evaluation}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectEvaluationTab({
  project,
  onProjectChange,
}: Readonly<ProjectEvaluationTabProps>) {
  const { data, loading, error, reload } = useApiResource(
    () => getProjectEvaluations(project.id),
    [project.id],
  );

  if (loading) {
    return (
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertDescription>
          {error ?? "No se pudo cargar la evaluación del proyecto."}
        </AlertDescription>
      </Alert>
    );
  }

  const templates = data.availableTemplates ?? [];
  const canManageRubrics = data.availableTemplates !== undefined;

  async function handleChanged() {
    reload();
    await onProjectChange();
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {data.phases.every((phase) => !phase.isCurrent) ? (
        <Alert>
          <AlertDescription>
            No hay una fase activa documentada para este proyecto.
          </AlertDescription>
        </Alert>
      ) : null}

      {data.phases.map((phaseEvaluation) => (
        <PhaseEvaluationCard
          key={phaseEvaluation.phase}
          project={project}
          phaseEvaluation={phaseEvaluation}
          templates={templates}
          canManageRubrics={canManageRubrics}
          onChanged={handleChanged}
        />
      ))}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <RiLockLine aria-hidden="true" />
        Las notas son visibles solo para evaluadores asignados, directivos y
        administradores.
      </p>
    </div>
  );
}
