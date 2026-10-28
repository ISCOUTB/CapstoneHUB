import type { ReactNode } from "react";
import { RiTeamLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

export interface ModuleHeaderProps {
  title: ReactNode;
  /** Categoría/contexto de la página. Ej: "Administración". */
  eyebrow?: string;
  /** Color del acento lateral que identifica el módulo. */
  accentColor?: string;
  /** Personas asignadas al equipo. Si se omite, no se muestra el contador. */
  teamSize?: number;
  className?: string;
}

/**
 * Statusbar de módulo: barra plana con categoría y título, pegada bajo la
 * navbar. No es sticky; solo la navbar queda fija. Se renderiza dentro de
 * `PageFrame`, que aporta el ancho completo y las pestañas de usuario.
 */
export function ModuleHeader({
  title,
  eyebrow,
  accentColor = "rgba(37,99,235,0.42)",
  teamSize,
  className,
}: Readonly<ModuleHeaderProps>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-8 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {eyebrow ? (
            <>
              <span className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase sm:text-[11px] sm:tracking-[0.2em]">
                {eyebrow}
              </span>
              <span
                className="text-sm text-muted-foreground/60"
                aria-hidden="true"
              >
                /
              </span>
            </>
          ) : null}

          <h1 className="min-w-0 truncate text-lg leading-tight font-semibold tracking-tight text-foreground sm:text-xl">
            {title}
          </h1>
        </div>
      </div>

      {teamSize != null ? (
        <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:self-auto">
          <RiTeamLine className="size-4 text-utb-blue" aria-hidden="true" />
          <span>
            {teamSize}{" "}
            {teamSize === 1 ? "persona en el equipo" : "personas en el equipo"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default ModuleHeader;
