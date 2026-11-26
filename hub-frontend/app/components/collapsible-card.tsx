"use client";

import { useId, type ReactNode } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CollapsibleCardProps = {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Insignias que acompañan al título y siguen visibles al contraer. */
  readonly badges?: ReactNode;
  /** Acciones del encabezado que no dependen del contenido desplegado. */
  readonly actions?: ReactNode;
  readonly expanded: boolean;
  readonly onExpandedChange: (expanded: boolean) => void;
  /** Texto para el lector de pantalla, por ejemplo "la entrega Avance 1". */
  readonly toggleLabel: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly contentClassName?: string;
};

/**
 * Tarjeta con encabezado siempre visible y contenido desplegable. El botón del
 * chevrón controla el panel con `aria-expanded` y `aria-controls`.
 */
export default function CollapsibleCard({
  title,
  description,
  badges,
  actions,
  expanded,
  onExpandedChange,
  toggleLabel,
  children,
  className,
  contentClassName,
}: CollapsibleCardProps) {
  const panelId = useId();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="whitespace-normal">{title}</CardTitle>
              {badges}
            </div>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={`${expanded ? "Contraer" : "Expandir"} ${toggleLabel}`}
              onClick={() => onExpandedChange(!expanded)}
            >
              <RiArrowDownSLine
                className={cn(
                  "transition-transform motion-reduce:transition-none",
                  expanded && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent id={panelId} hidden={!expanded} className={contentClassName}>
        {children}
      </CardContent>
    </Card>
  );
}
