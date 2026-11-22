"use client";

import { useEffect, useState } from "react";
import { getProjects, type ProjectListQuery } from "../services/projects";
import { type ProjectItem } from "../services/schemas";

export type RemoteProjects = {
  queryKey: string;
  projects: ProjectItem[];
  status?: number;
  error: string | null;
};

type UseRemoteProjectsParams = {
  readonly enabled: boolean;
  readonly query: ProjectListQuery;
  readonly queryKey: string;
  readonly reloadKey: number;
};

/**
 * Consulta el listado cuando hay filtros activos, con debounce y protección
 * contra respuestas obsoletas. Compartido por el listado y la galería.
 */
export function useRemoteProjects({
  enabled,
  query,
  queryKey,
  reloadKey,
}: UseRemoteProjectsParams): RemoteProjects | null {
  const [remoteProjects, setRemoteProjects] =
    useState<RemoteProjects | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      const result = await getProjects(query);

      if (!active) {
        return;
      }

      setRemoteProjects({
        queryKey,
        projects: result.projects,
        status: result.status,
        error: result.error ?? null,
      });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, query, queryKey, reloadKey]);

  return remoteProjects;
}
