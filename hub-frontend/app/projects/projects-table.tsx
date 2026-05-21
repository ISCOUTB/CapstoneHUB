"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatStatus } from "../services/utils";
import { ProjectItem } from "../services/schemas";

type ProjectsTableProps = {
  projects: ProjectItem[];
};

function getProposerName(project: ProjectItem): string {
  if (project.proposer?.type === "natural_person") {
    return project.proposer.fullName;
  }

  if (project.proposer?.type === "legal_person") {
    return project.proposer.legalName;
  }

  return "Sin información";
}

function getLocation(project: ProjectItem): string {
  return project.location || project.context || "Sin información";
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return projects;
    }

    return projects.filter((project) =>
      project.name.toLowerCase().includes(normalizedSearch),
    );
  }, [projects, searchTerm]);

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white shadow-sm">
        <label
          htmlFor="project-search"
          className="lock text-sm font-medium text-slate-700"
        >
        </label>
        <input
          id="project-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Filtrar por nombre del proyecto"
          className="w-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
        />
      </div>

      {isSearching && filteredProjects.length === 0 ? (
        <div className="border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          No se encontraron proyectos que coincidan con la búsqueda.
        </div>
      ) : null}

      {filteredProjects.length > 0 ? (
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
              {filteredProjects.map((project) => {
                const proposerName = getProposerName(project);
                const location = getLocation(project);

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
    </div>
  );
}