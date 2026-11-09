import Link from "next/link";
import { UtbLogo } from "./utb-logo";
import { cn } from "@/lib/utils";

/**
 * Marca institucional de CapstoneHUB. Vive en la cabecera de la sidebar (fondo
 * oscuro) y, cuando la sidebar no está disponible (login y registro), en el
 * topbar claro.
 */
export function Brand({
  variant = "dark",
  className,
  logoClassName,
  onNavigate,
}: Readonly<{
  variant?: "dark" | "light";
  className?: string;
  logoClassName?: string;
  onNavigate?: () => void;
}>) {
  const isLight = variant === "light";

  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none",
        isLight
          ? "focus-visible:ring-utb-blue/40"
          : "focus-visible:ring-utb-blue-pale/60",
        className,
      )}
    >
      <UtbLogo
        className={cn(
          "h-7 w-auto sm:h-8",
          isLight ? "text-utb-blue" : "text-white",
          logoClassName,
        )}
      />

      <span
        className={cn(
          "h-6 w-px shrink-0 sm:h-7",
          isLight ? "bg-border" : "bg-white/20",
        )}
        aria-hidden="true"
      />

      <span
        className={cn(
          "text-base font-bold tracking-tight whitespace-nowrap sm:text-lg",
          isLight ? "text-foreground" : "text-white",
        )}
      >
        Capstone
        <span className={isLight ? "text-utb-blue" : "text-utb-blue-pale"}>
          HUB
        </span>
      </span>
    </Link>
  );
}

export default Brand;
