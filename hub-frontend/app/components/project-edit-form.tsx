"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { canManageProject } from "../services/permissions";
import { updateProject } from "../services/projects";

type ProjectEditFormProps = {
  projectId: number;
  name: string;
  description: string;
  context: string;
};

export default function ProjectEditForm({
  projectId,
  name,
  description,
  context,
}: ProjectEditFormProps) {
  const router = useRouter();
  const { session, ready } = useAuth();
  const [projectName, setProjectName] = useState(name);
  const [projectDescription, setProjectDescription] = useState(description);
  const [projectContext, setProjectContext] = useState(context);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!ready || !canManageProject(session?.user.roles)) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!projectName.trim() || !projectDescription.trim() || !projectContext.trim()) {
      setErrorMessage("Nombre, descripción y contexto son obligatorios.");
      return;
    }

    startTransition(async () => {
      try {
        await updateProject(projectId, {
          name: projectName.trim(),
          description: projectDescription.trim(),
          context: projectContext.trim(),
        });
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el proyecto",
        );
      }
    });
  }

  return (
    <details className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Editar información del proyecto
      </summary>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Nombre
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Descripción
          <textarea
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            rows={4}
            className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Contexto
          <textarea
            value={projectContext}
            onChange={(event) => setProjectContext(event.target.value)}
            rows={4}
            className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar información"}
        </button>
        {errorMessage ? (
          <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </details>
  );
}
