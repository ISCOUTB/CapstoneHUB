import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeaderSync } from "./page-header-context";

type PageFrameProps = {
  eyebrow?: string;
  title: string;
  accentColor?: string;
  teamSize?: number;
  maxWidth?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Contenedor de las páginas internas. Publica el header del módulo para que el
 * topbar lo renderice (categoría, título y equipo) y deja el contenido con el
 * ancho y el padding estándar.
 */
export default function PageFrame({
  eyebrow,
  title,
  accentColor,
  teamSize,
  maxWidth = "max-w-[96rem]",
  className,
  children,
}: Readonly<PageFrameProps>) {
  return (
    <main className="flex-1 text-foreground">
      <PageHeaderSync
        eyebrow={eyebrow}
        title={title}
        accentColor={accentColor}
        teamSize={teamSize}
      />

      <section
        className={cn(
          "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
          maxWidth,
          className,
        )}
      >
        {children}
      </section>
    </main>
  );
}
