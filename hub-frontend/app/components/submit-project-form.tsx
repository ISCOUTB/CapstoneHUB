"use client";

import Link from "next/link";
import { useState } from "react";
import { createProject } from "../services/projects";
import { useAuth } from "./auth-provider";

type FormState = {
  name: string;
  namep: string;
  ncedua: string;
  age: number | "";
  correo: string;
  description: string;
  context: string;
  location: string;
  startDate: string;
  executiontime: string;
  estimatedCost: number | "";
};

const initialForm: FormState = {
  name: "",
  namep: "",
  ncedua: "",
  age: "",
  correo: "",
  description: "",
  context: "",
  location: "",
  startDate: "",
  executiontime: "",
  estimatedCost: "",
};

export default function SubmitProjectForm() {
  const { isAuthenticated, ready } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    if (name === "age") {
      if (!/^\d*$/.test(value) || value.length > 2) return;
    }

    if (name === "ncedua") {
      if (!/^\d*$/.test(value) || value.length > 10) return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "age" || name === "estimatedCost"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    try {
      await createProject({
        ...form,
        age: Number(form.age),
        estimatedCost: Number(form.estimatedCost),
      });

      setStatus("success");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create project",
      );
    }
  }

  if (!ready) {
    return (
      <div className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm text-slate-600">Cargando acceso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Proponer un proyecto
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Inicia sesión para proponer nuevos proyectos.
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Project name
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="namep" className="text-sm font-medium text-slate-700">
          Responsable name
        </label>
        <input
          id="namep"
          name="namep"
          value={form.namep}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ncedua" className="text-sm font-medium text-slate-700">
          Cedula number
        </label>
        <input
          id="ncedua"
          name="ncedua"
          type="text"
          inputMode="numeric"
          maxLength={10}
          value={form.ncedua}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="correo" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          id="correo"
          name="correo"
          value={form.correo}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="context" className="text-sm font-medium text-slate-700">
          Justificación
        </label>
        <textarea
          id="context"
          name="context"
          value={form.context}
          onChange={handleChange}
          rows={4}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="location"
          className="text-sm font-medium text-slate-700"
        >
          Locación
        </label>
        <input
          id="location"
          name="location"
          value={form.location}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="startDate"
          className="text-sm font-medium text-slate-700"
        >
          Tiempo estimado de inicio
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="executiontime"
          className="text-sm font-medium text-slate-700"
        >
          Tiempo estimado de duracion
        </label>
        <input
          id="executiontime"
          name="executiontime"
          value={form.executiontime}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="estimatedCost"
          className="text-sm font-medium text-slate-700"
        >
          Costo estimado
        </label>
        <input
          type="number"
          id="estimatedCost"
          name="estimatedCost"
          value={form.estimatedCost}
          onChange={handleChange}
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Proponer"}
      </button>

      {status === "success" && (
        <p className="text-sm text-green-600">Project created.</p>
      )}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </form>
  );
}
