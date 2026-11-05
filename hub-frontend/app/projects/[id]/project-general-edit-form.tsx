"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { getProjectProgramsCatalog, updateProject } from "../../services/projects";
import {
  ProjectDetails,
  ProjectProgramSchool,
  ProjectSource,
  UpdateProjectPayload,
} from "../../services/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import ProjectProgramRequirements from "../../components/project-program-requirements";

const projectSources: ReadonlyArray<{
  value: ProjectSource;
  label: string;
}> = [
  { value: "external_entity", label: "Entidad externa" },
  { value: "research", label: "Investigación" },
  { value: "internal_need", label: "Necesidad interna" },
  { value: "social_impact", label: "Impacto social" },
];

type DeliverableField = {
  id: string;
  value: string;
};

type ProgramRequirementField = {
  id: string;
  programId: string;
  programName: string;
  schoolName: string;
  studentCount: string;
};

type FormState = {
  name: string;
  source: ProjectSource;
  description: string;
  context: string;
  location: string;
  startDate: string;
  endDate: string;
  estimatedCost: string;
  facultyAdvisor: string;
  teamRequirements: string;
  expectedOutcomes: string;
  deliverables: DeliverableField[];
  programRequirements: ProgramRequirementField[];
  requiresLegalization: boolean;
  isPrivate: boolean;
};

/**
 * Identificador estable para cada fila de entregables, de modo que React (y
 * Sonar) no dependan del índice del arreglo como `key`.
 */
let deliverableIdSeed = 0;

function createDeliverableField(value: string): DeliverableField {
  deliverableIdSeed += 1;
  return { id: `deliverable-${deliverableIdSeed}`, value };
}

function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

/** Serializa el formulario ignorando los ids internos de los entregables. */
function serializeForm(form: FormState): string {
  return JSON.stringify({
    ...form,
    deliverables: form.deliverables.map((deliverable) => deliverable.value),
    programRequirements: form.programRequirements.map((requirement) => ({
      programId: requirement.programId,
      studentCount: requirement.studentCount,
    })),
  });
}

function createInitialForm(project: ProjectDetails): FormState {
  const deliverableValues = (project.deliverables ?? []).map(
    (deliverable) => deliverable.description,
  );

  return {
    name: project.name,
    source: project.source ?? "external_entity",
    description: project.description,
    context: project.context,
    location: project.location ?? "",
    startDate: toDateInput(project.startDate),
    endDate: toDateInput(project.endDate),
    estimatedCost: project.estimatedCost ?? "",
    facultyAdvisor: project.facultyAdvisor ?? "",
    teamRequirements: project.teamRequirements ?? "",
    expectedOutcomes: project.expectedOutcomes ?? "",
    programRequirements: (project.programRequirements ?? []).map((requirement) => ({
      id: `program-${requirement.id}`,
      programId: requirement.programId,
      programName: requirement.programName,
      schoolName: requirement.schoolName ?? "Escuela no disponible",
      studentCount: String(requirement.studentCount),
    })),
    deliverables: (deliverableValues.length > 0
      ? deliverableValues
      : [""]
    ).map((value) => createDeliverableField(value)),
    requiresLegalization: Boolean(project.requiresLegalization),
    isPrivate: Boolean(project.isPrivate),
  };
}

type ProjectGeneralEditFormProps = {
  readonly project: ProjectDetails;
  readonly onSaved: (project: ProjectDetails) => void;
  readonly onCancel: () => void;
};

