"use client";

import { useMemo } from "react";
import { ProjectDetails } from "../../services/schemas";
import { useAuth } from "../../components/auth-provider";

/** Estados terminales en los que el proyecto pasa a ser de solo lectura. */
const READ_ONLY_STATUSES = new Set(["closed", "rejected"]);

/** Estados en los que el proponente todavía puede corregir su propuesta. */
const PROPOSER_EDITABLE_STATUSES = new Set(["proposed", "under_review"]);

/** Roles de proyecto que habilitan la edición cuando están asignados. */
const ASSIGNED_EDITOR_ROLES = new Set(["coordinator", "advisor"]);

/**
 * Indica si el espectador puede editar los datos del proyecto. Pueden hacerlo
 * los administradores y los evaluadores globales, los coordinadores y asesores
 * asignados al proyecto con su rol, y el proponente mientras el proyecto siga en
 * propuesta o revisión. Nunca en proyectos finalizados o rechazados. Es la
 * comprobación de interfaz; el backend vuelve a validarlo.
 */
export function useCanEditProject(project: ProjectDetails | null): boolean {
  const { session, ready } = useAuth();

  return useMemo(() => {
    if (!project || !ready || !session) {
      return false;
    }

    const roles = session.user.roles;

    if (roles.includes("admin") || roles.includes("evaluator")) {
      return !READ_ONLY_STATUSES.has(project.status);
    }

    const isAssignedEditor = (project.actorAssignments ?? []).some(
      (assignment) =>
        assignment.userId === session.user.id &&
        ASSIGNED_EDITOR_ROLES.has(assignment.role),
    );

    if (isAssignedEditor) {
      return !READ_ONLY_STATUSES.has(project.status);
    }

    if (project.isProposer) {
      return PROPOSER_EDITABLE_STATUSES.has(project.status);
    }

    return false;
  }, [ready, session, project]);
}
