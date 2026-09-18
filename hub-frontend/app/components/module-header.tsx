import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ModuleHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Etiqueta superior que diferencia cada módulo. Ej: "Gestión de proyectos". */
  eyebrow?: string;
  /** Color del glow y del orbe: da identidad propia a cada módulo. */
  accentColor?: string;
  /** Botones o acciones alineados a la derecha del título. */
  actions?: ReactNode;
  /** Contenido extra bajo el subtítulo (badges, metadatos…). */
  children?: ReactNode;
  className?: string;
}

/**
 * Header estándar de módulo: hero con degradado UTB, rejilla sutil, orbe
 * animado, eyebrow y título. Lo comparten todas las pantallas para que la app
 * se vea simétrica; la diferenciación es por `accentColor` / `eyebrow` / `title`.
 *
 * Las animaciones son CSS puro (`utb-rise`, `utb-orb` en globals.css), así que
 * el componente se renderiza en el servidor y respeta `prefers-reduced-motion`.
 */
export function ModuleHeader({
  title,
  subtitle,
  eyebrow,
  accentColor = "rgba(37,99,235,0.42)",
  actions,
  children,
  className,
}: ModuleHeaderProps) {
  return (
    <div
      className={cn(
        "utb-rise noise-overlay relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-utb-deep-blue via-utb-navy to-utb-blue/40 p-5 sm:p-8 lg:p-10",
        className
      )}
    >
      {/* Glow del acento */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 75% 65% at 70% 50%, ${accentColor} 0%, transparent 70%)`,
        }}
      />
      {/* Rejilla sutil */}
      <div className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60" />
      {/* Orbe flotante */}
      <div
        className="utb-orb pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: accentColor }}
      />

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p
              className="utb-rise mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-utb-blue-pale/70 uppercase sm:mb-2.5 sm:text-[11px] sm:tracking-[0.22em]"
              style={{ "--utb-delay": "50ms" } as React.CSSProperties}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {eyebrow}
            </p>
          ) : null}

          <h1
            className="utb-rise text-3xl leading-none font-bold tracking-tight text-white sm:text-5xl"
            style={{ "--utb-delay": "100ms" } as React.CSSProperties}
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              className="utb-rise mt-2.5 max-w-2xl text-[13px] leading-relaxed text-white/50 sm:mt-4 sm:text-sm"
              style={{ "--utb-delay": "200ms" } as React.CSSProperties}
            >
              {subtitle}
            </p>
          ) : null}

          {children ? (
            <div
              className="utb-rise mt-4 flex flex-wrap items-center gap-2.5"
              style={{ "--utb-delay": "260ms" } as React.CSSProperties}
            >
              {children}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div
            className="utb-rise flex shrink-0 flex-wrap items-center gap-2.5"
            style={{ "--utb-delay": "300ms" } as React.CSSProperties}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ModuleHeader;
