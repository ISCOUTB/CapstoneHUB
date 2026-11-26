"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowDownSLine, RiEditLine, RiFilePdfLine } from "@remixicon/react";
import {
  getProjectMilestoneAssessments,
  saveProjectMilestoneAssessment,
  type MilestoneAssessmentAnswer,
  type MilestoneAssessmentAnswers,
  type MilestoneAssessmentItem,
  type MilestoneAssessmentSection,
  type MilestoneAssessmentTemplate,
  type ProjectMilestoneAssessment,
} from "../../services/milestone-assessments";
import {
  getProjectProgramsCatalog,
  replaceProjectPrograms,
} from "../../services/projects";
import {
  canManageMilestoneAssessments,
  canManageProjectPrograms,
} from "../../services/project-permissions";
import { downloadMilestoneReport } from "../../services/project-exports";
import { canExportProjectData } from "../../services/roles";
import {
  ProjectProgramRequirement,
  ProjectProgramSchool,
} from "../../services/schemas";
import { useAuth } from "../../components/auth-provider";
import AccessNotice from "../../components/access-notice";
import CollapsibleCard from "../../components/collapsible-card";
import { isEngineeringProgram } from "../../components/project-program-requirements";
import ProjectProgramDialog, {
  type ProjectProgramOption,
  type ProjectProgramValue,
} from "./project-program-dialog";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProjectMilestoneAssessmentsPanelProps = {
  readonly projectId: number;
  readonly actorAssignments: {
    readonly id: number;
    readonly userId: number;
    readonly role: string;
  }[];
  readonly programRequirements: readonly ProjectProgramRequirement[];
  readonly onProjectChange: () => Promise<void>;
};

type AnswerUpdate = (
  programId: string,
  itemId: string,
  update: Partial<MilestoneAssessmentAnswer>,
) => void;

type AssessmentItemRowProps = {
  readonly programId: string;
  readonly item: MilestoneAssessmentItem;
  readonly answer: MilestoneAssessmentAnswer;
  readonly placeholder: string;
  readonly onUpdate: AnswerUpdate;
};

const EMPTY_ANSWER: MilestoneAssessmentAnswer = {
  status: null,
  observation: "",
};
const ASSESSMENT_STATUSES = ["yes", "no", "na"] as const;

function isDeliverablesSection(title: string): boolean {
  return title.toLocaleLowerCase("es").includes("entregable");
}

function createEmptyAnswers(
  template: MilestoneAssessmentTemplate,
): MilestoneAssessmentAnswers {
  const answers: MilestoneAssessmentAnswers = {};

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

function normalizeAnswers(
  template: MilestoneAssessmentTemplate,
  answers?: MilestoneAssessmentAnswers,
): MilestoneAssessmentAnswers {
  const defaults = createEmptyAnswers(template);
  const normalized = { ...defaults, ...answers };

  for (const [itemId, defaultAnswer] of Object.entries(defaults)) {
    const savedAnswer = answers?.[itemId];
    if (defaultAnswer.status === "yes" && !savedAnswer?.status) {
      normalized[itemId] = {
        ...defaultAnswer,
        ...savedAnswer,
        status: "yes",
      };
    }
  }

  return normalized;
}

function AssessmentItemRow({
  programId,
  item,
  answer,
  placeholder,
  onUpdate,
}: AssessmentItemRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {item.id.startsWith("overview-")
          ? item.label
          : `${item.id} ${item.label}`}
      </TableCell>
      {ASSESSMENT_STATUSES.map((status) => (
        <TableCell key={status} className="text-center">
          <input
            type="radio"
            name={`${programId}-${item.id}`}
            aria-label={`${item.label}: ${status}`}
            checked={answer.status === status}
            onChange={() => onUpdate(programId, item.id, { status })}
            className="h-4 w-4 accent-primary"
          />
        </TableCell>
      ))}
      <TableCell>
        <Textarea
          value={answer.observation}
          onChange={(event) =>
            onUpdate(programId, item.id, { observation: event.target.value })
          }
          rows={2}
          maxLength={1000}
          placeholder={placeholder}
        />
      </TableCell>
    </TableRow>
  );
}

