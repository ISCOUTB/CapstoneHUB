"use client";

import { useMemo } from "react";
import { RiLayoutRowLine, RiMenuLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { type ProjectItem } from "../services/schemas";
import FilterPopover from "../components/filter-popover";
import ListSearchInput from "../components/list-search-input";
import SortPopover from "../components/sort-popover";
import {
  LEGALIZATION_OPTIONS,
  PROJECT_SORT_OPTIONS,
  PROJECT_SOURCE_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  buildYearOptions,
  type ProjectDensity,
  type ProjectListFilters,
} from "./project-list-config";

type ProjectListToolbarProps = {
  readonly projects: ProjectItem[];
  readonly filters: ProjectListFilters;
  readonly onFiltersChange: (filters: ProjectListFilters) => void;
  readonly density: ProjectDensity;
  readonly onDensityChange: (density: ProjectDensity) => void;
  readonly onClearFilters: () => void;
};

export default function ProjectListToolbar({
  projects,
  filters,
  onFiltersChange,
  density,
  onDensityChange,
  onClearFilters,
}: ProjectListToolbarProps) {
  const proposerOptions = useMemo(() => {
    const names = new Set(
      projects
        .map((project) => project.proposer?.fullName)
        .filter((name): name is string => Boolean(name)),
    );

    return Array.from(names)
      .sort((left, right) => left.localeCompare(right, "es"))
      .map((name) => ({ value: name, label: name }));
  }, [projects]);

  const yearOptions = useMemo(() => buildYearOptions(projects), [projects]);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status.length > 0 ||
    filters.proposer.length > 0 ||
    filters.source.length > 0 ||
    filters.legalization.length > 0 ||
    filters.year.length > 0 ||
    filters.assignedToMe ||
    filters.proposedByMe ||
    filters.hasTeam ||
    filters.privateOnly ||
    filters.sort !== "relevance";

  function updateFilters(partial: Partial<ProjectListFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <div className="mb-4 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-utb-blue/10">
      <div className="flex flex-col gap-3">
        <ListSearchInput
          value={filters.search}
          onChange={(search) => updateFilters({ search })}
          placeholder="Buscar proyectos..."
          ariaLabel="Buscar proyectos"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <FilterPopover
              label="Estado"
              options={PROJECT_STATUS_OPTIONS}
              selected={filters.status}
              onChange={(status) => updateFilters({ status })}
            />

            <FilterPopover
              label="Proponente"
              options={proposerOptions}
              selected={filters.proposer}
              onChange={(proposer) => updateFilters({ proposer })}
              searchable
            />

            <FilterPopover
              label="Fuente"
              options={PROJECT_SOURCE_OPTIONS}
              selected={filters.source}
              onChange={(source) => updateFilters({ source })}
            />

            <FilterPopover
              label="Legalización"
              options={LEGALIZATION_OPTIONS}
              selected={filters.legalization}
              onChange={(legalization) =>
                updateFilters({ legalization })
              }
            />

            <FilterPopover
              label="Año"
              options={yearOptions}
              selected={filters.year}
              onChange={(year) => updateFilters({ year })}
            />

            <SortPopover
              value={filters.sort}
              options={PROJECT_SORT_OPTIONS}
              onChange={(sort) => updateFilters({ sort })}
              placeholderValue="relevance"
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

          <div className="shrink-0 self-end sm:self-auto">
            <ToggleGroup
              value={[density]}
              onValueChange={(values) => {
                const nextValue = values[0];

                if (
                  nextValue === "comfortable" ||
                  nextValue === "compact"
                ) {
                  onDensityChange(nextValue);
                }
              }}
              variant="outline"
              aria-label="Densidad de la lista"
            >
              <ToggleGroupItem
                value="comfortable"
                aria-label="Vista cómoda"
                title="Vista cómoda"
                className="aria-pressed:border-utb-blue aria-pressed:bg-utb-blue aria-pressed:text-white aria-pressed:hover:bg-utb-blue-dark"
              >
                <RiLayoutRowLine className="size-4" aria-hidden="true" />
              </ToggleGroupItem>

              <ToggleGroupItem
                value="compact"
                aria-label="Vista compacta"
                title="Vista compacta"
                className="aria-pressed:border-utb-blue aria-pressed:bg-utb-blue aria-pressed:text-white aria-pressed:hover:bg-utb-blue-dark"
              >
                <RiMenuLine className="size-4" aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
