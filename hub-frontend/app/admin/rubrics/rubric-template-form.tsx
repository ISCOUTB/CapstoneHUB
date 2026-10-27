"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import PageFrame from "../../components/page-frame";
import { createClientId } from "@/lib/ids";
import {
  createRubricTemplate,
  getRubricTemplate,
  RubricTemplatePayload,
  updateRubricTemplate,
} from "../../services/rubrics";
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type CriterionRow = {
  key: string;
  title: string;
  description: string;
  weightPercent: string;
};

function emptyCriterion(): CriterionRow {
  return {
    key: createClientId(),
    title: "",
    description: "",
    weightPercent: "",
  };
}

type RubricTemplateFormProps = {
  templateId?: number;
};

export default function RubricTemplateForm({
  templateId,
}: RubricTemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<CriterionRow[]>([emptyCriterion()]);
  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!templateId) {
      return;
    }

    let active = true;

    void getRubricTemplate(templateId)
      .then((template) => {
        if (!active) {
          return;
        }

        setName(template.name);
        setArea(template.area ?? "");
        setDescription(template.description ?? "");
        setCriteria(
          template.criteria.map((criterion) => ({
            key: createClientId(),
            title: criterion.title,
            description: criterion.description ?? "",
            weightPercent: String(criterion.weightPercent),
          })),
        );
        setIsDefault(template.isDefault);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar la rúbrica.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [templateId]);

  const total = criteria.reduce(
    (sum, criterion) => sum + (Number(criterion.weightPercent) || 0),
    0,
  );
  const canSave =
    name.trim().length > 0 &&
    criteria.length > 0 &&
    criteria.every(
      (criterion) =>
        criterion.title.trim().length > 0 &&
        Number(criterion.weightPercent) > 0,
    ) &&
    total === 100 &&
    !saving;

  function updateCriterion(
    key: string,
    field: keyof Omit<CriterionRow, "key">,
    value: string,
  ) {
    setCriteria((current) =>
      current.map((criterion) =>
        criterion.key === key ? { ...criterion, [field]: value } : criterion,
      ),
    );
  }

  function removeCriterion(key: string) {
    setCriteria((current) =>
      current.length > 1
        ? current.filter((criterion) => criterion.key !== key)
        : current,
    );
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (total !== 100) {
      setError("Los porcentajes de los criterios deben sumar exactamente 100%.");
      return;
    }

    const payload: RubricTemplatePayload = {
      name: name.trim(),
      area: area.trim() || undefined,
      description: description.trim() || undefined,
      criteria: criteria.map((criterion) => ({
        title: criterion.title.trim(),
        description: criterion.description.trim() || undefined,
        weightPercent: Number(criterion.weightPercent),
      })),
    };

    try {
      setSaving(true);

      if (templateId) {
        await updateRubricTemplate(templateId, payload);
      } else {
        await createRubricTemplate(payload);
      }

      router.push("/admin/rubrics");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la rúbrica.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <PageFrame
      eyebrow="Administración"
      title={templateId ? "Editar rúbrica" : "Nueva rúbrica"}
      accentColor="rgba(129,140,248,0.38)"
      maxWidth="max-w-4xl"
    >
      {isDefault ? (
          <Alert>
            <AlertDescription>
              La rúbrica general es del sistema y no se puede editar. Crea una
              nueva plantilla si necesitas criterios adicionales.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Datos de la plantilla</CardTitle>
              <CardDescription>
                Los porcentajes de todos los criterios deben sumar 100%.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="rubric-name">Nombre</FieldLabel>
                      <Input
                        id="rubric-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Rúbrica de Ingeniería"
                        maxLength={255}
                        disabled={saving}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="rubric-area">Área</FieldLabel>
                      <Input
                        id="rubric-area"
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                        placeholder="Ingeniería, Arquitectura…"
                        maxLength={120}
                        disabled={saving}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="rubric-description">
                      Descripción
                    </FieldLabel>
                    <Textarea
                      id="rubric-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe cuándo usar esta rúbrica..."
                      rows={3}
                      disabled={saving}
                    />
                  </Field>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Criterios</p>
                      <FieldDescription>
                        Agrega los puntos que se evaluarán en el proyecto.
                      </FieldDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCriteria((current) => [
                          ...current,
                          emptyCriterion(),
                        ])
                      }
                      disabled={saving || criteria.length >= 30}
                    >
                      <RiAddLine data-icon="inline-start" />
                      Agregar criterio
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {criteria.map((criterion, index) => (
                      <Card key={criterion.key} className="shadow-none">
                        <CardContent className="pt-6">
                          <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                            <Field>
                              <FieldLabel
                                htmlFor={`criterion-title-${criterion.key}`}
                              >
                                Criterio {index + 1}
                              </FieldLabel>
                              <Input
                                id={`criterion-title-${criterion.key}`}
                                value={criterion.title}
                                onChange={(event) =>
                                  updateCriterion(
                                    criterion.key,
                                    "title",
                                    event.target.value,
                                  )
                                }
                                placeholder="Nombre del criterio"
                                maxLength={255}
                                disabled={saving}
                                required
                              />
                            </Field>

                            <Field>
                              <FieldLabel
                                htmlFor={`criterion-weight-${criterion.key}`}
                              >
                                Porcentaje
                              </FieldLabel>
                              <Input
                                id={`criterion-weight-${criterion.key}`}
                                type="number"
                                min={1}
                                max={100}
                                step={1}
                                value={criterion.weightPercent}
                                onChange={(event) =>
                                  updateCriterion(
                                    criterion.key,
                                    "weightPercent",
                                    event.target.value,
                                  )
                                }
                                disabled={saving}
                                required
                              />
                            </Field>
                          </div>

                          <Field className="mt-3">
                            <FieldLabel
                              htmlFor={`criterion-description-${criterion.key}`}
                            >
                              Descripción del criterio
                            </FieldLabel>
                            <Textarea
                              id={`criterion-description-${criterion.key}`}
                              value={criterion.description}
                              onChange={(event) =>
                                updateCriterion(
                                  criterion.key,
                                  "description",
                                  event.target.value,
                                )
                              }
                              placeholder="Qué se espera de este criterio (opcional)"
                              rows={2}
                              disabled={saving}
                            />
                          </Field>

                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCriterion(criterion.key)}
                              disabled={saving || criteria.length === 1}
                            >
                              <RiDeleteBinLine data-icon="inline-start" />
                              Quitar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      Suma de porcentajes
                    </span>
                    <span
                      className={
                        total === 100
                          ? "text-sm font-semibold text-success"
                          : "text-sm font-semibold text-destructive"
                      }
                    >
                      {total}% / 100%
                    </span>
                  </div>

                  {error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={!canSave}>
                      {saving ? <Spinner data-icon="inline-start" /> : null}
                      {saving ? "Guardando..." : "Guardar rúbrica"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/admin/rubrics")}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