export default function ProjectGeneralEditForm({
  project,
  onSaved,
  onCancel,
}: ProjectGeneralEditFormProps) {
  const router = useRouter();
  const initialForm = useMemo(() => createInitialForm(project), [project]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [programSchools, setProgramSchools] = useState<ProjectProgramSchool[]>([]);
  const [programCatalogLoading, setProgramCatalogLoading] = useState(true);
  const [programCatalogError, setProgramCatalogError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProgramCatalog() {
      const result = await getProjectProgramsCatalog();
      if (!active) return;

      setProgramSchools(result.schools);
      setProgramCatalogError(result.error ?? null);
      setProgramCatalogLoading(false);
    }

    void loadProgramCatalog();

    return () => {
      active = false;
    };
  }, []);

  const isPrivateChanged = form.isPrivate !== Boolean(project.isPrivate);
  const isPublishing = Boolean(project.isPrivate) && !form.isPrivate;
  const isDirty = serializeForm(form) !== serializeForm(initialForm);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleDeliverableChange(index: number, value: string) {
    setForm((previous) => {
      const deliverables = [...previous.deliverables];
      deliverables[index] = { ...deliverables[index], value };
      return { ...previous, deliverables };
    });
  }

  function addDeliverable() {
    setForm((previous) => ({
      ...previous,
      deliverables: [...previous.deliverables, createDeliverableField("")],
    }));
  }

  function removeDeliverable(index: number) {
    setForm((previous) => ({
      ...previous,
      deliverables: previous.deliverables.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  function addProgramRequirement() {
    setForm((previous) => ({
      ...previous,
      programRequirements: [
        ...previous.programRequirements,
        {
          id: `program-new-${Date.now()}-${previous.programRequirements.length}`,
          programId: "",
          programName: "",
          schoolName: "",
          studentCount: "1",
        },
      ],
    }));
  }

  function updateProgramRequirement(
    id: string,
    changes: Partial<ProgramRequirementField>,
  ) {
    setForm((previous) => ({
      ...previous,
      programRequirements: previous.programRequirements.map((requirement) =>
        requirement.id === id ? { ...requirement, ...changes } : requirement,
      ),
    }));
  }

  function removeProgramRequirement(id: string) {
    setForm((previous) => ({
      ...previous,
      programRequirements: previous.programRequirements.filter(
        (requirement) => requirement.id !== id,
      ),
    }));
  }

  async function save() {
    setErrorMessage(null);

    const name = form.name.trim();
    const description = form.description.trim();
    const context = form.context.trim();

    if (!name || !description || !context) {
      setErrorMessage("Nombre, descripción y contexto son obligatorios.");
      return;
    }

    const rawCost = form.estimatedCost.trim();
    const estimatedCost = rawCost === "" ? null : Number(rawCost);

    if (
      estimatedCost !== null &&
      (!Number.isFinite(estimatedCost) || estimatedCost < 0)
    ) {
      setErrorMessage("El costo estimado debe ser un número positivo.");
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setErrorMessage(
        "La fecha de finalización no puede ser anterior a la fecha de inicio.",
      );
      return;
    }

    if (form.programRequirements.length > 4) {
      setErrorMessage("Puedes seleccionar un máximo de cuatro programas académicos.");
      return;
    }

    const selectedProgramIds = form.programRequirements.map(
      (requirement) => requirement.programId,
    );
    if (
      selectedProgramIds.some((programId) => !programId) ||
      new Set(selectedProgramIds).size !== selectedProgramIds.length
    ) {
      setErrorMessage("Selecciona programas válidos y evita repetirlos.");
      return;
    }

    if (
      form.programRequirements.some((requirement) => {
        const count = Number(requirement.studentCount);
        return (
          requirement.studentCount.trim() === "" ||
          !Number.isInteger(count) ||
          count < 1
        );
      })
    ) {
      setErrorMessage("La cantidad de estudiantes debe ser un entero mayor que cero para cada programa.");
      return;
    }

    const currentProgramRequirements = (project.programRequirements ?? []).map(
      (requirement) => ({
        programId: requirement.programId,
        studentCount: requirement.studentCount,
      }),
    );
    const nextProgramRequirements = form.programRequirements.map(
      (requirement) => ({
        programId: requirement.programId,
        studentCount: Number(requirement.studentCount),
      }),
    );
    const programRequirementsChanged =
      JSON.stringify(currentProgramRequirements) !==
      JSON.stringify(nextProgramRequirements);

    const payload: UpdateProjectPayload = {
      name,
      description,
      context,
      location: form.location.trim() || null,
      source: form.source,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      estimatedCost,
      requiresLegalization: form.requiresLegalization,
      isPrivate: form.isPrivate,
      facultyAdvisor: form.facultyAdvisor.trim() || null,
      teamRequirements: form.teamRequirements.trim() || null,
      expectedOutcomes: form.expectedOutcomes.trim() || null,
      deliverables: form.deliverables
        .map((deliverable) => deliverable.value.trim())
        .filter(Boolean),
      ...(programRequirementsChanged
        ? { programRequirements: nextProgramRequirements }
        : {}),
    };

    setSaving(true);

    try {
      const updated = await updateProject(String(project.id), payload);
      onSaved(updated);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el proyecto.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPublishing) {
      setConfirmOpen(true);
      return;
    }

    void save();
  }

  const isSubmitDisabled = saving || !isDirty;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Proyecto</FieldLegend>

            <Field>
              <FieldLabel htmlFor="edit-name">Nombre del proyecto</FieldLabel>
              <Input
                id="edit-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-source">Fuente del proyecto</FieldLabel>
              <Select
                value={form.source}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    source: value as ProjectSource,
                  }))
                }
                disabled={saving}
              >
                <SelectTrigger id="edit-source" className="w-full">
                  <SelectValue>
                    {projectSources.find(
                      (option) => option.value === form.source,
                    )?.label ?? "Selecciona una fuente"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projectSources.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-description">Descripción</FieldLabel>
              <Textarea
                id="edit-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-context">Justificación</FieldLabel>
              <Textarea
                id="edit-context"
                name="context"
                value={form.context}
                onChange={handleChange}
                rows={4}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-location">Ubicación</FieldLabel>
              <Input
                id="edit-location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Ciudad o sede, si aplica"
              />
            </Field>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Programas académicos</FieldLegend>
            <FieldDescription>
              Puedes asociar hasta cuatro programas al proyecto e indicar la cantidad de estudiantes requerida para cada uno.
            </FieldDescription>

            {programCatalogError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  No se pudo cargar el catálogo: {programCatalogError}. Los programas existentes se conservan; para agregar otros, vuelve a cargar la página cuando el servicio esté disponible.
                </AlertDescription>
              </Alert>
            ) : null}

            {programCatalogLoading ? (
              <p className="text-sm text-muted-foreground">
                Cargando catálogo de programas...
              </p>
            ) : null}

            <ProjectProgramRequirements
              items={form.programRequirements}
              schools={programSchools}
              idPrefix="edit"
              disabled={saving || programCatalogLoading || Boolean(programCatalogError)}
              onProgramChange={(id, program) =>
                updateProgramRequirement(id, {
                  programId: program.programId,
                  programName: program.programName,
                  schoolName: program.schoolName,
                })
              }
              onStudentCountChange={(id, value) =>
                updateProgramRequirement(id, {
                  studentCount: value,
                })
              }
              onRemove={removeProgramRequirement}
              onAdd={addProgramRequirement}
            />

            <FieldDescription>
              {form.programRequirements.length}/4 programas asociados. Si el proyecto todavía no tiene programas, puedes agregarlos sin afectar sus demás datos.
            </FieldDescription>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Fechas y costos</FieldLegend>

            <Field>
              <FieldLabel htmlFor="edit-start-date">
                Fecha de inicio
              </FieldLabel>
              <Input
                type="date"
                id="edit-start-date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-end-date">
                Fecha de finalización
              </FieldLabel>
              <Input
                type="date"
                id="edit-end-date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-cost">Costo estimado (COP)</FieldLabel>
              <Input
                type="number"
                id="edit-cost"
                name="estimatedCost"
                value={form.estimatedCost}
                onChange={handleChange}
                min={0}
                step="0.01"
              />
            </Field>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Requisitos y expectativas</FieldLegend>

            <Field>
              <FieldLabel htmlFor="edit-faculty-advisor">
                Asesor de la facultad
              </FieldLabel>
              <Input
                id="edit-faculty-advisor"
                name="facultyAdvisor"
                value={form.facultyAdvisor}
                onChange={handleChange}
                placeholder="Docente recomendado, si aplica"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-team-requirements">
                Conocimientos requeridos (opcional)
              </FieldLabel>
              <FieldDescription>
                Describe conocimientos, habilidades o perfiles deseados para orientar a los estudiantes interesados.
              </FieldDescription>
              <Textarea
                id="edit-team-requirements"
                name="teamRequirements"
                value={form.teamRequirements}
                onChange={handleChange}
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel>Entregables</FieldLabel>
              <div className="flex flex-col gap-2">
                {form.deliverables.map((deliverable, index) => (
                  <div key={deliverable.id} className="flex items-center gap-2">
                    <Input
                      value={deliverable.value}
                      onChange={(event) =>
                        handleDeliverableChange(index, event.target.value)
                      }
                      placeholder={`Entregable ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverable(index)}
                      aria-label="Eliminar entregable"
                      disabled={saving}
                    >
                      <RiDeleteBinLine />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={addDeliverable}
                  disabled={saving}
                >
                  <RiAddLine data-icon="inline-start" />
                  Agregar entregable
                </Button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-expected-outcomes">
                Expectativas al finalizar
              </FieldLabel>
              <Textarea
                id="edit-expected-outcomes"
                name="expectedOutcomes"
                value={form.expectedOutcomes}
                onChange={handleChange}
                rows={3}
              />
            </Field>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Legalización y visibilidad</FieldLegend>

            <Field orientation="horizontal">
              <Checkbox
                id="edit-requires-legalization"
                checked={form.requiresLegalization}
                onCheckedChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    requiresLegalization: checked === true,
                  }))
                }
                disabled={saving}
              />
              <FieldContent>
                <FieldLabel
                  htmlFor="edit-requires-legalization"
                  className="font-normal"
                >
                  Requiere proceso de legalización
                </FieldLabel>
                <FieldDescription>
                  Marca esta opción si el proyecto necesita contratos de
                  confidencialidad, convenios u otros trámites legales con el
                  proponente.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="edit-is-private"
                checked={form.isPrivate}
                onCheckedChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    isPrivate: checked === true,
                  }))
                }
                disabled={saving}
              />
              <FieldContent>
                <FieldLabel htmlFor="edit-is-private" className="font-normal">
                  Proyecto privado
                </FieldLabel>
                <FieldDescription>
                  Si está marcado, solo el proponente, el equipo asignado y los
                  directivos podrán verlo, incluso después de finalizar.
                </FieldDescription>
              </FieldContent>
            </Field>

            {isPrivateChanged ? (
              <Alert>
                <AlertDescription>
                  {isPublishing
                    ? "Vas a hacer público este proyecto: desde que sea aprobado, cualquier usuario con sesión podrá verlo; sin sesión, solo cuando esté finalizado. Un proyecto rechazado nunca se publica."
                    : "Vas a hacer privado este proyecto: solo el proponente, los actores asignados y los directivos podrán verlo, incluso después de finalizar."}
                </AlertDescription>
              </Alert>
            ) : null}
          </FieldSet>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitDisabled}>
              {saving && <Spinner data-icon="inline-start" />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </FieldGroup>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              Al guardar, el proyecto dejará de ser privado. Desde que sea
              aprobado podrá verlo cualquier usuario con sesión; sin sesión,
              solo cuando esté finalizado. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void save();
              }}
            >
              Sí, publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
