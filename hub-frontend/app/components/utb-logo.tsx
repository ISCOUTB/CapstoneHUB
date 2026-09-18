/**
 * Isotipo UTB vectorial inline: nítido a cualquier tamaño, colorable vía
 * `currentColor` y sin request HTTP extra. Se usa en la barra de navegación y
 * en las superficies oscuras de la plataforma.
 */

import { cn } from "@/lib/utils";

export interface UtbLogoProps {
  /** Ancho en px. Si se omite, el tamaño lo define `className` (h-… w-auto). */
  size?: number;
  /** Color de relleno. Por defecto hereda con `currentColor`. */
  color?: string;
  className?: string;
}

// viewBox del trazo original del isotipo "utb".
const VIEW = { w: 95, h: 46 } as const;

const MARK_PATH =
  "M90.2485 22.7944C90.1727 22.8068 90.1727 22.9133 90.2485 22.9258C92.7074 23.3212 94.5906 25.4646 94.5906 28.049V41.8616C94.5906 43.7768 93.0477 45.3186 91.1467 45.3186H60.6653V25.1175H80.4471V20.6704H56.1592V45.3186H38.5595V20.6704H33.9088V41.8616C33.9088 43.7713 32.3673 45.3186 30.4649 45.3186H3.44392C1.54287 45.3186 0 43.7754 0 41.8616V3.77557C0 1.86732 1.54287 0.318604 3.44392 0.318604H14.6504V30.4938H19.3025V0.318604H91.1453C93.0477 0.318604 94.5892 1.86732 94.5892 3.77557V17.6753C94.5892 20.2598 92.7074 22.3989 90.2471 22.793";

export function UtbLogo({ size, color = "currentColor", className }: UtbLogoProps) {
  const dims =
    size != null ? { width: size, height: size * (VIEW.h / VIEW.w) } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      fill="none"
      role="img"
      aria-label="Universidad Tecnológica de Bolívar"
      className={cn("shrink-0", className)}
      {...dims}
    >
      <path d={MARK_PATH} fill={color} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

export default UtbLogo;
