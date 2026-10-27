"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiAddLine, RiEditLine, RiInboxArchiveLine } from "@remixicon/react";
import PageFrame from "../../components/page-frame";
import {
  archiveRubricTemplate,
  getRubricTemplates,
  RubricTemplateItem,
} from "../../services/rubrics";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RubricsPage() {
  const [templates, setTemplates] = useState<RubricTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] =
    useState<RubricTemplateItem | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError(null);
      setTemplates(await getRubricTemplates());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las rúbricas.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    if (!archiveTarget) {
      return;
    }

    try {
      setArchiving(true);
      setError(null);
      await archiveRubricTemplate(archiveTarget.id);
      setArchiveTarget(null);
      await loadTemplates();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "No se pudo archivar la rúbrica.",
      );
    } finally {
      setArchiving(false);
    }
  }

  return (
    <PageFrame
      eyebrow="Administración"
      title="Rúbricas"
      accentColor="rgba(129,140,248,0.38)"
      maxWidth="max-w-6xl"
    >
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Plantillas de rúbricas</CardTitle>
            <CardDescription>
              Las rúbricas se asignan a cada proyecto y semestre desde la
              pestaña Evaluación.
            </CardDescription>
            <CardAction>
              <Button
                nativeButton={false}
                render={
                  <Link href="/admin/rubrics/new">
                    <RiAddLine data-icon="inline-start" />
                    Nueva rúbrica
                  </Link>
                }
              />
            </CardAction>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Criterios</TableHead>
                    <TableHead>Peso total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay rúbricas creadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => {
                      const total = template.criteria.reduce(
                        (sum, criterion) => sum + criterion.weightPercent,
                        0,
                      );

                      return (
                        <TableRow
                          key={template.id}
                          className="transition-colors hover:bg-utb-blue/[0.04]"
                        >
                          <TableCell className="font-medium">
                            <span className="flex flex-wrap items-center gap-2">
                              {template.name}
                              {template.isDefault ? (
                                <Badge variant="secondary">Sistema</Badge>
                              ) : null}
                            </span>
                          </TableCell>
                          <TableCell>{template.area ?? "—"}</TableCell>
                          <TableCell>{template.criteria.length}</TableCell>
                          <TableCell>{total}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={template.isActive ? "outline" : "secondary"}
                            >
                              {template.isActive ? "Activa" : "Archivada"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {!template.isDefault ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    nativeButton={false}
                                    render={
                                      <Link
                                        href={`/admin/rubrics/${template.id}`}
                                      >
                                        <RiEditLine data-icon="inline-start" />
                                        Editar
                                      </Link>
                                    }
                                  />
                                  {template.isActive ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setArchiveTarget(template)}
                                    >
                                      <RiInboxArchiveLine data-icon="inline-start" />
                                      Archivar
                                    </Button>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Rúbrica general
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>

      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archivar rúbrica</AlertDialogTitle>
            <AlertDialogDescription>
              La rúbrica quedará inactiva y no podrá asignarse a nuevos
              proyectos. Las asignaciones existentes deben retirarse antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleArchive()}
              disabled={archiving}
            >
              {archiving ? "Archivando..." : "Archivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageFrame>
  );
}
