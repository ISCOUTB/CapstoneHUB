"use client";

import { useMemo } from "react";
import { ProjectDetails } from "../../services/schemas";
import { useAuth } from "../../components/auth-provider";

/**
 * Indica si el espectador puede ver los datos sensibles del proyecto (equipo,
 * observaciones, anexos, historial, entregas, hitos). El backend ya oculta esas
 * relaciones a los espectadores públicos, así que el flag que devuelve es la
 * fuente de verdad; la comprobación en cliente es solo un respaldo mientras
 * carga la respuesta.
 */
export function useIsProjectMember(project: ProjectDetails | null): boolean {
  const { session, ready } = useAuth();

  return useMemo(() => {
    if (!project) {
      return false;
    }

    if (typeof project.canViewSensitiveData === "boolean") {
      return project.canViewSensitiveData;
    }

    if (!ready || !session) {
      return false;
    }

    const roles = session.user.roles;

    if (
      roles.includes("admin") ||
      roles.includes("evaluator") ||
      roles.includes("coordinator")
    ) {
      return true;
    }

    return (project.actorAssignments ?? []).some(
      (assignment) => assignment.userId === session.user.id,
    );
  }, [ready, session, project]);
}
