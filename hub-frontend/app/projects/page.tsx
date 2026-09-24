import Link from "next/link";
import { RiAddLine } from "@remixicon/react";
import ModuleHeader from "../components/module-header";
import ProjectsExplorer from "./projects-explorer";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ModuleHeader
          eyebrow="Gestión de proyectos"
          title="Lista de proyectos"
          subtitle="Consulta los proyectos Capstone que puedes ver: los finalizados y públicos, los que propusiste y los que tienes asignados."
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

        <ProjectsExplorer />
      </section>
    </main>
  );
}
