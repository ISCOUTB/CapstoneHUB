"use client";

import { useState } from "react";
import {
  ProjectAttachmentItem,
  ProjectReportContentItem,
  ProjectReportItem,
  ProjectReportStatus,
} from "../../../services/schemas";
import { formatDate } from "../../../services/utils";
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiEyeLine,
  RiPencilLine,
  RiSendPlaneLine,
  RiTimeLine,
} from "@remixicon/react";
import {
  CONTENT_KIND_LABELS,
  ContentKindIcon,
  ContentPayload,
  ErrorBanner,
  ReportContentComposer,
  ReportContents,
  useAsyncAction,
} from "./report-content";

function isOverdue(report: ProjectReportItem): boolean {
  if (report.status === "submitted" || report.status === "accepted") {
    return false;
  }

  return new Date(report.dueDate).getTime() < Date.now();
}

function ReportStatusBadge({ status }: { readonly status: ProjectReportStatus }) {
  if (status === "accepted") {
    return (
      <Badge>
        <RiCheckboxCircleLine />
        Aceptada
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge variant="destructive">
        <RiCloseCircleLine />
        No aceptada
      </Badge>
    );
  }

  if (status === "submitted") {
    return (
      <Badge variant="outline">
        <RiEyeLine />
        En revisión
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <RiTimeLine />
      Pendiente
    </Badge>
  );
}

type ReportCardProps = {
  readonly report: ProjectReportItem;
  readonly currentUserId: number | null;
  readonly canManage: boolean;
  readonly canSubmit: boolean;
  readonly onEdit: (report: ProjectReportItem) => void;
  readonly onDelete: (report: ProjectReportItem) => void;
  readonly onSubmit: (report: ProjectReportItem) => Promise<void>;
  readonly onReview: (
    report: ProjectReportItem,
    decision: "accepted" | "rejected",
  ) => void;
  readonly onEditContent: (
    report: ProjectReportItem,
    content: ProjectReportContentItem,
  ) => void;
  readonly onCreateContent: (
    reportId: number,
    payload: ContentPayload,
  ) => Promise<void>;
  readonly onUploadContent: (
    reportId: number,
    file: File,
    onProgress: (fraction: number) => void,
  ) => Promise<void>;
  readonly onDeleteContent: (reportId: number, contentId: number) => Promise<void>;
  readonly onDownload: (attachment: ProjectAttachmentItem) => Promise<void>;
};

type ReportCardHeaderProps = {
  readonly report: ProjectReportItem;
  readonly canManage: boolean;
  readonly busy: boolean;
  readonly onEdit: (report: ProjectReportItem) => void;
  readonly onDelete: (report: ProjectReportItem) => void;
};

function ReportCardHeader({
  report,
  canManage,
  busy,
  onEdit,
  onDelete,
}: ReportCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="whitespace-normal">{report.title}</CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-1">
              <ContentKindIcon kind={report.type} className="size-3.5" />
              {CONTENT_KIND_LABELS[report.type]}
            </span>
            {" · Vence el "}
            {formatDate(report.dueDate)}
            {report.createdBy
              ? ` · Creada por ${report.createdBy.fullName}`
              : ""}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <ReportStatusBadge status={report.status} />

          {canManage ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Editar entrega"
                onClick={() => onEdit(report)}
                disabled={busy}
              >
                <RiPencilLine />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Eliminar entrega"
                className="text-destructive"
                onClick={() => onDelete(report)}
                disabled={busy}
              >
                <RiDeleteBinLine />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </CardHeader>
  );
}

function ReportSummary({ report }: { readonly report: ProjectReportItem }) {
  return (
    <>
      {report.description ? (
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {report.description}
        </p>
      ) : null}

      {isOverdue(report) ? (
        <Alert variant="destructive">
          <RiErrorWarningLine />
          <AlertDescription>La fecha de entrega ya venció.</AlertDescription>
        </Alert>
      ) : null}

      {report.submittedAt ? (
        <p className="text-sm text-muted-foreground">
          Enviada el {formatDate(report.submittedAt)}
        </p>
      ) : null}
    </>
  );
}

function ReportReviewAlert({ report }: { readonly report: ProjectReportItem }) {
  if (!["accepted", "rejected"].includes(report.status)) {
    return null;
  }

  const isRejected = report.status === "rejected";

  return (
    <Alert variant={isRejected ? "destructive" : "default"}>
      <AlertDescription>
        <p className="font-medium">
          {isRejected ? "No aceptada" : "Aceptada"}
          {report.reviewedBy ? ` por ${report.reviewedBy.fullName}` : ""}
          {report.reviewedAt ? ` el ${formatDate(report.reviewedAt)}` : ""}
        </p>
        {report.reviewComment ? (
          <p className="mt-1 whitespace-pre-line">{report.reviewComment}</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function ReportSubmitAction({
  report,
  busy,
  onClick,
}: {
  readonly report: ProjectReportItem;
  readonly busy: boolean;
  readonly onClick: () => void;
}) {
  const label =
    report.status === "rejected" ? "Reenviar entrega" : "Enviar entrega";

  return (
    <div className="flex justify-end">
      <Button onClick={onClick} disabled={busy}>
        <RiSendPlaneLine />
        {label}
      </Button>
    </div>
  );
}

function ReportReviewActions({
  report,
  busy,
  onReview,
}: {
  readonly report: ProjectReportItem;
  readonly busy: boolean;
  readonly onReview: (
    report: ProjectReportItem,
    decision: "accepted" | "rejected",
  ) => void;
}) {
  return (
    <>
      <Separator />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => onReview(report, "rejected")}
          disabled={busy}
        >
          <RiCloseCircleLine />
          No aceptar
        </Button>
        <Button onClick={() => onReview(report, "accepted")} disabled={busy}>
          <RiCheckboxCircleLine />
          Aceptar
        </Button>
      </div>
    </>
  );
}

export function ReportCard({
  report,
  currentUserId,
  canManage,
  canSubmit,
  onEdit,
  onDelete,
  onSubmit,
  onReview,
  onEditContent,
  onCreateContent,
  onUploadContent,
  onDeleteContent,
  onDownload,
}: ReportCardProps) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { busy, errorMessage, setErrorMessage, run } = useAsyncAction();

  const isAwaitingReview = report.status === "submitted";
  const isEditable = report.status === "pending" || report.status === "rejected";
  const canEditContent = canSubmit ? isEditable : false;
  const reportType = report.type;
  const fileCount = report.contents.length;

  function hasReachedMaxFiles(): boolean {
    if (reportType !== "file") {
      return false;
    }

    if (report.maxFiles === null) {
      return false;
    }

    return fileCount >= report.maxFiles;
  }

  function canAddContent(): boolean {
    return canEditContent ? !hasReachedMaxFiles() : false;
  }

  function showMaxFilesNotice(): boolean {
    return canEditContent ? hasReachedMaxFiles() : false;
  }

  function canReview(): boolean {
    return canManage ? isAwaitingReview : false;
  }

  function canDeleteContent(content: ProjectReportContentItem): boolean {
    if (!canEditContent) {
      return false;
    }

    if (canManage) {
      return true;
    }

    if (currentUserId === null) {
      return false;
    }

    return content.createdBy?.id === currentUserId;
  }

  function handleSubmit() {
    if (report.contents.length === 0) {
      setErrorMessage(
        "Agrega al menos un contenido antes de enviar la entrega.",
      );
      return;
    }

    setSubmitOpen(true);
  }

  async function confirmSubmit() {
    setSubmitOpen(false);

    await run(() => onSubmit(report), "No se pudo enviar la entrega");
  }

  return (
    <Card>
      <ReportCardHeader
        report={report}
        canManage={canManage}
        busy={busy}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <CardContent className="flex flex-col gap-4">
        <ReportSummary report={report} />
        <ReportReviewAlert report={report} />

        <ReportContents
          report={report}
          canEditContent={canEditContent}
          canDeleteContent={canDeleteContent}
          onEditContent={onEditContent}
          onDeleteContent={onDeleteContent}
          onDownload={onDownload}
        />

        {canAddContent() ? (
          <ReportContentComposer
            reportType={reportType}
            allowedMimeTypes={report.allowedMimeTypes}
            fileCount={fileCount}
            maxFiles={report.maxFiles}
            onCreateContent={(payload) => onCreateContent(report.id, payload)}
            onUploadContent={(file, onProgress) =>
              onUploadContent(report.id, file, onProgress)
            }
          />
        ) : null}

        {showMaxFilesNotice() ? (
          <Alert>
            <AlertDescription>
              Alcanzaste el máximo de {report.maxFiles} archivo(s) para esta
              entrega.
            </AlertDescription>
          </Alert>
        ) : null}

        {canEditContent ? (
          <ReportSubmitAction
            report={report}
            busy={busy}
            onClick={handleSubmit}
          />
        ) : null}

        {canReview() ? (
          <ReportReviewActions
            report={report}
            busy={busy}
            onReview={onReview}
          />
        ) : null}

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      </CardContent>

      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar entrega</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Enviar la entrega &quot;{report.title}&quot;? No podrá editarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmSubmit()}>
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
