"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import FilterCheckbox from "../components/filter-checkbox";
import {
  PROJECT_SOURCE_OPTIONS,
  toggleFilterValue,
  type FilterOption,
} from "../projects/project-list-config";
import type { GalleryFilters } from "./gallery-filters";

type GalleryFilterSidebarProps = {
  readonly filters: GalleryFilters;
  readonly onFiltersChange: (filters: GalleryFilters) => void;
  readonly yearOptions: FilterOption[];
  readonly yearsLoading: boolean;
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
  readonly className?: string;
};

export default function GalleryFilterSidebar({
  filters,
  onFiltersChange,
  yearOptions,
  yearsLoading,
  hasActiveFilters,
  onClearFilters,
  className,
}: GalleryFilterSidebarProps) {
  const activeCount = filters.source.length + filters.year.length;

  function toggleSource(value: string) {
    onFiltersChange({
      ...filters,
      source: toggleFilterValue(filters.source, value),
    });
  }

  function toggleYear(value: string) {
    onFiltersChange({
      ...filters,
      year: toggleFilterValue(filters.year, value),
    });
  }

  return (
    <aside
      className={cn("lg:sticky lg:top-20 lg:w-72 lg:shrink-0", className)}
      aria-label="Filtros rápidos de la galería"
    >
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-utb-blue/10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">
            Filtros rápidos
          </h2>

          {activeCount > 0 ? (
            <Badge variant="secondary">{activeCount}</Badge>
          ) : null}
        </div>

        <Separator className="my-4" />

        <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          Fuente
        </p>

        <div className="mt-2.5 flex flex-col gap-2.5">
          {PROJECT_SOURCE_OPTIONS.map((option) => (
            <FilterCheckbox
              key={option.value}
              id={`gallery-source-${option.value}`}
              label={option.label}
              checked={filters.source.includes(option.value)}
              onChange={() => toggleSource(option.value)}
            />
          ))}
        </div>

        <Separator className="my-4" />

        <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          Año
        </p>

        {yearsLoading && yearOptions.length === 0 ? (
          <p className="mt-2.5 text-xs text-muted-foreground">
            Cargando años…
          </p>
        ) : yearOptions.length > 0 ? (
          <div className="mt-2.5 flex flex-col gap-2.5">
            {yearOptions.map((option) => (
              <FilterCheckbox
                key={option.value}
                id={`gallery-year-${option.value}`}
                label={option.label}
                checked={filters.year.includes(option.value)}
                onChange={() => toggleYear(option.value)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2.5 text-xs text-muted-foreground">
            No hay años disponibles.
          </p>
        )}

        {hasActiveFilters ? (
          <>
            <Separator className="my-4" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onClearFilters}
            >
              Limpiar filtros
            </Button>
          </>
        ) : null}
      </div>
    </aside>
  );
}
