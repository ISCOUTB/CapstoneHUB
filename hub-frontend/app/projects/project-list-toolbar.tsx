"use client";

import { useId, useMemo, useState } from "react";
import {
  RiArrowDownSLine,
  RiLayoutRowLine,
  RiMenuLine,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { type ProjectItem } from "../services/schemas";
import ListSearchInput from "../components/list-search-input";
import SortPopover from "../components/sort-popover";
import {
  LEGALIZATION_OPTIONS,
  PROJECT_SORT_OPTIONS,
  PROJECT_SOURCE_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  buildYearOptions,
  type FilterOption,
  type ProjectDensity,
  type ProjectListFilters,
  toggleFilterValue,
} from "./project-list-config";

type ProjectListToolbarProps = {
  readonly projects: ProjectItem[];
  readonly filters: ProjectListFilters;
  readonly onFiltersChange: (filters: ProjectListFilters) => void;
  readonly density: ProjectDensity;
  readonly onDensityChange: (density: ProjectDensity) => void;
  readonly onClearFilters: () => void;
};

type FilterPopoverProps = {
  readonly label: string;
  readonly options: FilterOption[];
  readonly selected: string[];
  readonly onChange: (selected: string[]) => void;
  readonly searchable?: boolean;
};

function FilterPopover({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: FilterPopoverProps) {
  const id = useId();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = normalizedQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery),
      )
    : options;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 font-normal"
          />
        }
      >
        <span>{label}</span>

        {selected.length > 0 ? (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 rounded-full px-1.5 text-[10px]"
          >
            {selected.length}
          </Badge>
        ) : null}

        <RiArrowDownSLine
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {label}
          </span>

          {selected.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange([])}
            >
              Limpiar
            </Button>
          ) : null}
        </div>

        {searchable ? (
          <div className="border-b border-border p-2">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              aria-label={`Buscar ${label.toLowerCase()}`}
              className="h-7"
            />
          </div>
        ) : null}

        <div className="max-h-64 overflow-y-auto p-1">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option, index) => (
              <div
                key={option.value}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <Checkbox
                  id={`${id}-${index}`}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() =>
                    onChange(
                      toggleFilterValue(selected, option.value),
                    )
                  }
                />

                <label
                  htmlFor={`${id}-${index}`}
                  className="min-w-0 flex-1 cursor-pointer truncate text-sm"
                >
                  {option.label}
                </label>
              </div>
            ))
          ) : (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Sin opciones.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
