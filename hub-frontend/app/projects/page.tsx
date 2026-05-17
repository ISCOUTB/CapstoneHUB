import Link from "next/link";
import { getProjects } from "../services/projects";

export const dynamic = "force-dynamic";

function formatStatus(status: string): string {
  return status.replaceAll("_", " ");
}

export default async function ProjectsPage() {
  const { projects, error } = await getProjects();

  return (
    <main className="min-h-screen bg-gray-100 text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10 lg:px-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Lista de proyectos
            </h1>
          </div>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center justify-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            {error}
          </div>
        ) : null}

        {!error && projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            No se encontraron proyectos aún.
          </div>
        ) : null}

        <div className="grid gap-4">
          {projects.map((project) => (
            <article key={project.id} className="bg-gray-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    {project.name}
                  </h2>
                </div>
                <span className="inline-flex w-fit bg-blue-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
                  {formatStatus(project.status)}
                </span>
              </div>

              <div className="mt-4 bg-gray-100 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">
                    Proponente:{" "}
                  </span>
                  {project.name}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
