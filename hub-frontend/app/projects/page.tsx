import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ProjectProposer =
  | {
      type: 'natural_person';
      fullName: string;
      idNumber: string;
      age: number;
      email: string;
    }
  | {
      type: 'legal_entity';
      legalName: string;
      taxId: string;
      email: string;
      phone: string;
      contactUrl?: string;
    };

type ProjectActor = {
  actorId: string;
  fullName: string;
  email?: string;
  role: string;
};

type ProjectItem = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  proposer: ProjectProposer;
  actors: ProjectActor[];
};

async function getProjects(): Promise<{ projects: ProjectItem[]; error?: string }> {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '');

  if (!backendUrl) {
    return {
      projects: [],
      error: 'Define BACKEND_URL, for example http://localhost:3000',
    };
  }

  try {
    const response = await fetch(`${backendUrl}/projects`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        projects: [],
        error: `Backend responded with status ${response.status}`,
      };
    }

    const data = (await response.json()) as ProjectItem[];
    return {
      projects: Array.isArray(data) ? data : [],
    };
  } catch {
    return {
      projects: [],
      error: 'Unable to reach the backend projects endpoint',
    };
  }
}

function formatStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

function getProposerLabel(proposer: ProjectProposer): string {
  return proposer.type === 'legal_entity' ? proposer.legalName : proposer.fullName;
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
            <article
              key={project.id}
              className="bg-gray-200 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{project.projectCode}</p>
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
                  <span className="font-medium text-slate-700">Proponente: </span>
                  {getProposerLabel(project.proposer)}
                </p>
                <p className="mt-2">
                  <span className="font-medium text-slate-700">Actores: </span>
                  {project.actors.length > 0
                    ? project.actors.map((actor) => actor.fullName).join(', ')
                    : 'No actors assigned yet'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
