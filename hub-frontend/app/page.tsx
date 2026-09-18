import Link from "next/link";
import {
  RiArrowRightLine,
  RiFileCheckLine,
  RiFlagLine,
  RiTeamLine,
} from "@remixicon/react";

const FEATURES = [
  {
    icon: RiFileCheckLine,
    title: "Administración integral",
    description:
      "Propuestas, hitos, informes y anexos de cada proyecto de titulación en un único expediente.",
  },
  {
    icon: RiFlagLine,
    title: "Seguimiento y evaluación",
    description:
      "Estados, historial de cambios y observaciones que dejan trazabilidad de todo el ciclo del proyecto.",
  },
  {
    icon: RiTeamLine,
    title: "Coordinación entre actores",
    description:
      "Estudiantes, asesores, evaluadores y coordinadores trabajando sobre la misma información.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero institucional UTB */}
      <section className="noise-overlay relative overflow-hidden bg-gradient-to-br from-utb-deep-blue via-utb-navy to-utb-blue/40">
        <div className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60" />
        <div className="utb-orb pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-utb-blue/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-utb-blue-light/10 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <p
              className="utb-rise flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-utb-blue-pale/70 uppercase sm:text-[11px] sm:tracking-[0.22em]"
              style={{ "--utb-delay": "50ms" } as React.CSSProperties}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Universidad Tecnológica de Bolívar
            </p>

            <h1
              className="utb-rise text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ "--utb-delay": "100ms" } as React.CSSProperties}
            >
              Gestión de proyectos{" "}
              <span className="bg-gradient-to-r from-utb-blue-light to-utb-blue-pale bg-clip-text text-transparent">
                Capstone
              </span>
            </h1>

            <p
              className="utb-rise max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg"
              style={{ "--utb-delay": "180ms" } as React.CSSProperties}
            >
              CapstoneHUB apoya la gestión integral de los proyectos que permiten
              a los estudiantes aplicar sus conocimientos académicos a situaciones
              del mundo real, a menudo en colaboración con empresas en entornos de
              ingeniería aplicada.
            </p>

            <p
              className="utb-rise max-w-2xl text-sm leading-relaxed text-white/45"
              style={{ "--utb-delay": "240ms" } as React.CSSProperties}
            >
              Su propósito es facilitar la administración, seguimiento y
              evaluación de los proyectos de titulación, optimizando los recursos
              disponibles y mejorando la coordinación entre los distintos actores
              involucrados.
            </p>

            <div
              className="utb-rise mt-2 flex flex-col gap-3 sm:flex-row"
              style={{ "--utb-delay": "320ms" } as React.CSSProperties}
            >
              <Link
                href="/projects"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-utb-blue px-6 text-sm font-semibold text-white shadow-lg shadow-utb-blue/30 transition-all hover:bg-utb-blue-dark hover:shadow-xl hover:shadow-utb-blue/40 focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
              >
                Ver lista de proyectos
                <RiArrowRightLine
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/submit"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
              >
                Proponer un proyecto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Qué resuelve la plataforma */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className="utb-rise hover-lift rounded-2xl bg-card p-5 shadow-sm ring-1 ring-utb-blue/10"
              style={
                { "--utb-delay": `${index * 80}ms` } as React.CSSProperties
              }
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-utb-blue/10">
                <Icon className="size-5 text-utb-blue" aria-hidden="true" />
              </div>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
