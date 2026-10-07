"use client";

import { useState, useTransition } from "react";
import { updateProjectStatus } from "../services/projects";
import { ProjectMilestoneItem } from "../services/schemas";
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

const projectStatuses = [
  { value: "proposed", label: "Propuesto" },
  { value: "under_review", label: "En revisión" },
  { value: "approved", label: "Aprobado" },
  { value: "in_progress", label: "En progreso" },
  { value: "paused", label: "En pausa" },
  { value: "closed", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "rejected", label: "Rechazado" },
] as const;

type ProjectAssignment = {
  userId: number;
  role: string;
};

type ProjectStatusEditFormProps = {
  projectId: number;
  currentStatus: string;
  assignments: ProjectAssignment[];
  milestones?: ProjectMilestoneItem[];
  onProjectChange?: () => Promise<void>;
};

export function canManageStatus(
  userId: number,
  roles: string[],
  currentStatus: string,
  assignments: ProjectAssignment[],
): boolean {
  if (roles.includes("admin")) {
    return true;
  }

  const isAssignedEvaluator = assignments.some(
    (assignment) =>
      assignment.userId === userId && assignment.role === "evaluator",
  );
  const canEvaluate =
    roles.includes("evaluator") &&
    isAssignedEvaluator &&
    (currentStatus === "proposed" ||
      currentStatus === "under_review" ||
      currentStatus === "approved");

  const isAssignedCoordinator = assignments.some(
    (assignment) =>
      assignment.userId === userId && assignment.role === "coordinator",
  );
  const canCoordinate =
    roles.includes("coordinator") &&
    isAssignedCoordinator &&
    (currentStatus === "approved" ||
      currentStatus === "in_progress" ||
      currentStatus === "paused");

  return canEvaluate || canCoordinate;
}

function getAvailableStatuses(
  roles: string[],
  currentStatus: string,
): ReadonlyArray<(typeof projectStatuses)[number]> {
  if (roles.includes("admin")) {
    return projectStatuses;
  }

  const isEvaluator = roles.includes("evaluator");
  const isCoordinator = roles.includes("coordinator");
  const allowed = new Set<string>();

  switch (currentStatus) {
    case "proposed":
      if (isEvaluator) {
        allowed.add("under_review");
        allowed.add("rejected");
      }
      break;
    case "under_review":
      if (isEvaluator) {
        allowed.add("approved");
        allowed.add("rejected");
      }
      break;
    case "approved":
      if (isEvaluator) {
        allowed.add("rejected");
      }
      if (isCoordinator) {
        allowed.add("in_progress");
      }
      break;
    case "in_progress":
      if (isCoordinator) {
        allowed.add("paused");
        allowed.add("closed");
        allowed.add("cancelled");
      }
      break;
    case "paused":
      if (isCoordinator) {
        allowed.add("in_progress");
        allowed.add("cancelled");
      }
      break;
    default:
      break;
  }

  return projectStatuses.filter((projectStatus) =>
    allowed.has(projectStatus.value),
  );
}

export default function ProjectStatusEditForm({
  projectId,
  currentStatus,
  assignments,
  milestones = [],
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
    session.user.id,
    session.user.roles,
    currentStatus,
    assignments,
  );

  if (!canManage) {
    return null;
  }

  const availableStatuses = getAvailableStatuses(
    session.user.roles,
    currentStatus,
  );

  const isAdmin = session.user.roles.includes("admin");
  const isReasonRequired = !isAdmin;
  const trimmedReason = reason.trim();
  const pendingMinimums = milestones.filter(
    (milestone) => milestone.isMinimum && !milestone.completed,
  );
  const isCloseBlocked = status === "closed" && pendingMinimums.length > 0;
  const isSubmitDisabled =
    isPending ||
    isCloseBlocked ||
    status === currentStatus ||
    (isReasonRequired && trimmedReason.length === 0);

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
            <Field>
              <FieldLabel htmlFor="status">Estado</FieldLabel>

              <Select
                value={status}
                onValueChange={(value) => {
                  if (value) {
                    setStatus(value);
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue>
                    {projectStatuses.find(
                      (projectStatus) => projectStatus.value === status,
                    )?.label ?? "Selecciona un estado"}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {availableStatuses.map((projectStatus) => (
                    <SelectItem
                      key={projectStatus.value}
                      value={projectStatus.value}
                    >
                      {projectStatus.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="status-reason">Motivo del cambio</FieldLabel>

              <Textarea
                id="status-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  isReasonRequired
                    ? "Describe el motivo del cambio de estado..."
                    : "Motivo del cambio (opcional para administradores)"
                }
                rows={4}
                disabled={isPending}
              />

              <FieldDescription>
                {isReasonRequired
                  ? "Obligatorio: el historial guardará este motivo junto al cambio."
                  : "Opcional para administradores; se registrará en el historial."}
              </FieldDescription>
            </Field>

            {isCloseBlocked ? (
              <Alert variant="destructive">
                <AlertDescription>
                  No puedes cerrar el proyecto hasta completar sus hitos
                  mínimos:
                  <ul className="mt-2 list-disc pl-5">
                    {pendingMinimums.map((milestone) => (
                      <li key={milestone.id}>
                        {milestone.title} · vence{" "}
                        {formatDate(milestone.dueDate)}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitDisabled}>
                {isPending && <Spinner data-icon="inline-start" />}
                {isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </form>
  );
}
