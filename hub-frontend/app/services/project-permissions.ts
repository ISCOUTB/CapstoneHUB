import type { ProjectDetails } from "./schemas";

/**
 * Reglas de permisos del proyecto en el cliente. Reflejan
 * `AuthorizationService` en el backend: el rol asignado al proyecto decide lo
 * que se puede hacer; los roles globales solo habilitan la asignación, salvo el
 * directivo (y el admin), que además asigna actores, comenta y gestiona o
 * revisa entregas en cualquier proyecto sin asignarse.
 */

export type ProjectViewer = {
  id: number;
  roles: readonly string[];
};

export type ProjectAssignment = {
  userId: number;
  role: string;
};

export const PROJECT_STATUS_OPTIONS = [
  { value: "proposed", label: "Propuesto" },
  { value: "under_review", label: "En revisión" },
  { value: "approved", label: "Aprobado" },
  { value: "in_progress", label: "En progreso" },
  { value: "paused", label: "En pausa" },
  { value: "closed", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "rejected", label: "Rechazado" },
] as const;

/** Estados terminales en los que el proyecto pasa a ser de solo lectura. */
const READ_ONLY_STATUSES = new Set(["closed", "rejected"]);

/** Estados en los que el proponente todavía puede corregir su propuesta. */
const PROPOSER_EDITABLE_STATUSES = new Set(["proposed", "under_review"]);

/**
 * Estados destino: `under_review` quedó como legado y ya no se puede elegir;
 * solo se conserva en `PROJECT_STATUS_OPTIONS` para mostrarlo y filtrarlo.
 */
const SELECTABLE_STATUS_OPTIONS = PROJECT_STATUS_OPTIONS.filter(
  (status) => status.value !== "under_review",
);

/** Roles de proyecto que supervisan la ejecución. */
const TEACHER_ROLES = ["teacher"] as const;

/** Roles de proyecto que gestionan hitos, entregas y datos. */
const MANAGEMENT_ROLES = ["teacher", "evaluator"] as const;

/** Roles de proyecto que preparan y envían entregas. */
const SUBMITTER_ROLES = ["student"] as const;

export function isAdmin(viewer: ProjectViewer): boolean {
  return viewer.roles.includes("admin");
}

/** Admin y directivos revisan cualquier proyecto sin asignarse. */
export function reviewsAnyProject(viewer: ProjectViewer): boolean {
  return isAdmin(viewer) || viewer.roles.includes("directivo");
}

function isAssignedWith(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
  roles: readonly string[],
): boolean {
  return assignments.some(
    (assignment) =>
      assignment.userId === viewer.id && roles.includes(assignment.role),
  );
}

export function isAssignedMember(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return assignments.some((assignment) => assignment.userId === viewer.id);
}

export function isAssignedTeacher(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return isAssignedWith(viewer, assignments, TEACHER_ROLES);
}

export function isAssignedEvaluator(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return isAssignedWith(viewer, assignments, ["evaluator"]);
}

/**
 * Pestaña de evaluación: admin y directivo la ven siempre; un evaluador solo
 * cuando está asignado al proyecto.
 */
export function canViewProjectEvaluations(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return reviewsAnyProject(viewer) || isAssignedEvaluator(viewer, assignments);
}

/** Enviar evaluación: admin o evaluador asignado. Un directivo no asignado no. */
export function canSubmitProjectEvaluation(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return isAdmin(viewer) || isAssignedEvaluator(viewer, assignments);
}

export function canViewSensitiveData(
  viewer: ProjectViewer | null | undefined,
  project: Pick<ProjectDetails, "isProposer" | "actorAssignments">,
): boolean {
  if (!viewer) {
    return false;
  }

  if (reviewsAnyProject(viewer)) {
    return true;
  }

  if (project.isProposer) {
    return true;
  }

  return isAssignedMember(viewer, project.actorAssignments ?? []);
}

