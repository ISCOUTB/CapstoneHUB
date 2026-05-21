import Link from "next/link";
import { getProjects } from "../services/projects";
import { formatStatus } from "../services/utils";

export const dynamic = "force-dynamic";

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
          <div className="mb-6 border border-amber-200 bg-amber-50 p-5 text-amber-900">
            {error}
          </div>
        ) : null}

        {!error && projects.length === 0 ? (
          <div className="border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            No se encontraron proyectos aún.
          </div>
        ) : null}

        {!error && projects.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Nombre
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Lugar
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Proponente
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {projects.map((project) => {
                  const proposerName =
                    project.proposer?.type === "natural_person"
                      ? project.proposer.fullName
                      : project.proposer?.type === "legal_person"
                        ? project.proposer.legalName
                        : "Sin información";

                  const location = project.location || project.context || "Sin información";

                  return (
                    <tr key={project.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-slate-900 underline-offset-2 hover:underline"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{location}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{proposerName}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        <span className="inline-flex w-fit bg-blue-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
                          {formatStatus(project.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
