"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getProjectMilestoneRubrics, saveProjectMilestoneRubric } from "../../services/milestone-rubrics";
import type { ProjectProgramRequirement } from "../../services/schemas";
import { canManageMilestones } from "../../services/project-permissions";
import { useAuth } from "../../components/auth-provider";
import AccessNotice from "../../components/access-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RUBRIC_TEMPLATES, type RubricAnswer, type RubricAnswers, type RubricTemplate } from "./milestones/rubric-templates";

type ProjectMilestonesPanelProps = {
  readonly projectId: number;
  readonly actorAssignments: { id: number; userId: number; role: string }[];
  readonly programRequirements: ProjectProgramRequirement[];
};

const EMPTY_ANSWER: RubricAnswer = { status: null, observation: "" };

function isDeliverablesSection(title: string): boolean {
  return title.toLocaleLowerCase("es").includes("entregable");
}

function createEmptyAnswers(programId: string): RubricAnswers {
  const template = RUBRIC_TEMPLATES[programId];
  if (!template) return {};

  const answers: RubricAnswers = {};
  for (const item of template.overviewItems) {
    answers[item.id] = {
      ...EMPTY_ANSWER,
      status: isDeliverablesSection(item.label) ? "yes" : null,
    };
  }
  for (const section of template.sections) {
    const isMandatoryDeliverable = isDeliverablesSection(section.title);
    for (const item of section.items) {
      answers[item.id] = {
        ...EMPTY_ANSWER,
        status: isMandatoryDeliverable ? "yes" : null,
      };
    }
  }
  return answers;
}

function normalizeAnswers(programId: string, answers?: RubricAnswers): RubricAnswers {
  const defaults = createEmptyAnswers(programId);
  const normalized = { ...defaults, ...(answers ?? {}) };

  for (const [itemId, defaultAnswer] of Object.entries(defaults)) {
    const savedAnswer = answers?.[itemId];
    if (defaultAnswer.status === "yes" && (!savedAnswer || savedAnswer.status === null)) {
      normalized[itemId] = {
        ...defaultAnswer,
        ...savedAnswer,
        status: "yes",
      };
    }
  }

  return normalized;
}

