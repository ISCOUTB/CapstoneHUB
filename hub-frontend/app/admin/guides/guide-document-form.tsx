"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageFrame from "../../components/page-frame";
import FormActions from "../../components/form-actions";
import {
  createGuideDocument,
  deleteGuideDocumentFile,
  formatGuideFileSize,
  getAdminGuideDocument,
  GUIDE_CATEGORY_LABELS,
  GUIDE_CATEGORY_ORDER,
  GUIDE_FILE_ACCEPT,
  MAX_GUIDE_FILE_SIZE_BYTES,
  updateGuideDocument,
  uploadGuideDocumentFile,
  type GuideCategory,
  type GuideDocumentItem,
  type GuideDocumentPayload,
} from "../../services/guides";
import {
  USER_ROLES,
  type UserRole,
} from "../../services/roles";
import { formatRole } from "../../services/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type GuideDocumentFormProps = {
  documentId?: number;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type GuideFormValidation = {
  title: string;
  allRoles: boolean;
  audiences: UserRole[];
  externalUrl: string;
  selectedFile: File | null;
};

type GuidePersistResult = {
  error?: string;
  redirectTo?: string;
};

function validationMessage(values: GuideFormValidation): string | null {
  if (!values.title) {
    return "El título es obligatorio.";
  }

  if (!values.allRoles && values.audiences.length === 0) {
    return "Selecciona al menos un rol o marca «Todos los roles».";
  }

  if (values.selectedFile && values.externalUrl) {
    return "Un documento solo puede tener un archivo o un enlace externo, no ambos.";
  }

  if (values.externalUrl && !isHttpUrl(values.externalUrl)) {
    return "El enlace externo debe comenzar con http:// o https://.";
  }

  if (
    values.selectedFile &&
    values.selectedFile.size > MAX_GUIDE_FILE_SIZE_BYTES
  ) {
    return "El archivo supera el máximo de 25 MB.";
  }

  return null;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function saveNewGuideDocument(
  payload: GuideDocumentPayload,
  selectedFile: File | null,
): Promise<GuidePersistResult> {
  let created: GuideDocumentItem;

  try {
    created = await createGuideDocument(payload);
  } catch (error) {
    return { error: errorMessage(error, "No se pudo crear el documento.") };
  }

  if (selectedFile) {
    try {
      await uploadGuideDocumentFile(created.id, selectedFile);
    } catch {
      return { redirectTo: `/admin/guides?uploadError=${created.id}` };
    }
  }

  return {};
}

async function saveExistingGuideDocument(
  documentId: number,
  payload: GuideDocumentPayload,
  selectedFile: File | null,
  removeFile: boolean,
): Promise<GuidePersistResult> {
  if (removeFile) {
    try {
      await deleteGuideDocumentFile(documentId);
    } catch {
      return { error: "No se pudo quitar el archivo. Vuelve a intentarlo." };
    }
  }

  let updated: GuideDocumentItem;

  try {
    updated = await updateGuideDocument(documentId, payload);
  } catch (error) {
    return { error: errorMessage(error, "No se pudo guardar el documento.") };
  }

  if (selectedFile) {
    try {
      await uploadGuideDocumentFile(updated.id, selectedFile);
    } catch {
      return {
        error:
          "Los datos se guardaron, pero el archivo no se pudo subir. Vuelve a intentarlo.",
      };
    }
  }

  return {};
}

export default function GuideDocumentForm({
  documentId,
}: Readonly<GuideDocumentFormProps>) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GuideCategory>("format");
  const [allRoles, setAllRoles] = useState(true);
  const [audiences, setAudiences] = useState<UserRole[]>([...USER_ROLES]);
  const [externalUrl, setExternalUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [existingDocument, setExistingDocument] =
    useState<GuideDocumentItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(Boolean(documentId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    let active = true;
    setLoading(true);

    void getAdminGuideDocument(documentId)
      .then((document) => {
        if (!active) {
          return;
        }

        setExistingDocument(document);
        setTitle(document.title);
        setDescription(document.description ?? "");
        setCategory(document.category);

        const appliesToAll = document.audiences.length === 0;
        setAllRoles(appliesToAll);
        setAudiences(
          appliesToAll ? [...USER_ROLES] : [...document.audiences],
        );
        setExternalUrl(document.externalUrl ?? "");
        setIsPublished(document.isPublished);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el documento.",
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
  }, [documentId]);

  function toggleAudience(role: UserRole) {
    setAudiences((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setFileInputKey((key) => key + 1);
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedExternalUrl = externalUrl.trim();
    const validationError = validationMessage({
      title: trimmedTitle,
      allRoles,
      audiences,
      externalUrl: trimmedExternalUrl,
      selectedFile,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: GuideDocumentPayload = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      category,
      audiences: allRoles ? [] : audiences,
      externalUrl: trimmedExternalUrl || undefined,
      isPublished,
    };

    setSaving(true);

    try {
      const result = documentId
        ? await saveExistingGuideDocument(
            documentId,
            payload,
            selectedFile,
            removeFile,
          )
        : await saveNewGuideDocument(payload, selectedFile);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      router.push("/admin/guides");
      router.refresh();
    } catch (saveError) {
      setError(
        errorMessage(saveError, "No se pudo guardar el documento."),
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

  const hasCurrentFile =
    Boolean(existingDocument?.hasFile) && !removeFile && !selectedFile;
  const sourceLockedByFile = Boolean(selectedFile) || hasCurrentFile;
  const sourceLockedByLink = Boolean(externalUrl.trim());
  const visibleAudiences = allRoles ? [...USER_ROLES] : audiences;

  return (
    <PageFrame
      eyebrow="Administración"
      title={documentId ? "Editar documento" : "Nuevo documento"}
      accentColor="rgba(129,140,248,0.38)"
      maxWidth="max-w-4xl"
    >
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del documento</CardTitle>
            <CardDescription>
              El título y la descripción son visibles en la página Guías.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="guide-title">Título</FieldLabel>
                <Input
                  id="guide-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Formato de propuesta de proyecto"
                  maxLength={255}
                  disabled={saving}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="guide-description">
                  Descripción
                </FieldLabel>
                <Textarea
                  id="guide-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe para qué sirve este documento y cuándo usarlo..."
                  rows={3}
                  maxLength={4000}
                  disabled={saving}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="guide-category">Categoría</FieldLabel>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    if (value === null) {
                      return;
                    }

                    setCategory(value as GuideCategory);
                  }}
                  disabled={saving}
                >
                  <SelectTrigger id="guide-category" className="w-full">
                    <SelectValue placeholder="Selecciona una categoría">
                      {GUIDE_CATEGORY_LABELS[category]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GUIDE_CATEGORY_ORDER.map((categoryKey) => (
                      <SelectItem key={categoryKey} value={categoryKey}>
                        {GUIDE_CATEGORY_LABELS[categoryKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <FieldSet>
                <FieldLegend variant="label">Dirigido a</FieldLegend>

                <Field orientation="horizontal">
                  <Checkbox
                    id="guide-all-roles"
                    checked={allRoles}
                    onCheckedChange={(checked) => {
                      const appliesToAll = checked === true;
                      setAllRoles(appliesToAll);

                      if (appliesToAll) {
                        setAudiences([...USER_ROLES]);
                      }
                    }}
                    disabled={saving}
                  />
                  <FieldContent>
                    <FieldLabel
                      htmlFor="guide-all-roles"
                      className="font-normal"
                    >
                      Todos los roles
                    </FieldLabel>
                    <FieldDescription>
                      El documento aparecerá en todas las pestañas de rol.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <FieldGroup className="gap-3">
                  {USER_ROLES.map((role) => (
                    <Field key={role} orientation="horizontal">
                      <Checkbox
                        id={`guide-audience-${role}`}
                        checked={visibleAudiences.includes(role)}
                        onCheckedChange={() => toggleAudience(role)}
                        disabled={saving || allRoles}
                      />
                      <FieldLabel
                        htmlFor={`guide-audience-${role}`}
                        className="font-normal"
                      >
                        {formatRole(role)}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend variant="label">Archivo o enlace</FieldLegend>

                {hasCurrentFile ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {existingDocument?.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Archivo actual
                        {formatGuideFileSize(
                          existingDocument?.sizeBytes ?? null,
                        )
                          ? ` · ${formatGuideFileSize(
                              existingDocument?.sizeBytes ?? null,
                            )}`
                          : ""}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRemoveFile(true);
                        clearSelectedFile();
                      }}
                      disabled={saving}
                    >
                      Quitar archivo
                    </Button>
                  </div>
                ) : null}

                {removeFile ? (
                  <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                    El archivo se quitará al guardar.{" "}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={() => setRemoveFile(false)}
                      disabled={saving}
                    >
                      Deshacer
                    </Button>
                  </p>
                ) : null}

                {selectedFile ? (
                  <p className="rounded-xl border border-dashed p-3 text-sm">
                    Archivo seleccionado:{" "}
                    <span className="font-medium">{selectedFile.name}</span>{" "}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={clearSelectedFile}
                      disabled={saving}
                    >
                      Quitar selección
                    </Button>
                  </p>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="guide-file">
                    Subir o reemplazar archivo
                  </FieldLabel>
                  <Input
                    key={fileInputKey}
                    id="guide-file"
                    type="file"
                    accept={GUIDE_FILE_ACCEPT}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;

                      if (file && file.size > MAX_GUIDE_FILE_SIZE_BYTES) {
                        setError("El archivo supera el máximo de 25 MB.");
                        clearSelectedFile();
                        return;
                      }

                      setSelectedFile(file);
                      setRemoveFile(false);
                      setError(null);
                    }}
                    disabled={saving || sourceLockedByLink}
                  />
                  <FieldDescription>
                    PDF, Word, Excel, PowerPoint o ZIP. Máximo 25 MB.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="guide-external-url">
                    Enlace externo
                  </FieldLabel>
                  <Input
                    id="guide-external-url"
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    placeholder="https://drive.google.com/..."
                    maxLength={2048}
                    disabled={saving || sourceLockedByFile}
                  />
                  <FieldDescription>
                    Úsalo si el recurso vive en Drive, SharePoint u otro sitio.
                    No se puede combinar con un archivo adjunto.
                  </FieldDescription>
                </Field>

                {!hasCurrentFile && !selectedFile && !externalUrl.trim() ? (
                  <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                    Sin archivo ni enlace, el documento se mostrará como
                    «Próximamente» en la página Guías.
                  </p>
                ) : null}
              </FieldSet>

              <Field orientation="horizontal">
                <Checkbox
                  id="guide-published"
                  checked={isPublished}
                  onCheckedChange={(checked) =>
                    setIsPublished(checked === true)
                  }
                  disabled={saving}
                />
                <FieldContent>
                  <FieldLabel
                    htmlFor="guide-published"
                    className="font-normal"
                  >
                    Publicado
                  </FieldLabel>
                  <FieldDescription>
                    Los borradores no aparecen en la página Guías, pero siguen
                    disponibles en esta administración.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="mt-4">
          <FormActions
            loading={saving}
            loadingText="Guardando..."
            submitText={
              documentId ? "Guardar cambios" : "Crear documento"
            }
            onCancel={() => router.push("/admin/guides")}
          />
        </div>
      </form>
    </PageFrame>
  );
}
