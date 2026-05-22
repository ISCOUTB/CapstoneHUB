"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus } from "../services/projects";
import Link from "next/link";
import { useAuth } from "./auth-provider";

const projectStatuses = [
  { value: "proposed", label: "Propuesto" },
  { value: "under_review", label: "En revisión" },
  { value: "approved", label: "Aprobado" },
  { value: "assigned", label: "Asignado" },
  { value: "in_progress", label: "En progreso" },
  { value: "closed", label: "Cerrado" },
  { value: "rejected", label: "Rechazado" },
] as const;

type ProjectStatusEditFormProps = {
  projectId: number;
  currentStatus: string;
};

export default function ProjectStatusEditForm({
  projectId,
  currentStatus,
}: ProjectStatusEditFormProps) {
  const router = useRouter();
  const { isAuthenticated, ready } = useAuth();
  const [status, setStatus] = useState(currentStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!ready) {
    return (
      <div className="w-full border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm text-slate-600">Cargando acceso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Actualizar estado del proyecto
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Inicia sesión para cambiar el estado de este proyecto.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center justify-center border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await updateProjectStatus(String(projectId), status);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado del proyecto",
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6 border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <label
          htmlFor="status"
          className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          Actualizar estado del proyecto
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-3 w-full border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
        >
          {projectStatuses.map((projectStatus) => (
            <option key={projectStatus.value} value={projectStatus.value}>
              {projectStatus.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {errorMessage ? (
        <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
