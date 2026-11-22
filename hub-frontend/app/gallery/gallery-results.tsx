"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { isServiceUnavailableStatus } from "@/lib/http";
import ServiceUnavailable from "../components/service-unavailable";
import type { ProjectItem } from "../services/schemas";
import GalleryCard from "./gallery-card";
import GallerySkeleton from "./gallery-skeleton";

type GalleryResultsProps = {
  readonly projects: ProjectItem[];
  readonly loading: boolean;
  readonly status?: number;
  readonly error: string | null;
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
  readonly onRetry: () => void;
};

export default function GalleryResults({
  projects,
  loading,
  status,
  error,
  hasActiveFilters,
  onClearFilters,
  onRetry,
}: GalleryResultsProps) {
  if (loading) {
    return <GallerySkeleton />;
  }

  if (isServiceUnavailableStatus(status)) {
    return <ServiceUnavailable message={error} onRetry={onRetry} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar la galería</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Empty className="rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
        <EmptyHeader>
          <EmptyTitle>
            {hasActiveFilters
              ? "No hay proyectos con esos filtros"
              : "Aún no hay proyectos finalizados"}
          </EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? "Prueba a cambiar la búsqueda o a limpiar los filtros seleccionados."
              : "La galería se llenará a medida que los proyectos cierren su ciclo."}
          </EmptyDescription>
        </EmptyHeader>

        {hasActiveFilters ? (
          <EmptyContent>
            <Button variant="outline" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }

  return (
    <>
      <p className="px-1 pb-2 text-xs text-muted-foreground">
        {projects.length}{" "}
        {projects.length === 1 ? "proyecto" : "proyectos"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, index) => (
          <GalleryCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </>
  );
}
