import type { CSSProperties } from "react";
import Link from "next/link";
import {
  RiArrowRightLine,
  RiMapPinLine,
  RiUser3Line,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProjectYear } from "../projects/project-list-config";
import type { ProjectItem } from "../services/schemas";
import { formatProjectSource, formatStatus } from "../services/utils";

type GalleryCardProps = {
  readonly project: ProjectItem;
  readonly index: number;
};

export default function GalleryCard({
  project,
  index,
}: GalleryCardProps) {
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
          } as CSSProperties
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
