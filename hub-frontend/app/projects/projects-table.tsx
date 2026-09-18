"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { columns } from "./columns";
import {
  features,
  type ProjectTableFeatures,
} from "./projects-table-features";
import { ProjectItem } from "../services/schemas";

type ProjectsTableProps = {
  readonly projects: ProjectItem[];
};

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "proposed", label: "Propuesto" },
  { value: "under_review", label: "En revisión" },
  { value: "approved", label: "Aprobado" },
  { value: "assigned", label: "Asignado" },
  { value: "in_progress", label: "En progreso" },
  { value: "closed", label: "Cerrado" },
  { value: "rejected", label: "Rechazado" },
];

function getProposerName(project: ProjectItem): string {
  return project.proposer?.fullName ?? "";
}

function matchesSearch(
  project: ProjectItem,
  searchValue: string,
): boolean {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    project.name,
    project.location ?? project.context ?? "",
    getProposerName(project),
  ];

  return searchableValues.some((value) =>
    value.toLowerCase().includes(searchValue),
  );
}

export default function ProjectsTable({
  projects,
}: Readonly<ProjectsTableProps>) {
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);

  const [searchFilter, setSearchFilter] = useState("");

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase();

    return projects.filter((project) =>
      matchesSearch(project, normalizedSearch),
    );
  }, [projects, searchFilter]);

  const table = useTable<ProjectTableFeatures, ProjectItem>({
    features,
    data: filteredProjects,
    columns,
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
  });

  const statusColumn = table.getColumn("status");
  const yearColumn = table.getColumn("year");

  const statusFilterValue =
    (statusColumn?.getFilterValue() as string) ?? "all";

  const yearFilterValue =
    (yearColumn?.getFilterValue() as string) ?? "";

  function handleSearchChange(value: string) {
    setSearchFilter(value);
    table.setPageIndex(0);
  }

  function clearFilters() {
    setSearchFilter("");
    table.resetColumnFilters();
    table.setPageIndex(0);
  }

  const hasFilters =
    searchFilter.trim() !== "" || columnFilters.length > 0;

  const selectedStatusLabel =
    statusOptions.find(
      (status) => status.value === statusFilterValue,
    )?.label ?? "Estado";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-utb-blue/10">
        <Input
          type="search"
          placeholder="Buscar por nombre, lugar o proponente..."
          value={searchFilter}
          onChange={(event) =>
            handleSearchChange(event.target.value)
          }
          className="w-full sm:max-w-md"
        />

        <Select
          value={statusFilterValue}
          onValueChange={(value) => {
            statusColumn?.setFilterValue(
              value === "all" ? undefined : value,
            );
            table.setPageIndex(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue>{selectedStatusLabel}</SelectValue>
          </SelectTrigger>

          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem
                key={status.value}
                value={status.value}
              >
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Año..."
          value={yearFilterValue}
          onChange={(event) => {
            yearColumn?.setFilterValue(
              event.target.value || undefined,
            );
            table.setPageIndex(0);
          }}
          className="w-full sm:w-28"
        />

        {hasFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    row.getIsSelected() && "selected"
                  }
                  className="transition-colors hover:bg-utb-blue/[0.04]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron proyectos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
} 
