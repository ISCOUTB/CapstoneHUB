"use client";

import Link from "next/link";
import {
  RiArrowRightLine,
  RiMapPinLine,
  RiUser3Line,
} from "@remixicon/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { isServiceUnavailableStatus } from "@/lib/http";
import { useApiResource } from "@/lib/use-api-resource";
import ServiceUnavailable from "../components/service-unavailable";
import { getProjects } from "../services/projects";
import { type ProjectItem } from "../services/schemas";
import { formatProjectSource, formatStatus } from "../services/utils";
import { getProjectYear } from "../projects/project-list-config";

/** Tope de la API para un único lote; la galería no pagina en esta versión. */
const GALLERY_LIMIT = 100;

function GalleryCard({
  project,
  index,
}: Readonly<{ project: ProjectItem; index: number }>) {
  const year = getProjectYear(project);

  return (
    <Link
      href={`/projects/${project.id}`}
      aria-label={`Ver el proyecto ${project.name}`}
      className="group block h-full rounded-2xl focus-visible:ring-2 focus-visible:ring-utb-blue/50 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card
        className="utb-rise hover-lift h-full"
        style={
          {
            "--utb-delay": `${Math.min(index, 8) * 60}ms`,
          } as React.CSSProperties
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">{formatStatus(project.status)}</Badge>

            {year ? (
              <span className="text-xs text-muted-foreground">{year}</span>
            ) : null}
          </div>

          <CardTitle className="line-clamp-2 transition-colors group-hover:text-utb-blue">
            {project.name}
          </CardTitle>

          <CardDescription className="line-clamp-3">
            {project.description || "Sin descripción disponible."}
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-auto">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {project.proposer?.fullName ? (
              <span className="inline-flex items-center gap-1">
                <RiUser3Line className="size-3.5" aria-hidden="true" />
                {project.proposer.fullName}
              </span>
            ) : null}

            {project.location ? (
              <span className="inline-flex items-center gap-1">
                <RiMapPinLine className="size-3.5" aria-hidden="true" />
                {project.location}
              </span>
            ) : null}

            {project.source ? (
              <Badge variant="outline">
                {formatProjectSource(project.source)}
              </Badge>
            ) : null}
          </div>

          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-utb-blue opacity-0 transition-opacity group-focus-visible:opacity-100 group-hover:opacity-100">
            Ver detalle
            <RiArrowRightLine className="size-3.5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function GalleryExplorer() {
  const { data, loading, error, reload } = useApiResource(
    () =>
      getProjects({
        status: ["closed"],
        isPrivate: false,
        sort: "year-desc",
        limit: GALLERY_LIMIT,
      }),
    [],
  );

  const projects = data?.projects ?? [];
  const status = data?.status;
  const loadError = data?.error ?? error ?? null;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isServiceUnavailableStatus(status)) {
    return <ServiceUnavailable message={loadError} onRetry={reload} />;
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar la galería</AlertTitle>
        <AlertDescription>
          {loadError}
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={reload}>
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
          <EmptyTitle>Aún no hay proyectos finalizados</EmptyTitle>
          <EmptyDescription>
            La galería se llenará a medida que los proyectos cierren su ciclo.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <GalleryCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
