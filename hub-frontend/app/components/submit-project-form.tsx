"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";

import { createProject } from "../services/projects";
import { type ProjectSource } from "../services/schemas";
import { useAuth } from "./auth-provider";
import AccessNotice from "./access-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createClientId } from "@/lib/ids";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";

const MAX_NAME_LENGTH = 100;
const MAX_TEXT_LENGTH = 250;


const projectSources: ReadonlyArray<{
  value: ProjectSource;
  label: string;
}> = [
  { value: "external_entity", label: "Entidad externa" },
  { value: "research", label: "Investigación" },
  { value: "internal_need", label: "Necesidad interna" },
  { value: "social_impact", label: "Impacto social" },
];

const engineeringAreas = [
  { value: "systems", label: "Ingeniería de Sistemas y Computación" },
  { value: "industrial", label: "Ingeniería Industrial" },
  { value: "civil", label: "Ingeniería Civil" },
  { value: "electrical", label: "Ingeniería Eléctrica y Electrónica" },
  { value: "mechanical", label: "Ingeniería Mecánica" },
  { value: "environmental", label: "Ingeniería Ambiental" },
  { value: "other", label: "Otra área o ingeniería" },
] as const;

const steps = [
  {
    number: 1,
    title: "Proponente y origen",
    description: "Responsable y fuente",
  },
  {
    number: 2,
    title: "Información del proyecto",
    description: "Descripción y justificación",
  },
  {
    number: 3,
    title: "Equipo y condiciones",
    description: "Estudiantes y expectativas",
  },
] as const;

type DeliverableFormItem = {
  id: string;
  value: string;
};

type FormState = {
  name: string;
  source: ProjectSource;
  sourceDetails: string;
  externalAdvisorName: string;
  externalAdvisorEmail: string;
  externalNit: string;
  researchGroup: string;
  socialOrganization: string;
  socialNit: string;
  socialLocation: string;
  engineeringAreas: string[];
  projectScope: string;
  monetaryResources: string;
  monetaryResourcesDescription: string;
  facultyAdvisors: DeliverableFormItem[];
  namep: string;
  description: string;
  context: string;
  hasFacultyAdvisor: boolean;
  facultyAdvisor: string;
  teamRequirements: string;
  expectedOutcomes: string;
  deliverables: DeliverableFormItem[];
  requiresLegalization: boolean;
  isPrivate: boolean;
};

function createDeliverable(): DeliverableFormItem {
  return {
    id: createClientId(),
    value: "",
  };
}

const initialForm: FormState = {
  name: "",
  source: "external_entity",
  sourceDetails: "",
  externalAdvisorName: "",
  externalAdvisorEmail: "",
  externalNit: "",
  researchGroup: "",
  socialOrganization: "",
  socialNit: "",
  socialLocation: "",
  engineeringAreas: [""],
  projectScope: "",
  monetaryResources: "na",
  monetaryResourcesDescription: "",
  facultyAdvisors: [{ id: createClientId(), value: "" }],
  namep: "",
  description: "",
  context: "",
  hasFacultyAdvisor: false,
  facultyAdvisor: "",
  teamRequirements: "",
  expectedOutcomes: "",
  deliverables: [createDeliverable()],
  requiresLegalization: false,
  isPrivate: true,
};

type Status = "idle" | "saving" | "success" | "error";

type StepValidator = (form: FormState) => string | null;

function CharacterCounter({
  value,
  maxLength,
}: {
  readonly value: string;
  readonly maxLength: number;
}) {
  return (
    <p className="text-right text-xs text-muted-foreground">
      {value.length}/{maxLength}
    </p>
  );
}

