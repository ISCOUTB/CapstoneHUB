"use client";

import { useState, useTransition } from "react";
import { updateProjectStatus } from "../services/projects";
import {
  ProjectEvaluationGate,
  ProjectMilestoneItem,
} from "../services/schemas";
import {
  canManageStatus,
  getAvailableStatuses,
  PROJECT_STATUS_OPTIONS,
} from "../services/project-permissions";
import { formatDate } from "../services/utils";
import { useAuth } from "./auth-provider";
import AccessNotice from "./access-notice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type ProjectAssignment = {
  userId: number;
  role: string;
};

type ProjectStatusEditFormProps = {
  projectId: number;
  currentStatus: string;
  assignments: ProjectAssignment[];
  milestones?: ProjectMilestoneItem[];
  evaluationGate?: ProjectEvaluationGate | null;
  onProjectChange?: () => Promise<void>;
};

function isSubmitDisabled(params: Readonly<{
  isPending: boolean;
  isCloseBlocked: boolean;
  status: string;
  currentStatus: string;
  isReasonRequired: boolean;
  trimmedReason: string;
}>): boolean {
  return (
    params.isPending ||
    params.isCloseBlocked ||
    params.status === params.currentStatus ||
    (params.isReasonRequired && params.trimmedReason.length === 0)
  );
}

function CloseBlockedAlert({
  pendingMinimums,
  isEvaluationBlocked,
  missingEvaluators,
}: Readonly<{
  pendingMinimums: ProjectMilestoneItem[];
  isEvaluationBlocked: boolean;
  missingEvaluators: { userId: number; fullName: string }[];
}>) {
  if (pendingMinimums.length === 0 && !isEvaluationBlocked) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>
        {pendingMinimums.length > 0 ? (
          <>
            No puedes cerrar el proyecto hasta completar sus hitos mínimos:
            <ul className="mt-2 list-disc pl-5">
              {pendingMinimums.map((milestone) => (
                <li key={milestone.id}>
                  {milestone.title} · vence {formatDate(milestone.dueDate)}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {isEvaluationBlocked ? (
          <>
            No puedes cerrar el proyecto hasta que la fase actual esté evaluada.
            {missingEvaluators.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {missingEvaluators.map((evaluator) => (
                  <li key={evaluator.userId}>
                    Falta la evaluación de {evaluator.fullName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2">
                Todavía no hay ninguna evaluación registrada para la fase actual.
              </p>
            )}
          </>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function StatusSelectField({
  status,
  onStatusChange,
  availableStatuses,
  disabled,
}: Readonly<{
  status: string;
  onStatusChange: (value: string) => void;
  availableStatuses: ReturnType<typeof getAvailableStatuses>;
  disabled: boolean;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor="status">Estado</FieldLabel>

      <Select
        value={status}
        onValueChange={(value) => {
          if (value) {
            onStatusChange(value);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id="status" className="w-full">
          <SelectValue>
            {PROJECT_STATUS_OPTIONS.find(
              (projectStatus) => projectStatus.value === status,
            )?.label ?? "Selecciona un estado"}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {availableStatuses.map((projectStatus) => (
            <SelectItem key={projectStatus.value} value={projectStatus.value}>
              {projectStatus.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function StatusSubmitButton({
  isPending,
  disabled,
}: Readonly<{ isPending: boolean; disabled: boolean }>) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button type="submit" disabled={disabled}>
        {isPending && <Spinner data-icon="inline-start" />}
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}

function StatusErrorAlert({
  message,
}: Readonly<{ message: string | null }>) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function missingEvaluatorsFor(
  evaluationGate: ProjectEvaluationGate | null,
): { userId: number; fullName: string }[] {
  return evaluationGate && !evaluationGate.completed
    ? evaluationGate.missingEvaluators
    : [];
}

function isEvaluationBlockedStatus(
  status: string,
  evaluationGate: ProjectEvaluationGate | null,
): boolean {
  return status === "closed" && evaluationGate != null && !evaluationGate.completed;
}

function isCloseBlockedStatus(
  status: string,
  pendingMinimums: ProjectMilestoneItem[],
  evaluationBlocked: boolean,
): boolean {
  return (
    status === "closed" && (pendingMinimums.length > 0 || evaluationBlocked)
  );
}

function StatusReasonField({
  reason,
  onChange,
  isReasonRequired,
  disabled,
}: Readonly<{
  reason: string;
  onChange: (value: string) => void;
  isReasonRequired: boolean;
  disabled: boolean;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor="status-reason">Motivo del cambio</FieldLabel>

      <Textarea
        id="status-reason"
        value={reason}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          isReasonRequired
            ? "Describe el motivo del cambio de estado..."
            : "Motivo del cambio (opcional para administradores)"
        }
        rows={4}
        disabled={disabled}
      />

      <FieldDescription>
        {isReasonRequired
          ? "Obligatorio: el historial guardará este motivo junto al cambio."
          : "Opcional para administradores; se registrará en el historial."}
      </FieldDescription>
    </Field>
  );
}

export default function ProjectStatusEditForm({
  projectId,
  currentStatus,
  assignments,
  milestones = [],
  evaluationGate = null,
  onProjectChange,
}: ProjectStatusEditFormProps) {
  const { session, isAuthenticated, ready } = useAuth();

  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!ready) {
    return null;
  }

  if (!isAuthenticated || !session) {
    return (
      <AccessNotice
        className="w-full"
        title="Actualizar estado del proyecto"
        message="Inicia sesión para cambiar el estado de este proyecto."
      />
    );
  }

  const canManage = canManageStatus(
    session.user,
    assignments,
    currentStatus,
  );

  if (!canManage) {
    return null;
  }

  const availableStatuses = getAvailableStatuses(
    session.user,
    assignments,
    currentStatus,
  );

  const isAdmin = session.user.roles.includes("admin");
  const isReasonRequired = !isAdmin;
  const trimmedReason = reason.trim();
  const pendingMinimums = milestones.filter(
    (milestone) => milestone.isMinimum && !milestone.completed,
  );
  const missingEvaluators = missingEvaluatorsFor(evaluationGate);
  const isEvaluationBlocked = isEvaluationBlockedStatus(status, evaluationGate);
  const isCloseBlocked = isCloseBlockedStatus(
    status,
    pendingMinimums,
    isEvaluationBlocked,
  );
  const submitDisabled = isSubmitDisabled({
    isPending,
    isCloseBlocked,
    status,
    currentStatus,
    isReasonRequired,
    trimmedReason,
  });

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (isReasonRequired && trimmedReason.length === 0) {
      setErrorMessage(
        "Debes indicar el motivo del cambio de estado antes de guardar.",
      );
      return;
    }

    startTransition(async () => {
      try {
        await updateProjectStatus(String(projectId), status, trimmedReason);
        setReason("");
        await onProjectChange?.();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado del proyecto",
        );
      }
    });
  }

  return (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <StatusSelectField
              status={status}
              onStatusChange={setStatus}
              availableStatuses={availableStatuses}
              disabled={isPending}
            />

            <StatusReasonField
              reason={reason}
              onChange={setReason}
              isReasonRequired={isReasonRequired}
              disabled={isPending}
            />

            {status === "closed" ? (
              <CloseBlockedAlert
                pendingMinimums={pendingMinimums}
                isEvaluationBlocked={isEvaluationBlocked}
                missingEvaluators={missingEvaluators}
              />
            ) : null}

            <StatusSubmitButton
              isPending={isPending}
              disabled={submitDisabled}
            />

            <StatusErrorAlert message={errorMessage} />
          </FieldGroup>
        </form>
  );
}
