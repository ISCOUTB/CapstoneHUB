"use client";

import { Button } from "@/components/ui/button";
import ListSearchInput from "../components/list-search-input";
import SortPopover from "../components/sort-popover";
import {
  GALLERY_SORT_OPTIONS,
  type GalleryFilters,
} from "./gallery-filters";

type GalleryToolbarProps = {
  readonly filters: GalleryFilters;
  readonly onFiltersChange: (filters: GalleryFilters) => void;
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
};

export default function GalleryToolbar({
  filters,
  onFiltersChange,
  hasActiveFilters,
  onClearFilters,
}: GalleryToolbarProps) {
  return (
    <div className="mb-4 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-utb-blue/10">
      <div className="flex flex-col gap-3">
        <ListSearchInput
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Buscar en la galería..."
          ariaLabel="Buscar en la galería"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
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