function AssessmentTable({
  programId,
  items,
  answers,
  heading,
  itemHeading,
  placeholder,
  defaultOpen = false,
  onUpdate,
}: {
  readonly programId: string;
  readonly items: readonly MilestoneAssessmentItem[];
  readonly answers: MilestoneAssessmentAnswers;
  readonly heading: string;
  readonly itemHeading: string;
  readonly placeholder: string;
  readonly defaultOpen?: boolean;
  readonly onUpdate: AnswerUpdate;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const answeredCount = items.filter((item) => {
    const answer = answers[item.id] ?? EMPTY_ANSWER;
    return answer.status !== null || answer.observation.trim().length > 0;
  }).length;

  return (
    <details
      className="group rounded-xl border border-border/70"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="font-semibold">{heading}</h3>
          <p className="text-xs text-muted-foreground">
            {answeredCount} de {items.length} requisito(s) con respuesta
          </p>
        </div>
        <RiArrowDownSLine
          className="size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="overflow-x-auto border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[260px]">{itemHeading}</TableHead>
              <TableHead className="w-16 text-center">Sí</TableHead>
              <TableHead className="w-16 text-center">No</TableHead>
              <TableHead className="w-16 text-center">N/A</TableHead>
              <TableHead className="min-w-[220px]">Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <AssessmentItemRow
                key={item.id}
                programId={programId}
                item={item}
                answer={answers[item.id] ?? EMPTY_ANSWER}
                placeholder={placeholder}
                onUpdate={onUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </details>
  );
}

function AssessmentSectionTable({
  programId,
  section,
  answers,
  onUpdate,
}: {
  readonly programId: string;
  readonly section: MilestoneAssessmentSection;
  readonly answers: MilestoneAssessmentAnswers;
  readonly onUpdate: AnswerUpdate;
}) {
  return (
    <AssessmentTable
      programId={programId}
      items={section.items}
      answers={answers}
      heading={`${section.id}. ${section.title}`}
      itemHeading="Requisito"
      placeholder="Observación del profesor..."
      onUpdate={onUpdate}
    />
  );
}

function TeacherAssessmentEditor({
  programId,
  template,
  answers,
  saving,
  saved,
  onUpdate,
  onSave,
}: {
  readonly programId: string;
  readonly template: MilestoneAssessmentTemplate;
  readonly answers: MilestoneAssessmentAnswers;
  readonly saving: boolean;
  readonly saved: boolean;
  readonly onUpdate: AnswerUpdate;
  readonly onSave: () => void;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Marque una sola opción por requisito. Use las observaciones para
        justificar los puntos marcados como No o N/A e indicar los ajustes
        requeridos.
      </p>
      <div className="space-y-5">
        <AssessmentTable
          programId={programId}
          items={template.overviewItems}
          answers={answers}
          heading="Resumen general de hitos"
          itemHeading="Hito"
          placeholder="Observación general..."
          defaultOpen
          onUpdate={onUpdate}
        />
        {template.sections.map((section) => (
          <AssessmentSectionTable
            key={section.id}
            programId={programId}
            section={section}
            answers={answers}
            onUpdate={onUpdate}
          />
        ))}
      </div>
      {template.notes?.map((note) => (
        <p
          key={note}
          className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground"
        >
          {note}
        </p>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <Spinner data-icon="inline-start" /> Guardando...
            </>
          ) : (
            "Guardar evaluación"
          )}
        </Button>
        {saved ? (
          <span className="text-sm text-emerald-700">
            Evaluación guardada correctamente.
          </span>
        ) : null}
      </div>
    </>
  );
}

function StudentMilestoneSummary({
  template,
  answers,
}: {
  readonly template: MilestoneAssessmentTemplate;
  readonly answers: MilestoneAssessmentAnswers;
}) {
  const visibleSections = template.overviewItems
    .map((item, index) => {
      const overviewAnswer = answers[item.id] ?? EMPTY_ANSWER;
      const section = template.sections[index];
      const visibleItems =
        section?.items.filter((detail) => {
          const answer = answers[detail.id] ?? EMPTY_ANSWER;
          return answer.status === "yes" || Boolean(answer.observation.trim());
        }) ?? [];
      const isVisible =
        overviewAnswer.status === "yes" ||
        Boolean(overviewAnswer.observation.trim()) ||
        visibleItems.length > 0;

      return isVisible ? { item, overviewAnswer, visibleItems } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (visibleSections.length === 0) {
    return (
      <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        El profesor todavía no ha publicado requisitos ni observaciones para
        este formato.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Selecciona un hito para consultar los requisitos que el profesor ha
        marcado como incluidos y sus observaciones.
      </p>
      {visibleSections.map(({ item, overviewAnswer, visibleItems }) => (
        <details
          key={item.id}
          className="group rounded-xl border border-border/70"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="font-medium">{item.label}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {visibleItems.length}{" "}
              {visibleItems.length === 1 ? "requisito" : "requisitos"}
              <RiArrowDownSLine
                className="size-4 shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180"
                aria-hidden="true"
              />
            </span>
          </summary>
          <div className="space-y-3 border-t px-4 py-3 text-sm">
            {overviewAnswer.observation.trim() ? (
              <p className="text-muted-foreground">
                {overviewAnswer.observation}
              </p>
            ) : null}
            {visibleItems.length > 0 ? (
              <ul className="space-y-2">
                {visibleItems.map((detail) => (
                  <StudentVisibleRequirement
                    key={detail.id}
                    item={detail}
                    answer={answers[detail.id] ?? EMPTY_ANSWER}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function StudentVisibleRequirement({
  item,
  answer,
}: {
  readonly item: MilestoneAssessmentItem;
  readonly answer: MilestoneAssessmentAnswer;
}) {
  return (
    <li>
      <p>{item.label}</p>
      {answer.observation.trim() ? (
        <p className="mt-1 text-muted-foreground">
          Observación del docente: {answer.observation}
        </p>
      ) : null}
    </li>
  );
}

function ProjectProgramsCard({
  projectId,
  programRequirements,
  canManage,
  onSaved,
}: {
  readonly projectId: number;
  readonly programRequirements: readonly ProjectProgramRequirement[];
  readonly canManage: boolean;
  readonly onSaved: (programs: ProjectProgramRequirement[]) => Promise<void>;
}) {
  const [schools, setSchools] = useState<ProjectProgramSchool[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    let cancelled = false;

    void getProjectProgramsCatalog()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setSchools(result.schools);
        setCatalogError(result.error ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogError("No se pudo cargar el catálogo de programas.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canManage, catalogAttempt]);

  if (!canManage) {
    return null;
  }

  const options: ProjectProgramOption[] = schools
    .flatMap((school) =>
      school.programs.map((program) => ({
        programId: program.id,
        programName: program.name,
        schoolName: school.name,
      })),
    )
    .filter((option) =>
      isEngineeringProgram(option.programId, option.programName),
    );
  const optionIds = new Set(options.map((option) => option.programId));
  const existingOptions: ProjectProgramOption[] = programRequirements
    .filter((item) => !optionIds.has(item.programId))
    .map((item) => ({
      programId: item.programId,
      programName: item.programName,
      schoolName: item.schoolName ?? "Otros programas",
    }));
  const dialogOptions = [...options, ...existingOptions];
  const programName = (programId: string) =>
    dialogOptions.find((option) => option.programId === programId)
      ?.programName ??
    programRequirements.find((item) => item.programId === programId)
      ?.programName ??
    programId;

  async function savePrograms(
    nextPrograms: ProjectProgramValue[],
  ): Promise<void> {
    setSaved(false);

    const savedPrograms = await replaceProjectPrograms(
      String(projectId),
      nextPrograms,
    );
    setSaved(true);
    await onSaved(savedPrograms);
  }

  return (
    <>
      <CollapsibleCard
        title="Programas del proyecto"
        description="Los programas definen los formatos de evaluación de hitos. Puedes agregarlos, quitarlos o cambiar sus estudiantes desde el diálogo de edición."
        badges={
          <Badge variant="outline">
            {programRequirements.length === 1
              ? "1 programa"
              : `${programRequirements.length} programas`}
          </Badge>
        }
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSaved(false);
              setDialogOpen(true);
            }}
            disabled={catalogLoading}
          >
            {catalogLoading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RiEditLine data-icon="inline-start" />
            )}
            {catalogLoading ? "Cargando..." : "Editar programas"}
          </Button>
        }
        expanded={expanded}
        onExpandedChange={setExpanded}
        toggleLabel="los programas del proyecto"
        contentClassName="space-y-4"
      >
        {catalogError ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              {catalogError}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCatalogLoading(true);
                  setCatalogError(null);
                  setCatalogAttempt((attempt) => attempt + 1);
                }}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {programRequirements.length === 0 ? (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Este proyecto no tiene programas asociados. Usa «Editar programas»
            para agregarlos.
          </p>
        ) : (
          <div className="space-y-2">
            {programRequirements.map((item) => (
              <div
                key={item.programId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {programName(item.programId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.programId}
                  </p>
                </div>
                <Badge variant="secondary">
                  {item.studentCount === 1
                    ? "1 estudiante"
                    : `${item.studentCount} estudiantes`}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {saved ? (
          <p className="text-sm text-emerald-700">
            Programas actualizados correctamente.
          </p>
        ) : null}
      </CollapsibleCard>

      <ProjectProgramDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        options={dialogOptions}
        currentPrograms={programRequirements}
        loadError={catalogError}
        onSave={savePrograms}
      />
    </>
  );
}

function ProgramAssessmentCard({
  assessment,
  canManage,
  saving,
  saved,
  onUpdate,
  onSave,
}: {
  readonly assessment: ProjectMilestoneAssessment;
  readonly canManage: boolean;
  readonly saving: boolean;
  readonly saved: boolean;
  readonly onUpdate: AnswerUpdate;
  readonly onSave: () => void;
}) {
  const [showStudentPreview, setShowStudentPreview] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!assessment.template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{assessment.programName}</CardTitle>
          <CardDescription>
            Este programa todavía no tiene un formato de evaluación de hitos.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const template = assessment.template;
  const answers = normalizeAnswers(template, assessment.answers);
  const answeredItems = Object.values(answers).filter(
    (answer) => answer.status !== null,
  ).length;

  return (
    <CollapsibleCard
      title={template.programName}
      description={template.introduction}
      badges={
        <Badge variant="outline">
          {canManage && !showStudentPreview
            ? `${answeredItems}/${assessment.summary.totalItems} evaluados`
            : "Resumen"}
        </Badge>
      }
      actions={
        canManage ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowStudentPreview((current) => !current)}
          >
            {showStudentPreview ? "Volver a editar" : "Vista del estudiante"}
          </Button>
        ) : null
      }
      expanded={expanded}
      onExpandedChange={setExpanded}
      toggleLabel={`la evaluación de ${template.programName}`}
      contentClassName="space-y-4"
    >
      {canManage && !showStudentPreview ? (
        <TeacherAssessmentEditor
          programId={assessment.programId}
          template={template}
          answers={answers}
          saving={saving}
          saved={saved}
          onUpdate={onUpdate}
          onSave={onSave}
        />
      ) : (
        <StudentMilestoneSummary template={template} answers={answers} />
      )}
    </CollapsibleCard>
  );
}

export default function ProjectMilestoneAssessmentsPanel({
  projectId,
  actorAssignments,
  programRequirements,
  onProjectChange,
}: ProjectMilestoneAssessmentsPanelProps) {
  const { session, isAuthenticated, ready } = useAuth();
  const router = useRouter();
  const canManage = useMemo(
    () =>
      session
        ? canManageMilestoneAssessments(session.user, actorAssignments)
        : false,
    [session, actorAssignments],
  );
  const canManagePrograms = useMemo(
    () =>
      session
        ? canManageProjectPrograms(session.user, actorAssignments)
        : false,
    [session, actorAssignments],
  );
  const canDownloadReport = session
    ? canExportProjectData(session.user.roles) && canManage
    : false;
  const [assessments, setAssessments] = useState<ProjectMilestoneAssessment[]>(
    [],
  );
  const [programs, setPrograms] = useState<ProjectProgramRequirement[]>([
    ...programRequirements,
  ]);
  const [loading, setLoading] = useState(true);
  const [savingProgram, setSavingProgram] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successProgram, setSuccessProgram] = useState<string | null>(null);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadAssessments = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;

      if (!background) {
        setLoading(true);
      }

      setErrorMessage(null);
      try {
        setAssessments(await getProjectMilestoneAssessments(String(projectId)));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la evaluación de hitos.",
        );
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    setPrograms([...programRequirements]);
  }, [programRequirements]);

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  const handleProgramsSaved = useCallback(
    async (savedPrograms: ProjectProgramRequirement[]) => {
      setPrograms(savedPrograms);
      await loadAssessments({ background: true });
      await onProjectChange();
    },
    [loadAssessments, onProjectChange],
  );

  const updateAnswer = useCallback<AnswerUpdate>(
    (programId, itemId, update) => {
      setAssessments((previous) =>
        previous.map((assessment) =>
          assessment.programId === programId
            ? {
                ...assessment,
                answers: {
                  ...assessment.answers,
                  [itemId]: {
                    ...(assessment.answers[itemId] ?? EMPTY_ANSWER),
                    ...update,
                  },
                },
              }
            : assessment,
        ),
      );
      setSuccessProgram(null);
    },
    [],
  );

  const saveAssessment = useCallback(
    async (programId: string) => {
      const assessment = assessments.find(
        (entry) => entry.programId === programId,
      );
      if (!assessment?.template) {
        return;
      }

      setSavingProgram(programId);
      setErrorMessage(null);
      setSuccessProgram(null);
      try {
        const saved = await saveProjectMilestoneAssessment(
          String(projectId),
          programId,
          normalizeAnswers(assessment.template, assessment.answers),
        );
        setAssessments((previous) =>
          previous.map((entry) =>
            entry.programId === programId ? saved : entry,
          ),
        );
        setSuccessProgram(programId);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la evaluación de hitos.",
        );
      } finally {
        setSavingProgram(null);
      }
    },
    [assessments, projectId, router],
  );

  async function handleDownloadReport() {
    setIsDownloadingReport(true);
    setReportError(null);

    try {
      await downloadMilestoneReport(projectId);
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el informe de hitos.",
      );
    } finally {
      setIsDownloadingReport(false);
    }
  }

  if (!ready) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Cargando acceso...
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <AccessNotice
        title="Acceso requerido"
        message="Inicia sesión para consultar la evaluación de hitos."
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Spinner /> Cargando evaluación de hitos...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Evaluación de hitos</h2>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Registra el avance de los requisitos por programa. Esta evaluación no bloquea el avance de fase ni el cierre del proyecto."
              : "Resumen de los requisitos de hitos correspondientes a los programas del proyecto."}
          </p>
        </div>

        {canDownloadReport ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            disabled={isDownloadingReport}
            aria-busy={isDownloadingReport}
          >
            {isDownloadingReport ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RiFilePdfLine data-icon="inline-start" />
            )}
            {isDownloadingReport ? "Generando…" : "Descargar informe de hitos"}
          </Button>
        ) : null}
      </div>

      {reportError ? (
        <Alert variant="destructive">
          <AlertDescription>{reportError}</AlertDescription>
        </Alert>
      ) : null}

      <ProjectProgramsCard
        projectId={projectId}
        programRequirements={programs}
        canManage={canManagePrograms}
        onSaved={handleProgramsSaved}
      />

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {assessments.length === 0 ? (
        <Alert>
          <AlertDescription>
            {canManagePrograms
              ? "Agrega al menos un programa para habilitar su evaluación de hitos."
              : "Este proyecto no tiene programas académicos asociados con un formato de evaluación de hitos."}
          </AlertDescription>
        </Alert>
      ) : (
        assessments.map((assessment) => (
          <ProgramAssessmentCard
            key={assessment.programId}
            assessment={assessment}
            canManage={canManage}
            saving={savingProgram === assessment.programId}
            saved={successProgram === assessment.programId}
            onUpdate={updateAnswer}
            onSave={() => void saveAssessment(assessment.programId)}
          />
        ))
      )}
    </div>
  );
}
