import Link from "next/link";
import SubmitCard from "../components/submit-card";

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-gray-100 text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10 lg:px-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Proponer un proyecto
            </h1>
          </div>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center justify-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SubmitCard
            title="Persona Natural"
            description="desc..."
            href="/submit/natural"
          />
          <SubmitCard
            title="Persona Jurídica"
            description="(no disponible)"
            disabled
          />
        </div>
      </section>
    </main>
  );
}
