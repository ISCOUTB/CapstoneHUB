"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  deleteProjectAttachment,
  downloadProjectAttachment,
  uploadProjectAttachment,
} from "../../services/attachments";
import { ProjectAttachmentItem } from "../../services/schemas";
import {
  canDeleteAttachment,
  reviewsAnyProject,
} from "../../services/project-permissions";
import { useAuth } from "../../components/auth-provider";
import AccessNotice from "../../components/access-notice";
import {
  ATTACHMENT_ACCEPT,
  formatBytes,
  formatDate,
  validateAttachmentFile,
} from "../../services/utils";

import { Button } from "@/components/ui/button";
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
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RiAttachmentLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiErrorWarningLine,
  RiLockLine,
} from "@remixicon/react";

type ProjectActorAssignment = {
  id: number;
  userId: number;
  role: string;
};

type ProjectAttachmentsPanelProps = {
  projectId: number;
  attachments: ProjectAttachmentItem[];
  assignments: ProjectActorAssignment[];
  onProjectChange: () => Promise<void>;
};

function getPermissionMessage(isAuthenticated: boolean): string {
  return isAuthenticated
    ? "No tienes permisos para ver ni descargar los anexos de este proyecto."
    : "Inicia sesión para ver y descargar los anexos.";
}

type AttachmentUploadCardProps = {
  ready: boolean;
  isAuthenticated: boolean;
  canUpload: boolean;
  isPending: boolean;
  selectedFile: File | null;
  errorMessage: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void;
};

function AttachmentUploadCard({
  ready,
  isAuthenticated,
  canUpload,
  isPending,
  selectedFile,
  errorMessage,
  onFileChange,
  onSubmit,
}: AttachmentUploadCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos</CardTitle>
        <CardDescription>
          Documentos e imágenes vinculados al proyecto. Máximo 10 MB por archivo
          (PDF, Word, Excel, PNG o JPEG).
        </CardDescription>
      </CardHeader>

      <CardContent>
        {renderUploadContent()}
      </CardContent>
    </Card>
  );

  function renderUploadContent() {
    if (!ready) {
      return (
        <Alert>
          <AlertDescription>Cargando acceso...</AlertDescription>
        </Alert>
      );
    }

    if (!isAuthenticated) {
      return (
        <AccessNotice
          variant="alert"
          message="Inicia sesión para consultar y subir anexos."
        />
      );
    }

    if (!canUpload) {
      return (
        <Alert>
          <RiLockLine />
          <AlertDescription>
            Solo los participantes del proyecto pueden subir anexos.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          type="file"
          onChange={onFileChange}
          disabled={isPending}
          accept={ATTACHMENT_ACCEPT}
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {getSelectedFileLabel(selectedFile)}
          </span>
          <Button type="submit" disabled={isPending || !selectedFile}>
            {isPending ? "Subiendo..." : "Subir anexo"}
          </Button>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
      </form>
    );
  }
}

function getSelectedFileLabel(selectedFile: File | null): string {
  if (!selectedFile) {
    return "Selecciona un archivo para subir.";
  }

  return `${selectedFile.name} · ${formatBytes(selectedFile.size)}`;
}

function PermissionNotice({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Alert className="mb-4">
      <RiLockLine />
      <AlertTitle>{getPermissionMessage(isAuthenticated)}</AlertTitle>
      {isAuthenticated ? null : (
        <AlertAction>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/login">Iniciar sesión</Link>}
          />
        </AlertAction>
      )}
    </Alert>
  );
}

