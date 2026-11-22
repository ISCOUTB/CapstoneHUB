"use client";

import { Button } from "@/components/ui/button";
import FilterPopover from "../components/filter-popover";
import ListSearchInput from "../components/list-search-input";
import SortPopover from "../components/sort-popover";
import {
  PROJECT_SOURCE_OPTIONS,
  type FilterOption,
} from "../projects/project-list-config";
import {
  GALLERY_SORT_OPTIONS,
  type GalleryFilters,
} from "./gallery-filters";

type GalleryToolbarProps = {
  readonly filters: GalleryFilters;
  readonly yearOptions: FilterOption[];
  readonly onFiltersChange: (filters: GalleryFilters) => void;
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
};

export default function GalleryToolbar({
  filters,
  yearOptions,
  onFiltersChange,
  hasActiveFilters,
  onClearFilters,
}: GalleryToolbarProps) {
  return (
    <div className="mb-4 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-utb-blue/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <ListSearchInput
            value={filters.search}
            onChange={(search) => onFiltersChange({ ...filters, search })}
            placeholder="Buscar en la galería..."
            ariaLabel="Buscar en la galería"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPopover
            label="Fuente"
            options={PROJECT_SOURCE_OPTIONS}
            selected={filters.source}
            onChange={(source) => onFiltersChange({ ...filters, source })}
          />

          <FilterPopover
            label="Año"
            options={yearOptions}
            selected={filters.year}
            onChange={(year) => onFiltersChange({ ...filters, year })}
          />

          <SortPopover
            value={filters.sort}
            options={GALLERY_SORT_OPTIONS}
            onChange={(sort) => onFiltersChange({ ...filters, sort })}
          />

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
