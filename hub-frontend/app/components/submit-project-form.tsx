"use client";

import Link from "next/link";
import { useState } from "react";
import { createProject } from "../services/projects";
import { type ProjectSource } from "../services/schemas";
import { useAuth } from "./auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";

const projectSources: ReadonlyArray<{
  value: ProjectSource;
  label: string;
}> = [
  { value: "external_entity", label: "Entidad externa" },
  { value: "research", label: "Investigación" },
  { value: "internal_need", label: "Necesidad interna" },
  { value: "social_impact", label: "Impacto social" },
];

type FormState = {
  name: string;
  source: ProjectSource;
  namep: string;
  correo: string;
  description: string;
  context: string;
  facultyAdvisor: string;
  teamRequirements: string;
  expectedOutcomes: string;
  deliverables: string[];
  requiresLegalization: boolean;
  isPrivate: boolean;
};

const initialForm: FormState = {
  name: "",
  source: "external_entity",
  namep: "",
  correo: "",
  description: "",
  context: "",
  facultyAdvisor: "",
  teamRequirements: "",
  expectedOutcomes: "",
  deliverables: [""],
  requiresLegalization: false,
  isPrivate: true,
};

export default function SubmitProjectForm() {
  const { isAuthenticated, ready } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleDeliverableChange(index: number, value: string) {
    setForm((prev) => {
      const deliverables = [...prev.deliverables];
      deliverables[index] = value;
      return { ...prev, deliverables };
    });
  }

  function addDeliverable() {
    setForm((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, ""],
    }));
  }

  function removeDeliverable(index: number) {
    setForm((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    try {
      await createProject({
        name: form.name,
        namep: form.namep,
        correo: form.correo,
        description: form.description,
        context: form.context,
        source: form.source,
        requiresLegalization: form.requiresLegalization,
        isPrivate: form.isPrivate,
        facultyAdvisor: form.facultyAdvisor.trim() || undefined,
        teamRequirements: form.teamRequirements.trim() || undefined,
        expectedOutcomes: form.expectedOutcomes.trim() || undefined,
        deliverables: form.deliverables
          .map((deliverable) => deliverable.trim())
          .filter(Boolean),
      });

      setStatus("success");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create project",
      );
    }
  }

  if (!ready) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando acceso...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso requerido</CardTitle>
          <CardDescription>
            Inicia sesión para proponer nuevos proyectos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            render={<Link href="/login">Iniciar sesión</Link>}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Proponente</FieldLegend>

          <Field>
            <FieldLabel htmlFor="namep">Nombre del responsable</FieldLabel>
            <Input
              id="namep"
              name="namep"
              value={form.namep}
              onChange={handleChange}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="correo">Correo electrónico</FieldLabel>
            <Input
              type="email"
              id="correo"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              required
            />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Proyecto</FieldLegend>

          <Field>
            <FieldLabel htmlFor="name">Nombre del proyecto</FieldLabel>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="source">Fuente del proyecto</FieldLabel>
            <Select
              value={form.source}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  source: value as ProjectSource,
                }))
              }
            >
              <SelectTrigger id="source" className="w-full">
                <SelectValue>
                  {projectSources.find((option) => option.value === form.source)
                    ?.label ?? "Selecciona una fuente"}
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
            <FieldDescription>
              Indica de dónde proviene el proyecto: entidad externa,
              investigación, necesidad interna o impacto social.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Descripción</FieldLabel>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="context">Justificación</FieldLabel>
            <Textarea
              id="context"
              name="context"
              value={form.context}
              onChange={handleChange}
              rows={4}
              required
            />
          </Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Requisitos y expectativas</FieldLegend>

          <Field>
            <FieldLabel htmlFor="facultyAdvisor">
              Asesor de la facultad
            </FieldLabel>
            <Input
              id="facultyAdvisor"
              name="facultyAdvisor"
              value={form.facultyAdvisor}
              onChange={handleChange}
              placeholder="Docente recomendado, si aplica"
            />
            <FieldDescription>
              Si deseas recomendar un docente para que acompañe el proyecto,
              indícalo aquí.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="teamRequirements">
              Equipo requerido
            </FieldLabel>
            <Textarea
              id="teamRequirements"
              name="teamRequirements"
              value={form.teamRequirements}
              onChange={handleChange}
              rows={3}
              placeholder="Tipo de estudiantes o perfiles que el proyecto necesita"
            />
          </Field>

          <Field>
            <FieldLabel>Entregables</FieldLabel>
            <div className="flex flex-col gap-2">
              {form.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={deliverable}
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
              >
                <RiAddLine data-icon="inline-start" />
                Agregar entregable
              </Button>
            </div>
            <FieldDescription>
              Lista los productos o resultados que dejará el proyecto.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="expectedOutcomes">
              Expectativas al finalizar
            </FieldLabel>
            <Textarea
              id="expectedOutcomes"
              name="expectedOutcomes"
              value={form.expectedOutcomes}
              onChange={handleChange}
              rows={3}
              placeholder="Qué se espera lograr al terminar el proyecto"
            />
          </Field>

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
                Marca esta opción si el proyecto necesita contratos de
                confidencialidad, convenios u otros trámites legales con el
                proponente.
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
              <FieldLabel htmlFor="isPrivate" className="font-normal">
                Proyecto privado
              </FieldLabel>
              <FieldDescription>
                Si está marcado, solo el proponente, el equipo asignado y los
                evaluadores podrán verlo, incluso después de finalizar. Si lo
                desmarcas, el proyecto se hará público cuando su estado sea
                &quot;Cerrado&quot;.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldSet>

        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" && <Spinner data-icon="inline-start" />}
          {status === "saving" ? "Saving..." : "Proponer"}
        </Button>

        {status === "success" && (
          <Alert>
            <AlertDescription>Project created.</AlertDescription>
          </Alert>
        )}

        {status === "error" && errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </FieldGroup>
    </form>
  );
}
