import Link from "next/link";
import SubmitProjectForm from "../../components/submit-project-form";

export default function SubmitNaturalProjectPage() {
  return (
    <main className="min-h-screen bg-gray-100 text-slate-900">
      <section className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-10 lg:px-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Proponer un proyecto
            </h1>
            <p className="text-sm text-slate-600">Persona natural</p>
          </div>

          <Link
            href="/submit"
            className="inline-flex shrink-0 items-center justify-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver
          </Link>
        </div>

        <SubmitProjectForm />
      </section>
    </main>
  );
}
