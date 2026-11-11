"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
} from "@remixicon/react";
import PageFrame from "../../components/page-frame";
import {
  deleteGuideDocument,
  formatGuideAudiences,
  formatGuideCategory,
  formatGuideFileSize,
  getAdminGuideDocuments,
  guideDownloadHref,
  type GuideDocumentItem,
} from "../../services/guides";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function sourceLabel(document: GuideDocumentItem): string {
  if (document.hasFile) {
    return document.originalName ?? "Archivo adjunto";
  }

  if (document.externalUrl) {
    return "Enlace externo";
  }

  return "Sin archivo";
}

function sourceDetail(document: GuideDocumentItem): string {
  if (document.hasFile) {
    const size = formatGuideFileSize(document.sizeBytes);
    return size ? `${sourceLabel(document)} · ${size}` : sourceLabel(document);
  }

  return sourceLabel(document);
}

type AdminGuidesContentProps = {
  loading: boolean;
  documents: GuideDocumentItem[];
  onDelete: (document: GuideDocumentItem) => void;
};

function AdminGuidesContent({
  loading,
  documents,
  onDelete,
}: Readonly<AdminGuidesContentProps>) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Empty className="rounded-2xl bg-muted/20">
        <EmptyHeader>
          <EmptyTitle>Todavía no hay documentos</EmptyTitle>
          <EmptyDescription>
            Crea el primer formato, plantilla o guía del catálogo. Puedes
            adjuntar un archivo o enlazar un recurso externo.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/guides/new">
              <RiAddLine data-icon="inline-start" />
              Crear documento
            </Link>
          }
        />
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Documento</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Dirigido a</TableHead>
            <TableHead>Archivo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {documents.map((document) => (
            <TableRow
              key={document.id}
              className="transition-colors hover:bg-utb-blue/[0.04]"
            >
              <TableCell className="max-w-72 min-w-56">
                <Link
                  href={`/admin/guides/${document.id}`}
                  className="font-medium hover:underline"
                >
                  {document.title}
                </Link>
                {document.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {document.description}
                  </p>
                ) : null}
              </TableCell>

              <TableCell>
                <Badge variant="outline">
                  {formatGuideCategory(document.category)}
                </Badge>
              </TableCell>

              <TableCell className="max-w-56 text-sm text-muted-foreground">
                {formatGuideAudiences(document.audiences)}
              </TableCell>

              <TableCell className="max-w-56 text-sm text-muted-foreground">
                {sourceDetail(document)}
              </TableCell>

              <TableCell>
                <Badge
                  variant={document.isPublished ? "outline" : "secondary"}
                >
                  {document.isPublished ? "Publicado" : "Borrador"}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href={`/admin/guides/${document.id}`}>
                        <RiEditLine data-icon="inline-start" />
                        Editar
                      </Link>
                    }
                  />

                  {document.hasFile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <a
                          href={guideDownloadHref(document.id)}
                          aria-label={`Descargar ${document.title}`}
                        />
                      }
                    >
                      <RiDownloadLine data-icon="inline-start" />
                      Descargar
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(document)}
                    aria-label={`Eliminar ${document.title}`}
                  >
                    <RiDeleteBinLine data-icon="inline-start" />
                    Eliminar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminGuidesPage() {
  const [documents, setDocuments] = useState<GuideDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<GuideDocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDocuments(await getAdminGuideDocuments());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los documentos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("uploadError")) {
      setError(
        "El documento se creó, pero el archivo no se pudo subir. Edítalo desde la lista para reintentar.",
      );
    }
  }, []);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await deleteGuideDocument(deleteTarget.id);
      setDeleteTarget(null);
      await loadDocuments();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el documento.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageFrame
      eyebrow="Administración"
      title="Administrar guías"
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
          <CardTitle>Catálogo de guías y documentos</CardTitle>
          <CardDescription>
            Publica formatos, plantillas y guías para la comunidad. Los
            documentos en borrador no aparecen en la página Guías.
          </CardDescription>
          <CardAction>
            <Button
              nativeButton={false}
              render={
                <Link href="/admin/guides/new">
                  <RiAddLine data-icon="inline-start" />
                  Nuevo documento
                </Link>
              }
            />
          </CardAction>
        </CardHeader>

        <CardContent>
          <AdminGuidesContent
            loading={loading}
            documents={documents}
            onDelete={setDeleteTarget}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{deleteTarget?.title}» y su archivo adjunto, si
              existe. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageFrame>
  );
}
