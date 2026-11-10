import { RiTeamLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

export interface ModuleHeaderProps {
  title: string;
  /** Categoría/contexto de la página. Ej: "Administración". */
  eyebrow?: string;
  /** Color del acento lateral que identifica el módulo. */
  accentColor?: string;
  /** Personas asignadas al equipo. Si se omite, no se muestra el contador. */
  teamSize?: number;
  className?: string;
}

/**
 * Header del módulo activo. Vive en el topbar claro, por eso usa los tokens de
 * superficie y el acento como barra vertical. `PageFrame` publica los datos y
 * el topbar lo renderiza.
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
        "flex min-w-0 items-center gap-2.5 sm:gap-3",
        className,
      )}
    >
      <span
        className="h-8 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      <div className="flex min-w-0 items-center gap-2">
        {eyebrow ? (
          <>
            <span className="hidden max-w-[14rem] truncate text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase sm:inline">
              {eyebrow}
            </span>
            <span
              className="hidden text-sm text-muted-foreground/50 sm:inline"
              aria-hidden="true"
            >
              /
            </span>
          </>
        ) : null}

        <h1 className="min-w-0 truncate text-base leading-tight font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h1>
      </div>

      {teamSize != null ? (
        <span
          className="ml-1 hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground md:inline-flex"
          aria-label={`${teamSize} ${
            teamSize === 1 ? "persona en el equipo" : "personas en el equipo"
          }`}
        >
          <RiTeamLine
            className="size-3.5 text-utb-blue"
            aria-hidden="true"
          />
          {teamSize} {teamSize === 1 ? "persona" : "personas"}
        </span>
      ) : null}
    </div>
  );
}

export default ModuleHeader;
