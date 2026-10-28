"use client";

import { useMemo } from "react";
import { ProjectDetails } from "../../services/schemas";
import { canEditProjectDetails } from "../../services/project-permissions";
import { useAuth } from "../../components/auth-provider";

/**
 * Indica si el espectador puede editar los datos del proyecto. Pueden hacerlo
 * los administradores y los directivos, los docentes y evaluadores asignados al
 * proyecto, y el proponente mientras el proyecto siga en propuesta
 * o revisión. Nunca en proyectos finalizados o rechazados. Es la comprobación
 * de interfaz; el backend vuelve a validarlo.
 */
export function useCanEditProject(project: ProjectDetails | null): boolean {
  const { session, ready } = useAuth();

  return useMemo(() => {
    if (!project || !ready || !session) {
      return false;
    }

    return canEditProjectDetails(session.user, project);
  }, [ready, session, project]);
}
