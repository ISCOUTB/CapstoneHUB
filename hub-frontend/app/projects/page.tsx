import Link from "next/link";
import { RiAddLine } from "@remixicon/react";
import { getProjects } from "../services/projects";
import ModuleHeader from "../components/module-header";
import ProjectsTable from "@/app/projects/projects-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { projects, error } = await getProjects();

  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ModuleHeader
          eyebrow="Gestión de proyectos"
          title="Lista de proyectos"
          subtitle="Consulta todos los proyectos Capstone registrados, su estado actual y los actores asignados a cada uno."
          actions={
            <Link
              href="/submit"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-semibold text-utb-deep-blue shadow-lg shadow-utb-deep-blue/20 transition-colors hover:bg-utb-blue-pale focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <RiAddLine className="size-4" aria-hidden="true" />
              Proponer proyecto
            </Link>
          }
        />

        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!error && projects.length === 0 ? (
          <Empty className="rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
            <EmptyHeader>
              <EmptyTitle>No hay proyectos</EmptyTitle>
              <EmptyDescription>
                No se encontraron proyectos aún.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {!error && projects.length > 0 ? (
          <ProjectsTable projects={projects} />
        ) : null}
      </section>
    </main>
  );
}