function validateStepOne(form: FormState): string | null {
  if (!form.namep.trim()) {
    return "Ingresa el nombre del responsable.";
  }

  if (
    form.source === "external_entity" &&
    !form.sourceDetails.trim()
  ) {
    return "Describe la entidad externa de la que proviene el proyecto.";
  }

  if (!form.engineeringAreas.some((area) => area.trim())) {
    return "Selecciona al menos un área o ingeniería del proyecto.";
  }

  if (form.engineeringAreas.some((area, index) => area && form.engineeringAreas.indexOf(area) !== index)) {
    return "No puedes seleccionar la misma área o ingeniería más de una vez.";
  }

  if (
    form.source === "external_entity" &&
    (!form.externalAdvisorName.trim() ||
      !form.externalAdvisorEmail.trim() ||
      !form.externalNit.trim())
  ) {
    return "Ingresa el nombre, correo y NIT de la entidad o asesor externo.";
  }

  if (
    form.source === "external_entity" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.externalAdvisorEmail.trim())
  ) {
    return "Ingresa un correo válido para el asesor externo.";
  }

  if (form.source === "research" && !form.researchGroup.trim()) {
    return "Ingresa el grupo de investigación.";
  }

  if (
    form.source === "social_impact" &&
    !form.socialLocation.trim()
  ) {
    return "Ingresa la localización del proyecto.";
  }

  return null;
}

function validateStepTwo(form: FormState): string | null {
  if (!form.name.trim()) {
    return "Ingresa el nombre del proyecto.";
  }

  if (!form.description.trim()) {
    return "Ingresa la descripción del proyecto.";
  }

  if (!form.context.trim()) {
    return "Ingresa la justificación del proyecto.";
  }

  if (!form.projectScope.trim()) {
    return "Describe el alcance específico del proyecto.";
  }

  return null;
}

function validateStepThree(form: FormState): string | null {
  if (form.hasFacultyAdvisor && !form.facultyAdvisor.trim()) {
    return "Ingresa el nombre o contacto UTB del asesor.";
  }

  if (!form.teamRequirements.trim()) {
    return "Describe el tipo de estudiantes o perfiles requeridos.";
  }

  if (
    form.monetaryResources === "yes" &&
    !form.monetaryResourcesDescription.trim()
  ) {
    return "Describe los recursos monetarios disponibles.";
  }

  return null;
}

const stepValidators: Record<number, StepValidator> = {
  1: validateStepOne,
  2: validateStepTwo,
  3: validateStepThree,
};

