"use client";

import { useEffect, useState } from "react";
import { getProjectById } from "../../services/projects";
import { ProjectDetails } from "../../services/schemas";

type UseProjectDetailsResult = {
  project: ProjectDetails | null;
  loading: boolean;
  status: number | undefined;
};

/**
 * Carga el detalle de un proyecto y expone el estado HTTP cuando la respuesta
 * no es exitosa, para que la vista distinga entre "no existe" y "sin acceso".
 */
export function useProjectDetails(id: string): UseProjectDetailsResult {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function loadProject() {
      try {
        setLoading(true);

        const {
          project: nextProject,
          status: nextStatus,
          error,
        } = await getProjectById(id);

        if (!active) {
          return;
        }

        setProject(nextProject ?? null);
        setStatus(error ? nextStatus : undefined);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      active = false;
    };
  }, [id]);

  return { project, loading, status };
}
