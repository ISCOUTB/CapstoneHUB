"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RUBRIC_TEMPLATES,
  type RubricAnswer,
  type RubricAnswers,
  type RubricItem,
  type RubricSection,
  type RubricTemplate,
} from "./milestones/rubric-templates";

type ProjectMilestonesPanelProps = {
  readonly projectId: number;
  readonly actorAssignments: { readonly id: number; readonly userId: number; readonly role: string }[];
  readonly programRequirements: readonly ProjectProgramRequirement[];
};

type SupportedProgram = ProjectProgramRequirement & {
  readonly template: RubricTemplate;
};

type AnswerUpdate = (
  programId: string,
  itemId: string,
  update: Partial<RubricAnswer>,
) => void;

type RubricItemRowProps = {
  readonly programId: string;
  readonly item: RubricItem;
  readonly answer: RubricAnswer;
  readonly placeholder: string;
  readonly onUpdate: AnswerUpdate;
};

const EMPTY_ANSWER: RubricAnswer = { status: null, observation: "" };
const RUBRIC_STATUSES = ["yes", "no", "na"] as const;

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

function RubricItemRow({
  programId,
  item,
  answer,
  placeholder,
  onUpdate,
}: RubricItemRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {item.id.startsWith("overview-") ? item.label : `${item.id} ${item.label}`}
      </TableCell>
      {RUBRIC_STATUSES.map((status) => (
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

function RubricTable({
  programId,
  items,
  answers,
  heading,
  itemHeading,
  placeholder,
  onUpdate,
}: {
  readonly programId: string;
  readonly items: readonly RubricItem[];
  readonly answers: RubricAnswers;
  readonly heading: string;
  readonly itemHeading: string;
  readonly placeholder: string;
  readonly onUpdate: AnswerUpdate;
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{heading}</h3>
      <div className="overflow-x-auto rounded-md border">
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
              <RubricItemRow
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
    </section>
  );
}

function TeacherRubricEditor({
  programId,
  template,
  answers,
  saving,
  saved,
  onUpdate,
  onSave,
}: {
  readonly programId: string;
  readonly template: RubricTemplate;
  readonly answers: RubricAnswers;
  readonly saving: boolean;
  readonly saved: boolean;
  readonly onUpdate: AnswerUpdate;
  readonly onSave: () => void;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Marque una sola opción por requisito. Use las observaciones para justificar
        los puntos marcados como No o N/A e indicar los ajustes requeridos.
      </p>
      <div className="space-y-5">
        <RubricTable
          programId={programId}
          items={template.overviewItems}
          answers={answers}
          heading="Resumen general de hitos"
          itemHeading="Hito"
          placeholder="Observación general..."
          onUpdate={onUpdate}
        />
        {template.sections.map((section) => (
          <RubricSectionTable
            key={section.id}
            programId={programId}
            section={section}
            answers={answers}
            onUpdate={onUpdate}
          />
        ))}
      </div>
      {template.notes?.map((note) => (
        <p key={note} className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
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

function RubricSectionTable({
  programId,
  section,
  answers,
  onUpdate,
}: {
  readonly programId: string;
  readonly section: RubricSection;
  readonly answers: RubricAnswers;
  readonly onUpdate: AnswerUpdate;
}) {
  return (
    <RubricTable
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

function StudentMilestoneSummary({
  template,
  answers,
}: {
  readonly template: RubricTemplate;
  readonly answers: RubricAnswers;
}) {
  const visibleSections = template.overviewItems
    .map((item, index) => {
      const overviewAnswer = answers[item.id] ?? EMPTY_ANSWER;
      const section = template.sections[index];
      const visibleItems = section?.items.filter((detail) => {
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
        El profesor todavía no ha publicado requisitos ni observaciones para este formato.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Selecciona un hito para consultar los requisitos que el profesor ha marcado
        como incluidos y sus observaciones.
      </p>
      {visibleSections.map(({ item, overviewAnswer, visibleItems }) => (
        <details key={item.id} className="rounded-lg border px-4 py-3">
          <summary className="cursor-pointer font-medium">{item.label}</summary>
          <div className="mt-3 space-y-3 pl-1 text-sm">
            {overviewAnswer.observation.trim() ? (
              <p className="text-muted-foreground">{overviewAnswer.observation}</p>
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
  readonly item: RubricItem;
  readonly answer: RubricAnswer;
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

function ProjectProgramCard({
  program,
  answers,
  canManage,
  saving,
  saved,
  onUpdate,
  onSave,
}: {
  readonly program: SupportedProgram;
  readonly answers: RubricAnswers;
  readonly canManage: boolean;
  readonly saving: boolean;
  readonly saved: boolean;
  readonly onUpdate: AnswerUpdate;
  readonly onSave: () => void;
}) {
  const { template } = program;
  const totalItems =
    template.overviewItems.length +
    template.sections.reduce((total, section) => total + section.items.length, 0);
  const answeredItems = Object.values(answers).filter(
    (answer) => answer.status !== null,
  ).length;
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{template.programName}</CardTitle>
            <CardDescription>
              {program.studentCount} estudiante(s) requerido(s) · {template.introduction}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowStudentPreview((current) => !current)}
              >
                {showStudentPreview ? "Volver a editar" : "Vista del estudiante"}
              </Button>
            ) : null}
            <Badge variant="outline">
              {canManage && !showStudentPreview
                ? `${answeredItems}/${totalItems} evaluados`
                : "Resumen"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage && !showStudentPreview ? (
          <TeacherRubricEditor
            programId={program.programId}
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
      </CardContent>
    </Card>
  );
}

export default function ProjectMilestonesPanel({
  projectId,
  actorAssignments,
  programRequirements,
}: ProjectMilestonesPanelProps) {
  const { session, isAuthenticated, ready } = useAuth();
  const router = useRouter();
  const canManage = useMemo(
    () => (session ? canManageMilestones(session.user, actorAssignments) : false),
    [session, actorAssignments],
  );
  const programs = useMemo(
    () =>
      programRequirements
        .map((requirement) => ({
          ...requirement,
          template: RUBRIC_TEMPLATES[requirement.programId],
        }))
        .filter(
          (requirement): requirement is SupportedProgram =>
            Boolean(requirement.template),
        ),
    [programRequirements],
  );
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
        const stored = saved.find(
          (rubric) => rubric.programId === program.programId,
        );
        next[program.programId] = normalizeAnswers(
          program.programId,
          stored?.answers,
        );
      }
      setRubrics(next);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los hitos.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, programs]);

  useEffect(() => {
    void loadRubrics();
  }, [loadRubrics]);

  const updateAnswer = useCallback<AnswerUpdate>((programId, itemId, update) => {
    setRubrics((previous) => ({
      ...previous,
      [programId]: {
        ...(previous[programId] ?? createEmptyAnswers(programId)),
        [itemId]: {
          ...(previous[programId]?.[itemId] ?? EMPTY_ANSWER),
          ...update,
        },
      },
    }));
    setSuccessProgram(null);
  }, []);

  const saveRubric = useCallback(
    async (programId: string) => {
      setSavingProgram(programId);
      setErrorMessage(null);
      setSuccessProgram(null);
      try {
        const saved = await saveProjectMilestoneRubric(
          projectId,
          programId,
          rubrics[programId] ?? createEmptyAnswers(programId),
        );
        setRubrics((previous) => ({
          ...previous,
          [programId]: normalizeAnswers(programId, saved.answers),
        }));
        setSuccessProgram(programId);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la evaluación.",
        );
      } finally {
        setSavingProgram(null);
      }
    },
    [projectId, rubrics, router],
  );

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
        message="Inicia sesión para consultar los hitos del proyecto."
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Spinner /> Cargando formatos de hitos...
        </CardContent>
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Este proyecto no tiene programas académicos con un formato de hitos
          disponible. Actualmente se encuentran configurados Ingeniería Ambiental,
          Ingeniería Industrial e Ingeniería Mecatrónica.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Hitos del proyecto</h2>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Formatos de evaluación asociados automáticamente a los programas del proyecto."
            : "Resumen de los requisitos de hitos correspondientes a los programas del proyecto."}
        </p>
      </div>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {programs.map((program) => (
        <ProjectProgramCard
          key={program.programId}
          program={program}
          answers={rubrics[program.programId] ?? createEmptyAnswers(program.programId)}
          canManage={canManage}
          saving={savingProgram === program.programId}
          saved={successProgram === program.programId}
          onUpdate={updateAnswer}
          onSave={() => void saveRubric(program.programId)}
        />
      ))}
    </div>
  );
}