export function canEditProjectDetails(
  viewer: ProjectViewer,
  project: Pick<ProjectDetails, "status" | "isProposer" | "actorAssignments">,
): boolean {
  if (READ_ONLY_STATUSES.has(project.status)) {
    return false;
  }

  if (reviewsAnyProject(viewer)) {
    return true;
  }

  if (
    isAssignedWith(viewer, project.actorAssignments ?? [], MANAGEMENT_ROLES)
  ) {
    return true;
  }

  return Boolean(project.isProposer) && PROPOSER_EDITABLE_STATUSES.has(
    project.status,
  );
}

/** Asignar actores: admin, directivo o docente asignado. */
export function canAssignActors(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return reviewsAnyProject(viewer) || isAssignedTeacher(viewer, assignments);
}

/** Gestionar hitos. */
export function canManageMilestones(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return isAdmin(viewer) || isAssignedWith(viewer, assignments, MANAGEMENT_ROLES);
}

/** Gestionar y revisar entregas: admin, directivo o docentes/evaluadores asignados. */
export function canManageReports(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return reviewsAnyProject(viewer) || isAssignedWith(viewer, assignments, MANAGEMENT_ROLES);
}

/** Avanzar de fase (semestre). */
export function canAdvancePhase(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return isAdmin(viewer) || isAssignedTeacher(viewer, assignments);
}

/** Preparar y enviar entregas: admin o estudiante asignado. */
export function canSubmitReports(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return isAdmin(viewer) || isAssignedWith(viewer, assignments, SUBMITTER_ROLES);
}

/** Comentar/observar el proyecto: admin, directivo o miembro asignado. */
export function canComment(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
): boolean {
  return reviewsAnyProject(viewer) || isAssignedMember(viewer, assignments);
}

export function canDeleteAttachment(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
  uploadedById: number | null | undefined,
): boolean {
  if (uploadedById === viewer.id) {
    return true;
  }

  return isAdmin(viewer) || isAssignedTeacher(viewer, assignments);
}

function getManagedStatuses(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
  currentStatus: string,
): ReadonlyArray<(typeof PROJECT_STATUS_OPTIONS)[number]> {
  if (isAdmin(viewer)) {
    return SELECTABLE_STATUS_OPTIONS;
  }

  // Un directivo resuelve la fase de propuesta sin asignarse; un evaluador de
  // expo solo cuando está asignado al proyecto.
  const canResolveProposal =
    viewer.roles.includes("directivo") ||
    isAssignedWith(viewer, assignments, ["evaluator"]);
  const isTeacher = isAssignedTeacher(viewer, assignments);
  const allowed = new Set<string>();

  switch (currentStatus) {
    case "proposed":
      if (canResolveProposal) {
        allowed.add("approved");
        allowed.add("rejected");
      }
      break;
    // `under_review` es legado: los proyectos que quedaron ahí pueden salir.
    case "under_review":
      if (canResolveProposal) {
        allowed.add("approved");
        allowed.add("rejected");
      }
      break;
    case "approved":
      if (canResolveProposal) {
        allowed.add("rejected");
      }
      if (isTeacher) {
        allowed.add("in_progress");
      }
      break;
    case "in_progress":
      if (isTeacher) {
        allowed.add("paused");
        allowed.add("closed");
        allowed.add("cancelled");
      }
      break;
    case "paused":
      if (isTeacher) {
        allowed.add("in_progress");
        allowed.add("cancelled");
      }
      break;
    default:
      break;
  }

  return PROJECT_STATUS_OPTIONS.filter((status) => allowed.has(status.value));
}

export function getAvailableStatuses(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
  currentStatus: string,
): ReadonlyArray<(typeof PROJECT_STATUS_OPTIONS)[number]> {
  return getManagedStatuses(viewer, assignments, currentStatus);
}

export function canManageStatus(
  viewer: ProjectViewer,
  assignments: readonly ProjectAssignment[],
  currentStatus: string,
): boolean {
  return getManagedStatuses(viewer, assignments, currentStatus).length > 0;
}
