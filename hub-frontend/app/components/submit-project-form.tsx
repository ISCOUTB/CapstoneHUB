"use client";

import { useState } from "react";
import { createProject, CreateProjectPayload } from "../services/projects";

type FormState = {
  name: string;
  description: string;
  context: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  context: "",
};

export default function SubmitProjectForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    try {
      await createProject(form);
      setStatus("success");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create project",
      );
    }
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
          Context
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

      <button
        type="submit"
        disabled={status === "saving"}
        className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Submit project"}
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