export default function SubmitProjectForm() {
  const { session, isAuthenticated, ready } = useAuth();
  const router = useRouter();
  const userEmail = session?.user?.email ?? "";

  const [form, setForm] = useState<FormState>(initialForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const [showDurationNotice, setShowDurationNotice] = useState(true);
  const [submissionConsentAt, setSubmissionConsentAt] = useState<
    string | null
  >(null);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setStepError(null);
  }

  function handleSourceChange(value: string) {
    const source = value as ProjectSource;

    setForm((prev) => ({
      ...prev,
      source,
      sourceDetails:
        source === "external_entity" ? prev.sourceDetails : "",
    }));

    setStepError(null);
  }

  function handleFacultyAdvisorChange(id: string, value: string) {
    setForm((prev) => ({
      ...prev,
      facultyAdvisors: prev.facultyAdvisors.map((advisor) =>
        advisor.id === id ? { ...advisor, value } : advisor,
      ),
    }));

    setStepError(null);
  }

  function addFacultyAdvisor() {
    setForm((prev) => ({
      ...prev,
      facultyAdvisors: [
        ...prev.facultyAdvisors,
        { id: createClientId(), value: "" },
      ],
    }));
  }

  function removeFacultyAdvisor(id: string) {
    setForm((prev) => {
      const facultyAdvisors = prev.facultyAdvisors.filter(
        (advisor) => advisor.id !== id,
      );

      return {
        ...prev,
        facultyAdvisors:
          facultyAdvisors.length > 0
            ? facultyAdvisors
            : [{ id: createClientId(), value: "" }],
      };
    });
  }

  function handleAdvisorChange(value: boolean) {
    setForm((prev) => ({
      ...prev,
      hasFacultyAdvisor: value,
      facultyAdvisor: value ? prev.facultyAdvisor : "",
    }));

    setStepError(null);
  }

  function handleDeliverableChange(id: string, value: string) {
    setForm((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((deliverable) =>
        deliverable.id === id
          ? { ...deliverable, value }
          : deliverable,
      ),
    }));

    setStepError(null);
  }

  function addDeliverable() {
    setForm((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, createDeliverable()],
    }));
  }

  function removeDeliverable(id: string) {
    setForm((prev) => {
      const deliverables = prev.deliverables.filter(
        (deliverable) => deliverable.id !== id,
      );

      return {
        ...prev,
        deliverables:
          deliverables.length > 0 ? deliverables : [createDeliverable()],
      };
    });
  }

  function acceptDurationNotice() {
    const acceptedAt = new Date().toISOString();

    setSubmissionConsentAt(acceptedAt);
    setShowDurationNotice(false);
  }

  function validateCurrentStep(): boolean {
    setStepError(null);

    const validator = stepValidators[currentStep];
    const validationError = validator ? validator(form) : null;

    if (validationError) {
      setStepError(validationError);
      return false;
    }

    return true;
  }

  function goToNextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, steps.length));
  }

  function goToPreviousStep() {
    setStepError(null);
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function goToStep(step: number) {
    if (step < currentStep) {
      setStepError(null);
      setCurrentStep(step);
      return;
    }

    if (step === currentStep + 1 && validateCurrentStep()) {
      setCurrentStep(step);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submissionConsentAt) {
      setShowDurationNotice(true);
      return;
    }

    if (currentStep !== steps.length) {
      goToNextStep();
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    if (!userEmail.trim()) {
      setStatus("error");
      setErrorMessage(
        "No se pudo obtener el correo electrónico de la cuenta.",
      );
      return;
    }

    setStatus("saving");
    setErrorMessage(null);
    setStepError(null);

    try {
      await createProject({
        name: form.name.trim(),
        namep: form.namep.trim(),
        correo: userEmail.trim(),
        description: form.description.trim(),
        context: form.context.trim(),
        source: form.source,
        sourceDetails:
          form.source === "external_entity"
            ? form.sourceDetails.trim()
            : undefined,
        engineeringArea: form.engineeringAreas.filter(Boolean).join(","),
        externalAdvisorName:
          form.source === "external_entity" ? form.externalAdvisorName.trim() : undefined,
        externalAdvisorEmail:
          form.source === "external_entity" ? form.externalAdvisorEmail.trim() : undefined,
        externalNit:
          form.source === "external_entity" ? form.externalNit.trim() : undefined,
        researchGroup:
          form.source === "research" ? form.researchGroup.trim() : undefined,
        socialOrganization:
          form.source === "social_impact" ? form.socialOrganization.trim() : undefined,
        socialNit:
          form.source === "social_impact" ? form.socialNit.trim() : undefined,
        socialLocation:
          form.source === "social_impact" ? form.socialLocation.trim() : undefined,
        projectScope: form.projectScope.trim(),
        monetaryResources: form.monetaryResources,
        monetaryResourcesDescription:
          form.monetaryResources === "yes"
            ? form.monetaryResourcesDescription.trim()
            : undefined,
        facultyAdvisors: form.facultyAdvisors
          .map((advisor) => advisor.value.trim())
          .filter(Boolean),
        requiresLegalization: form.requiresLegalization,
        isPrivate: form.isPrivate,
        facultyAdvisor: form.hasFacultyAdvisor
          ? form.facultyAdvisor.trim()
          : undefined,
        teamRequirements: form.teamRequirements.trim(),
        expectedOutcomes: form.expectedOutcomes.trim() || undefined,
        deliverables: form.deliverables
          .map((deliverable) => deliverable.value.trim())
          .filter(Boolean),
        submissionConsentAt,
      });

      setStatus("success");
      router.push("/projects?propuestos=1");
      setForm(initialForm);
      setCurrentStep(1);
      setSubmissionConsentAt(null);
      setShowDurationNotice(true);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo crear el proyecto.",
      );
    }
  }

  if (!ready) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cargando acceso...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <AccessNotice
        title="Acceso requerido"
        message="Inicia sesión para proponer nuevos proyectos."
      />
    );
  }

  return (
    <>
      <Dialog
        open={showDurationNotice}
        onOpenChange={(open) => {
          if (!open && !submissionConsentAt) {
            setShowDurationNotice(true);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>
              Información importante sobre la duración
            </DialogTitle>

            <DialogDescription>
              Antes de comenzar debes conocer y aceptar la duración
              establecida para este tipo de proyectos.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm leading-6">
              Los proyectos propuestos mediante esta plataforma se
              ejecutan durante{" "}
              <strong>
                8 meses aproximadamente
              </strong>
              .
            </p>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Al seleccionar &quot;Aceptar y continuar&quot;, dejas
              constancia de que conoces y aceptas esta condición antes
              de registrar la propuesta.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={acceptDurationNotice}>
              Aceptar y continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <div className="mb-6">
            <div className="grid gap-2 md:grid-cols-3">
              {steps.map((step) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const stepClassName = isActive
                  ? "border-primary bg-primary/10"
                  : isCompleted
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/30";

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => goToStep(step.number)}
                    disabled={step.number > currentStep + 1}
                    className={`rounded-lg border p-3 text-left transition-colors ${stepClassName} disabled:cursor-default disabled:opacity-70`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isActive || isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.number}
                      </span>

                      <span className="font-medium">
                        {step.title}
                      </span>
                    </div>

                    <p className="mt-1 pl-9 text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${(currentStep / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* PASO 1 */}
          {currentStep === 1 && (
            <FieldSet>
              <FieldLegend>
                Información del proponente y origen
              </FieldLegend>

              <Field>
                <FieldLabel htmlFor="namep">
                  Nombre del responsable
                </FieldLabel>

                <Input
                  id="namep"
                  name="namep"
                  value={form.namep}
                  onChange={handleChange}
                  maxLength={MAX_NAME_LENGTH}
                  required
                />

                <CharacterCounter
                  value={form.namep}
                  maxLength={MAX_NAME_LENGTH}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="correo">
                  Correo electrónico
                </FieldLabel>

                <Input
                  type="email"
                  id="correo"
                  value={userEmail}
                  readOnly
                  aria-readonly="true"
                  maxLength={MAX_TEXT_LENGTH}
                />

                <FieldDescription>
                  Este correo se obtiene automáticamente de la cuenta con la que
                  iniciaste sesión.
                </FieldDescription>

                <CharacterCounter
                  value={userEmail}
                  maxLength={MAX_TEXT_LENGTH}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="source">
                  Fuente del proyecto
                </FieldLabel>

                <Select
                  value={form.source}
                  onValueChange={(value) => {
                    if (value !== null) {
                      handleSourceChange(value);
                    }
                  }}
                >
                  <SelectTrigger id="source" className="w-full">
                    <SelectValue>
                      {projectSources.find(
                        (option) => option.value === form.source,
                      )?.label ?? "Selecciona una fuente"}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {projectSources.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        <span>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                                <div className="flex flex-wrap gap-2">
                  {projectSources.map((option) => (
                    <Popover key={option.value}>
                      <PopoverTrigger
                        render={<button type="button" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" />}
                      >
                        ¿Qué es {option.label.toLowerCase()}?
                      </PopoverTrigger>

                      <PopoverContent
                        side="bottom"
                        align="start"
                        className="w-64"
                      >
                        <PopoverDescription>
                          {{
                            external_entity: "Propuesta presentada por una empresa u organización externa a la UTB.",
                            research: "Propuesta vinculada a un grupo o proyecto de investigación.",
                            internal_need: "Propuesta que responde a una necesidad de una dependencia o área interna de la UTB.",
                            social_impact: "Propuesta orientada a resolver una necesidad de una comunidad u organización social.",
                          }[option.value]}
                        </PopoverDescription>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>

              </Field>
              <Field>
                <FieldLabel>
                  Área o ingeniería del proyecto
                </FieldLabel>

                {form.engineeringAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={area}
                      onValueChange={(value) => {
                        if (value !== null) {
                          setForm((prev) => ({
                            ...prev,
                            engineeringAreas: prev.engineeringAreas.map((currentArea, currentIndex) =>
                              currentIndex === index ? value : currentArea,
                            ),
                          }));
                          setStepError(null);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un área o ingeniería">
                        {engineeringAreas.find((engineering) => engineering.value === area)?.label}
                      </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        {engineeringAreas.map((area) => (
                          <SelectItem
                            key={area.value}
                            value={area.value}
                          >
                            {area.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {form.engineeringAreas.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            engineeringAreas: prev.engineeringAreas.filter((_, currentIndex) => currentIndex !== index),
                          }));
                        }}
                        aria-label="Eliminar área"
                      >
                        <RiDeleteBinLine />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      engineeringAreas: [...prev.engineeringAreas, ""],
                    }));
                  }}
                >
                  <RiAddLine />
                  Agregar otra área
                </Button>

                <FieldDescription>
                  Selecciona todas las áreas relacionadas con la propuesta. Cada área puede definir hitos mínimos adicionales.
                </FieldDescription>
              </Field>

              {form.source === "external_entity" && (
                <Field>
                  <FieldLabel htmlFor="sourceDetails">
                    ¿De qué entidad externa proviene?
                  </FieldLabel>

                  <Textarea
                    id="sourceDetails"
                    name="sourceDetails"
                    value={form.sourceDetails}
                    onChange={handleChange}
                    maxLength={MAX_TEXT_LENGTH}
                    rows={3}
                    placeholder="Indica el nombre de la empresa, organización o entidad y una breve descripción."
                    required
                  />

                  <CharacterCounter
                    value={form.sourceDetails}
                    maxLength={MAX_TEXT_LENGTH}
                  />
                </Field>
              )}

              {form.source === "external_entity" && (
                <>
                  <Field>
                    <FieldLabel htmlFor="externalNit">NIT de la empresa o entidad</FieldLabel>
                    <Input
                      id="externalNit"
                      name="externalNit"
                      value={form.externalNit}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="NIT de la entidad externa"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="externalAdvisorName">Nombre del asesor externo</FieldLabel>
                    <Input
                      id="externalAdvisorName"
                      name="externalAdvisorName"
                      value={form.externalAdvisorName}
                      onChange={handleChange}
                      maxLength={MAX_NAME_LENGTH}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="externalAdvisorEmail">Correo del asesor externo</FieldLabel>
                    <Input
                      type="email"
                      id="externalAdvisorEmail"
                      name="externalAdvisorEmail"
                      value={form.externalAdvisorEmail}
                      onChange={handleChange}
                      maxLength={MAX_TEXT_LENGTH}
                      placeholder="asesor@empresa.com"
                      required
                    />
                  </Field>
                </>
              )}

              {form.source === "research" && (
                <Field>
                  <FieldLabel htmlFor="researchGroup">Grupo de investigación</FieldLabel>
                  <Input
                    id="researchGroup"
                    name="researchGroup"
                    value={form.researchGroup}
                    onChange={handleChange}
                    maxLength={MAX_TEXT_LENGTH}
                    placeholder="Nombre del grupo de investigación"
                    required
                  />
                </Field>
              )}

              {form.source === "social_impact" && (
                <>
                  <Field>
                    <FieldLabel htmlFor="socialOrganization">Junta de Acción Comunal</FieldLabel>
                    <Input
                      id="socialOrganization"
                      name="socialOrganization"
                      value={form.socialOrganization}
                      onChange={handleChange}
                      maxLength={MAX_TEXT_LENGTH}
                      placeholder="Nombre de la Junta de Acción Comunal"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="socialNit">NIT de la organización</FieldLabel>
                    <Input
                      id="socialNit"
                      name="socialNit"
                      value={form.socialNit}
                      onChange={handleChange}
                      maxLength={MAX_TEXT_LENGTH}
                      placeholder="NIT de la Junta de Acción Comunal"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="socialLocation">Localización</FieldLabel>
                    <Input
                      id="socialLocation"
                      name="socialLocation"
                      value={form.socialLocation}
                      onChange={handleChange}
                      maxLength={MAX_TEXT_LENGTH}
                      placeholder="Barrio, municipio o dirección de referencia"
                      required
                    />
                  </Field>
                </>
              )}
            </FieldSet>
          )}

          {/* PASO 2 */}
          {currentStep === 2 && (
            <FieldSet>
              <FieldLegend>
                Descripción y propósito del proyecto
              </FieldLegend>

              <Field>
                <FieldLabel htmlFor="name">
                  Nombre del proyecto
                </FieldLabel>

                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={MAX_NAME_LENGTH}
                  required
                />

                <CharacterCounter
                  value={form.name}
                  maxLength={MAX_NAME_LENGTH}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">
                  ¿Qué se propone realizar?
                </FieldLabel>

                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={MAX_TEXT_LENGTH}
                  rows={4}
                  placeholder="Describe de forma concreta qué se desarrollará en el proyecto."
                  required
                />

                <CharacterCounter
                  value={form.description}
                  maxLength={MAX_TEXT_LENGTH}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="context">
                  Problema y justificación
                </FieldLabel>

                <Textarea
                  id="context"
                  name="context"
                  value={form.context}
                  onChange={handleChange}
                  maxLength={MAX_TEXT_LENGTH}
                  rows={4}
                  placeholder="Explica qué problema se busca solucionar y por qué el proyecto es necesario."
                  required
                />

                <CharacterCounter
                  value={form.context}
                  maxLength={MAX_TEXT_LENGTH}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="projectScope">Alcance específico del proyecto</FieldLabel>
                <Textarea
                  id="projectScope"
                  name="projectScope"
                  value={form.projectScope}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Delimita qué se necesita desarrollar, qué incluye la propuesta y cuáles son sus límites."
                  required
                />
              </Field>

              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="font-medium">Duración estimada</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Los proyectos se ejecutan durante{" "}
                  <strong>
                    8 meses aproximadamente
                  </strong>
                  .
                </p>
              </div>
            </FieldSet>
          )}

          {/* PASO 3 */}
          {currentStep === 3 && (
            <FieldSet>
              <FieldLegend>
                Equipo, resultados y condiciones
              </FieldLegend>

              <Field>
                <FieldLabel>Profesores de contacto</FieldLabel>

                <FieldDescription>
                  Puedes agregar uno o varios profesores de contacto para la propuesta.
                </FieldDescription>

                <div className="flex flex-col gap-2">
                  {form.facultyAdvisors.map((advisor, index) => (
                    <div key={advisor.id} className="flex items-center gap-2">
                      <Input
                        value={advisor.value}
                        onChange={(event) =>
                          handleFacultyAdvisorChange(advisor.id, event.target.value)
                        }
                        maxLength={MAX_TEXT_LENGTH}
                        placeholder={`Profesor de contacto ${index + 1}`}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFacultyAdvisor(advisor.id)}
                        aria-label="Eliminar profesor de contacto"
                      >
                        <RiDeleteBinLine />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-fit"
                  onClick={addFacultyAdvisor}
                >
                  <RiAddLine data-icon="inline-start" />
                  Agregar profesor
                </Button>
              </Field>
              <Field>
                <FieldLabel htmlFor="teamRequirements">
                  Estudiantes requeridos
                </FieldLabel>

                <FieldDescription>
                  El proyecto requiere un mínimo de{" "}
                  <strong>3 estudiantes</strong>. Indica qué tipo de
                  estudiantes, carreras, conocimientos o perfiles se
                  necesitan.
                </FieldDescription>

                <Textarea
                  id="teamRequirements"
                  name="teamRequirements"
                  value={form.teamRequirements}
                  onChange={handleChange}
                  maxLength={MAX_TEXT_LENGTH}
                  rows={4}
                  placeholder="Ejemplo: mínimo 3 estudiantes de Ingeniería de Sistemas con conocimientos en desarrollo web."
                  required
                />

                <CharacterCounter
                  value={form.teamRequirements}
                  maxLength={MAX_TEXT_LENGTH}
                />
              </Field>

              <Field>
                <FieldLabel>Entregables esperados</FieldLabel>

                <FieldDescription>
                  Indica los productos, documentos, resultados o componentes que
                  deberán entregarse al finalizar el proyecto.
                </FieldDescription>

                <div className="flex flex-col gap-2">
                  {form.deliverables.map((deliverable, index) => (
                    <div
                      key={deliverable.id}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={deliverable.value}
                        onChange={(event) =>
                          handleDeliverableChange(
                            deliverable.id,
                            event.target.value,
                          )
                        }
                        maxLength={MAX_TEXT_LENGTH}
                        placeholder={`Entregable ${index + 1}`}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removeDeliverable(deliverable.id)
                        }
                        aria-label="Eliminar entregable"
                      >
                        <RiDeleteBinLine />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-fit"
                  onClick={addDeliverable}
                >
                  <RiAddLine data-icon="inline-start" />
                  Agregar entregable
                </Button>
              </Field>

              <Field>
                <FieldLabel htmlFor="expectedOutcomes">
                  Resultados esperados
                </FieldLabel>

                <Textarea
                  id="expectedOutcomes"
                  name="expectedOutcomes"
                  value={form.expectedOutcomes}
                  onChange={handleChange}
                  maxLength={MAX_TEXT_LENGTH}
                  rows={3}
                  placeholder="Describe qué se espera obtener al finalizar el proyecto."
                />

                <CharacterCounter
                  value={form.expectedOutcomes}
                  maxLength={MAX_TEXT_LENGTH}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="monetaryResources">
                  ¿Se tienen contemplados recursos monetarios disponibles?
                </FieldLabel>

                <Select
                  value={form.monetaryResources}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setForm((prev) => ({
                        ...prev,
                        monetaryResources: value,
                        monetaryResourcesDescription:
                          value === "yes" ? prev.monetaryResourcesDescription : "",
                      }));
                    }
                  }}
                >
                  <SelectTrigger id="monetaryResources" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="na">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {form.monetaryResources === "yes" && (
                <Field>
                  <FieldLabel htmlFor="monetaryResourcesDescription">
                    Descripción de los recursos monetarios
                  </FieldLabel>
                  <Textarea
                    id="monetaryResourcesDescription"
                    name="monetaryResourcesDescription"
                    value={form.monetaryResourcesDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe el tipo de recursos disponibles y para qué se utilizarán."
                    required
                  />
                </Field>
              )}

              <Field orientation="horizontal">
                <Checkbox
                  id="requiresLegalization"
                  checked={form.requiresLegalization}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      requiresLegalization: checked === true,
                    }))
                  }
                />

                <FieldContent>
                  <FieldLabel
                    htmlFor="requiresLegalization"
                    className="font-normal"
                  >
                    Requiere proceso de legalización
                  </FieldLabel>

                  <FieldDescription>
                    Marca esta opción si se requieren convenios,
                    contratos u otros trámites legales.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  id="isPrivate"
                  checked={form.isPrivate}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      isPrivate: checked === true,
                    }))
                  }
                />

                <FieldContent>
                  <FieldLabel
                    htmlFor="isPrivate"
                    className="font-normal"
                  >
                    Proyecto privado
                  </FieldLabel>

                  <FieldDescription>
                    Si está marcado, el proyecto permanecerá privado
                    según las reglas de visibilidad de la plataforma.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldSet>
          )}

          {stepError && (
            <Alert variant="destructive">
              <AlertDescription>{stepError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={
                currentStep === 1 || status === "saving"
              }
            >
              Anterior
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={goToNextStep}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={status === "saving"}
              >
                {status === "saving" && (
                  <Spinner data-icon="inline-start" />
                )}

                {status === "saving"
                  ? "Guardando..."
                  : "Proponer proyecto"}
              </Button>
            )}
          </div>

          {status === "success" && (
            <Alert>
              <AlertDescription>
                Proyecto creado correctamente.
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
    </>
  );
}