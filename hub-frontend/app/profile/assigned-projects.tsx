"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyProjects } from "../services/projects";
import { MyProject } from "../services/schemas";
import { formatRole, formatStatus } from "../services/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function AssignedProjects() {
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);

        const { projects: nextProjects, error: nextError } =
          await getMyProjects();

        if (!active) {
          return;
        }

        setProjects(nextProjects);
        setError(nextError ?? null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis proyectos</CardTitle>
        <CardDescription>
          {loading
            ? "Cargando proyectos..."
            : projects.length === 0
              ? "Aún no propones ni participas en ningún proyecto."
              : `${projects.length} proyecto(s) propuesto(s) o asignado(s).`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : projects.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Sin proyectos</EmptyTitle>
              <EmptyDescription>
                Cuando propongas un proyecto o te asignen a uno aparecerá aquí.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Proyecto</TableHead>
                <TableHead>Mi vínculo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inicio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="transition-colors hover:bg-utb-blue/[0.04]">
                  <TableCell className="font-medium">
                    <Button
                      variant="link"
                      className="h-auto justify-start p-0 font-medium"
                      nativeButton={false}
                      render={
                        <Link href={`/projects/${project.id}`}>
                          {project.name}
                        </Link>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {project.myRole ? (
                      <Badge variant="outline">
                        {formatRole(project.myRole)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Proponente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatStatus(project.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(project.startDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
