"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects } from "../services/projects";
import { ProjectItem } from "../services/schemas";
import ProjectsTable from "./projects-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsExplorer() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);

        const {
          projects: nextProjects,
          error: nextError,
          status: nextStatus,
        } = await getProjects();

        if (!active) {
          return;
        }

        setProjects(nextProjects);
        setError(nextError ?? null);
        setStatus(nextStatus);
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

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (status === 401) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-start gap-4">
          <div>
            <p className="font-semibold">Inicia sesión para ver los proyectos</p>
            <p className="text-sm text-muted-foreground">
              Solo los proyectos finalizados y públicos se pueden consultar sin
              cuenta. Inicia sesión para ver tus proyectos propuestos y
              asignados.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/login">Iniciar sesión</Link>}
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Empty className="rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
        <EmptyHeader>
          <EmptyTitle>No hay proyectos</EmptyTitle>
          <EmptyDescription>
            No se encontraron proyectos visibles para tu cuenta. Propón uno nuevo
            para empezar.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <ProjectsTable projects={projects} />;
}
