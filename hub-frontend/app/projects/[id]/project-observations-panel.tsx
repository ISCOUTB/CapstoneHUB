"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectObservation } from "../../services/projects";
import { ProjectObservationItem } from "../../services/schemas";

type ProjectObservationsPanelProps = {
  projectId: number;
  observations: ProjectObservationItem[];
};

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export default function ProjectObservationsPanel({
  projectId,
  observations,
}: ProjectObservationsPanelProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedObservations = useMemo(
    () => [...observations].sort((left, right) => right.id - left.id),
    [observations],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setErrorMessage("Escribe una observación antes de guardar.");
      return;
    }

    startTransition(async () => {
      try {
        await createProjectObservation(String(projectId), trimmedContent);
        setContent("");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la observación",
        );
      }
    });
  }

  return (
    <section className="mt-6 border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Observaciones
          </h2>
          <p className="mt-2 text-slate-600">
            Agrega notas cortas sobre decisiones, avances o bloqueos.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sortedObservations.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No hay observaciones todavía.
          </div>
        ) : (
          sortedObservations.map((observation) => (
            <article
              key={observation.id}
              className="border border-slate-200 bg-slate-50 p-4"
            >
              <p className="whitespace-pre-line text-sm text-slate-700">
                {observation.content}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {formatDate(observation.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="observation"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500"
          >
            Nueva observación
          </label>
          <textarea
            id="observation"
            name="observation"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            className="mt-3 w-full border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
            placeholder="Escribe una observación sobre este proyecto"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Guardando..." : "Agregar observación"}
          </button>
        </div>

        {errorMessage ? (
          <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}