export default function ProjectMilestonesPanel({ projectId, actorAssignments, programRequirements }: ProjectMilestonesPanelProps) {
  const { session, isAuthenticated, ready } = useAuth();
  const canManage = useMemo(() => session ? canManageMilestones(session.user, actorAssignments) : false, [session, actorAssignments]);
  const programs = useMemo(() => programRequirements
    .map((requirement) => ({ ...requirement, template: RUBRIC_TEMPLATES[requirement.programId] }))
    .filter((requirement): requirement is ProjectProgramRequirement & { template: RubricTemplate } => Boolean(requirement.template)), [programRequirements]);
  const unsupportedPrograms = programRequirements.filter((requirement) => !RUBRIC_TEMPLATES[requirement.programId]);
  const [rubrics, setRubrics] = useState<Record<string, RubricAnswers>>({});
  const [loading, setLoading] = useState(true);
  const [savingProgram, setSavingProgram] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successProgram, setSuccessProgram] = useState<string | null>(null);

  const loadRubrics = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const saved = await getProjectMilestoneRubrics(projectId);
      const next: Record<string, RubricAnswers> = {};
      for (const program of programs) {
        const stored = saved.find((rubric) => rubric.programId === program.programId);
        next[program.programId] = normalizeAnswers(program.programId, stored?.answers);
      }
      setRubrics(next);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudieron cargar los hitos.");
    } finally {
      setLoading(false);
    }
  }, [projectId, programs]);

  useEffect(() => { void loadRubrics(); }, [loadRubrics]);

  function updateAnswer(programId: string, itemId: string, update: Partial<RubricAnswer>) {
    setRubrics((previous) => ({
      ...previous,
      [programId]: {
        ...(previous[programId] ?? createEmptyAnswers(programId)),
        [itemId]: { ...(previous[programId]?.[itemId] ?? EMPTY_ANSWER), ...update },
      },
    }));
    setSuccessProgram(null);
  }

  async function saveRubric(programId: string) {
    setSavingProgram(programId);
    setErrorMessage(null);
    setSuccessProgram(null);
    try {
      const saved = await saveProjectMilestoneRubric(projectId, programId, rubrics[programId] ?? {});
      setRubrics((previous) => ({ ...previous, [programId]: normalizeAnswers(programId, saved.answers) }));
      setSuccessProgram(programId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la evaluación.");
    } finally {
      setSavingProgram(null);
    }
  }


  if (!ready) return <Card><CardContent className="py-6 text-sm text-muted-foreground">Cargando acceso...</CardContent></Card>;
  if (!isAuthenticated) return <AccessNotice title="Acceso requerido" message="Inicia sesión para consultar los hitos del proyecto." />;

  if (loading) return <Card><CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Spinner /> Cargando formatos de hitos...</CardContent></Card>;
  if (programs.length === 0) return <Alert><AlertDescription>Este proyecto no tiene programas académicos con un formato de hitos disponible. Actualmente se encuentran configurados Ingeniería Ambiental, Ingeniería Industrial e Ingeniería Mecatrónica.</AlertDescription></Alert>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Hitos del proyecto</h2>
        <p className="text-sm text-muted-foreground">{canManage ? "Formatos de evaluación asociados automáticamente a los programas del proyecto." : "Resumen de los requisitos de hitos correspondientes a los programas del proyecto."}</p>
      </div>
      {errorMessage ? <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
      {programs.map((program) => {
        const template = program.template;
        const answers = rubrics[program.programId] ?? createEmptyAnswers(program.programId);
        const totalItems = template.overviewItems.length + template.sections.reduce((total, section) => total + section.items.length, 0);
        const answeredItems = (Object.values(answers) as RubricAnswer[]).filter((answer) => answer.status !== null).length;
        return (
          <Card key={program.programId}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{template.programName}</CardTitle>
                  <CardDescription>{program.studentCount} estudiante(s) requerido(s) · {template.introduction}</CardDescription>
                </div>
                <Badge variant="outline">{canManage ? `${answeredItems}/${totalItems} evaluados` : "Resumen"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canManage ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selecciona un hito para consultar los requisitos que el profesor ha marcado como incluidos y sus observaciones.
                  </p>
                  <div className="space-y-2">
                    {template.overviewItems.map((item, index) => {
                      const overviewAnswer = answers[item.id] ?? EMPTY_ANSWER;
                      const section = template.sections[index];
                      const visibleItems = section?.items.filter((detail) => {
                        const answer = answers[detail.id] ?? EMPTY_ANSWER;
                        return answer.status === "yes" || Boolean(answer.observation.trim());
                      }) ?? [];
                      const overviewVisible = overviewAnswer.status === "yes" || Boolean(overviewAnswer.observation.trim());

                      if (!overviewVisible && visibleItems.length === 0) return null;

                      return (
                        <details key={item.id} className="rounded-lg border px-4 py-3">
                          <summary className="cursor-pointer font-medium">
                            {item.label}
                          </summary>
                          <div className="mt-3 space-y-3 pl-1 text-sm">
                            {overviewAnswer.observation.trim() ? (
                              <p className="text-muted-foreground">
                                {overviewAnswer.observation}
                              </p>
                            ) : null}
                            {visibleItems.length > 0 ? (
                              <ul className="space-y-2">
                                {visibleItems.map((detail) => {
                                  const answer = answers[detail.id] ?? EMPTY_ANSWER;
                                  return (
                                    <li key={detail.id}>
                                      <p>{detail.label}</p>
                                      {answer.observation.trim() ? (
                                        <p className="mt-1 text-muted-foreground">
                                          Observación del docente: {answer.observation}
                                        </p>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                  {template.overviewItems.every((item, index) => {
                    const answer = answers[item.id] ?? EMPTY_ANSWER;
                    const section = template.sections[index];
                    const hasVisibleDetail = section?.items.some((detail) => {
                      const detailAnswer = answers[detail.id] ?? EMPTY_ANSWER;
                      return detailAnswer.status === "yes" || Boolean(detailAnswer.observation.trim());
                    });
                    return answer.status !== "yes" && !answer.observation.trim() && !hasVisibleDetail;
                  }) ? (
                    <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                      El profesor todavía no ha publicado requisitos ni observaciones para este formato.
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Marque una sola opción por requisito. Use las observaciones para justificar los puntos marcados como No o N/A e indicar los ajustes requeridos.</p>
                  <div className="space-y-5">
                    <section className="space-y-2">
                      <h3 className="font-semibold">Resumen general de hitos</h3>
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader><TableRow><TableHead className="min-w-[260px]">Hito</TableHead><TableHead className="w-16 text-center">Sí</TableHead><TableHead className="w-16 text-center">No</TableHead><TableHead className="w-16 text-center">N/A</TableHead><TableHead className="min-w-[220px]">Observación general</TableHead></TableRow></TableHeader>
                          <TableBody>{template.overviewItems.map((item) => {
                            const answer = answers[item.id] ?? EMPTY_ANSWER;
                            return <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.label}</TableCell>
                              {(["yes", "no", "na"] as const).map((status) => <TableCell key={status} className="text-center"><input type="radio" name={`${program.programId}-${item.id}`} aria-label={`${item.label}: ${status}`} checked={answer.status === status} onChange={() => updateAnswer(program.programId, item.id, { status })} className="h-4 w-4 accent-primary" /></TableCell>)}
                              <TableCell><Textarea value={answer.observation} onChange={(event) => updateAnswer(program.programId, item.id, { observation: event.target.value })} rows={2} maxLength={1000} placeholder="Observación general..." /></TableCell>
                            </TableRow>;
                          })}</TableBody>
                        </Table>
                      </div>
                    </section>
                    {template.sections.map((section) => (
                      <section key={section.id} className="space-y-2">
                        <h3 className="font-semibold">{section.id}. {section.title}</h3>
                        <div className="overflow-x-auto rounded-md border">
                          <Table>
                            <TableHeader><TableRow><TableHead className="min-w-[260px]">Requisito</TableHead><TableHead className="w-16 text-center">Sí</TableHead><TableHead className="w-16 text-center">No</TableHead><TableHead className="w-16 text-center">N/A</TableHead><TableHead className="min-w-[220px]">Observaciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {section.items.map((item) => {
                                const answer = answers[item.id] ?? EMPTY_ANSWER;
                                return <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.id} {item.label}</TableCell>
                                  {(["yes", "no", "na"] as const).map((status) => <TableCell key={status} className="text-center"><input type="radio" name={`${program.programId}-${item.id}`} aria-label={`${item.label}: ${status}`} checked={answer.status === status} onChange={() => updateAnswer(program.programId, item.id, { status })} className="h-4 w-4 accent-primary" /></TableCell>)}
                                  <TableCell><Textarea value={answer.observation} onChange={(event) => updateAnswer(program.programId, item.id, { observation: event.target.value })} rows={2} maxLength={1000} placeholder="Observación del profesor..." /></TableCell>
                                </TableRow>;
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </section>
                    ))}
                  </div>
                  {template.notes?.map((note) => <p key={note} className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{note}</p>)}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => void saveRubric(program.programId)} disabled={savingProgram !== null}>{savingProgram === program.programId ? <><Spinner data-icon="inline-start" /> Guardando...</> : "Guardar evaluación"}</Button>
                    {successProgram === program.programId ? <span className="text-sm text-emerald-700">Evaluación guardada correctamente.</span> : null}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