function ListErrorBanner({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <RiErrorWarningLine />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

type AttachmentNameProps = {
  attachment: ProjectAttachmentItem;
  canView: boolean;
  onDownload: (attachment: ProjectAttachmentItem) => void;
};

function AttachmentName({
  attachment,
  canView,
  onDownload,
}: AttachmentNameProps) {
  if (!canView) {
    return (
      <span
        className="flex items-center gap-1.5 truncate text-left font-medium text-muted-foreground"
        title="No tienes permisos para descargar este anexo"
      >
        {attachment.originalName}
        <RiLockLine className="size-3.5 shrink-0" />
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="link"
      onClick={() => onDownload(attachment)}
      className="h-auto justify-start truncate p-0 font-medium"
    >
      {attachment.originalName}
    </Button>
  );
}

type AttachmentNameCellProps = AttachmentNameProps;

function AttachmentNameCell({
  attachment,
  canView,
  onDownload,
}: AttachmentNameCellProps) {
  return (
    <TableCell className="whitespace-normal">
      <div className="flex items-center gap-2">
        <RiAttachmentLine className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <AttachmentName
            attachment={attachment}
            canView={canView}
            onDownload={onDownload}
          />
          {attachment.uploadedBy ? (
            <p className="truncate text-xs text-muted-foreground">
              {attachment.uploadedBy.fullName}
            </p>
          ) : null}
        </div>
      </div>
    </TableCell>
  );
}

type DownloadButtonProps = {
  canView: boolean;
  isPending: boolean;
  onDownload: () => void;
};

function DownloadButton({ canView, isPending, onDownload }: DownloadButtonProps) {
  if (!canView) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Sin permisos para descargar"
        title="No tienes permisos para descargar este anexo"
        disabled
      >
        <RiLockLine />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Descargar anexo"
      onClick={onDownload}
      disabled={isPending}
    >
      <RiDownloadLine />
    </Button>
  );
}

type DeleteButtonProps = {
  canDelete: boolean;
  isPending: boolean;
  onDelete: () => void;
};

function DeleteButton({ canDelete, isPending, onDelete }: DeleteButtonProps) {
  if (!canDelete) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Eliminar anexo"
      className="text-destructive"
      onClick={onDelete}
      disabled={isPending}
    >
      <RiDeleteBinLine />
    </Button>
  );
}

type AttachmentActionsCellProps = {
  attachment: ProjectAttachmentItem;
  canView: boolean;
  canDelete: boolean;
  isPending: boolean;
  onDownload: (attachment: ProjectAttachmentItem) => void;
  onDelete: (attachment: ProjectAttachmentItem) => void;
};

function AttachmentActionsCell({
  attachment,
  canView,
  canDelete,
  isPending,
  onDownload,
  onDelete,
}: AttachmentActionsCellProps) {
  return (
    <TableCell className="text-right">
      <div className="flex justify-end gap-1">
        <DownloadButton
          canView={canView}
          isPending={isPending}
          onDownload={() => onDownload(attachment)}
        />
        <DeleteButton
          canDelete={canDelete}
          isPending={isPending}
          onDelete={() => onDelete(attachment)}
        />
      </div>
    </TableCell>
  );
}

type AttachmentRowProps = AttachmentActionsCellProps & {
  showActions: boolean;
};

function AttachmentRow({
  attachment,
  canView,
  canDelete,
  isPending,
  showActions,
  onDownload,
  onDelete,
}: AttachmentRowProps) {
  return (
    <TableRow>
      <AttachmentNameCell
        attachment={attachment}
        canView={canView}
        onDownload={onDownload}
      />
      <TableCell className="text-muted-foreground">
        {formatBytes(attachment.sizeBytes)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(attachment.createdAt)}
      </TableCell>
      {showActions ? (
        <AttachmentActionsCell
          attachment={attachment}
          canView={canView}
          canDelete={canDelete}
          isPending={isPending}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ) : null}
    </TableRow>
  );
}

type AttachmentsTableProps = {
  attachments: ProjectAttachmentItem[];
  canView: boolean;
  isPending: boolean;
  canDelete: (attachment: ProjectAttachmentItem) => boolean;
  onDownload: (attachment: ProjectAttachmentItem) => void;
  onDelete: (attachment: ProjectAttachmentItem) => void;
};

function AttachmentsTable({
  attachments,
  canView,
  isPending,
  canDelete,
  onDownload,
  onDelete,
}: AttachmentsTableProps) {
  const showActions = canView || attachments.some(canDelete);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Archivo</TableHead>
          <TableHead className="w-32">Tamaño</TableHead>
          <TableHead className="w-48">Subido</TableHead>
          {showActions ? (
            <TableHead className="w-24 text-right">Acciones</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {attachments.map((attachment) => (
          <AttachmentRow
            key={attachment.id}
            attachment={attachment}
            canView={canView}
            canDelete={canDelete(attachment)}
            isPending={isPending}
            showActions={showActions}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}

type AttachmentsListCardProps = {
  attachments: ProjectAttachmentItem[];
  ready: boolean;
  isAuthenticated: boolean;
  canView: boolean;
  listError: string | null;
  isPending: boolean;
  canDelete: (attachment: ProjectAttachmentItem) => boolean;
  onDownload: (attachment: ProjectAttachmentItem) => void;
  onDelete: (attachment: ProjectAttachmentItem) => void;
};

function AttachmentsListCard({
  attachments,
  ready,
  isAuthenticated,
  canView,
  listError,
  isPending,
  canDelete,
  onDownload,
  onDelete,
}: AttachmentsListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Archivos</CardTitle>
        <CardDescription>{getAttachmentsSummary(attachments.length)}</CardDescription>
      </CardHeader>

      {attachments.length > 0 ? (
        <CardContent>
          {ready && !canView ? (
            <PermissionNotice isAuthenticated={isAuthenticated} />
          ) : null}

          {listError ? <ListErrorBanner message={listError} /> : null}

          <AttachmentsTable
            attachments={attachments}
            canView={canView}
            isPending={isPending}
            canDelete={canDelete}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        </CardContent>
      ) : (
        <CardContent>
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Sin anexos</EmptyTitle>
              <EmptyDescription>
                No hay anexos registrados.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      )}
    </Card>
  );
}

function getAttachmentsSummary(count: number): string {
  if (count === 0) {
    return "No hay anexos registrados.";
  }

  return `${count} anexo(s) registrado(s).`;
}

export default function ProjectAttachmentsPanel({
  projectId,
  attachments,
  assignments,
  onProjectChange,
}: ProjectAttachmentsPanelProps) {
  const { session, isAuthenticated, ready } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ProjectAttachmentItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentUser = session?.user;

  const isProjectMember = useMemo(() => {
    if (!currentUser) {
      return false;
    }

    return assignments.some(
      (assignment) => assignment.userId === currentUser.id,
    );
  }, [currentUser, assignments]);

  const isAdmin = currentUser?.roles.includes("admin") ?? false;
  const isReviewer = currentUser ? reviewsAnyProject(currentUser) : false;
  const canUpload = isProjectMember || isAdmin;
  const canView = isAuthenticated && (isProjectMember || isAdmin || isReviewer);

  function canDelete(attachment: ProjectAttachmentItem): boolean {
    if (!currentUser) {
      return false;
    }

    return canDeleteAttachment(
      currentUser,
      assignments,
      attachment.uploadedBy?.id,
    );
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage(null);
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateAttachmentFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  function handleUpload(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage("Selecciona un archivo antes de subirlo.");
      return;
    }

    const form = event.currentTarget;

    startTransition(async () => {
      try {
        await uploadProjectAttachment(String(projectId), selectedFile);
        setSelectedFile(null);
        form.reset();
        await onProjectChange();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudo subir el anexo",
        );
      }
    });
  }

  function handleDownload(attachment: ProjectAttachmentItem) {
    if (!canView) {
      setListError(
        "No tienes permisos para descargar los anexos de este proyecto.",
      );
      return;
    }

    setListError(null);

    startTransition(async () => {
      try {
        await downloadProjectAttachment(
          String(projectId),
          attachment.id,
          attachment.originalName,
        );
      } catch (error) {
        setListError(
          error instanceof Error
            ? error.message
            : "No se pudo descargar el anexo",
        );
      }
    });
  }

  function handleDelete(attachment: ProjectAttachmentItem) {
    if (!canDelete(attachment)) {
      setListError("No tienes permisos para eliminar este anexo.");
      return;
    }

    setDeleteTarget(attachment);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    const attachment = deleteTarget;

    if (!attachment) {
      return;
    }

    setDeleteOpen(false);
    setDeleteTarget(null);

    if (!canDelete(attachment)) {
      setListError("No tienes permisos para eliminar este anexo.");
      return;
    }

    setListError(null);

    startTransition(async () => {
      try {
        await deleteProjectAttachment(String(projectId), attachment.id);
        await onProjectChange();
      } catch (error) {
        setListError(
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el anexo",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <AttachmentUploadCard
        ready={ready}
        isAuthenticated={isAuthenticated}
        canUpload={canUpload}
        isPending={isPending}
        selectedFile={selectedFile}
        errorMessage={errorMessage}
        onFileChange={handleFileChange}
        onSubmit={handleUpload}
      />

      <AttachmentsListCard
        attachments={attachments}
        ready={ready}
        isAuthenticated={isAuthenticated}
        canView={canView}
        listError={listError}
        isPending={isPending}
        canDelete={canDelete}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar anexo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar el anexo &quot;{deleteTarget?.originalName}&quot;? Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
