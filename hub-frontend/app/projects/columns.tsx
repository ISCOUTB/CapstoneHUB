"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ProjectItem } from "../services/schemas";
import { formatStatus, formatProjectSource } from "../services/utils";
import { type ProjectTableFeatures } from "./projects-table-features";

const columnHelper = createColumnHelper<ProjectTableFeatures, ProjectItem>();

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="-ml-3 h-8 px-3"
    >
      {label}
      <span className="ml-2 text-xs">
        {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
      </span>
    </Button>
  );
}

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <SortableHeader label="Nombre" column={column} />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <Link href={`/projects/${row.original.id}`}>
        {row.original.name}
      </Link>
    ),
  }),

  columnHelper.accessor(
    (project: ProjectItem) => project.proposer?.fullName ?? "Sin información",
    {
      id: "proposer",
      header: ({ column }) => (
        <SortableHeader label="Proponente" column={column} />
      ),
      filterFn: "includesString",
    },
  ),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <SortableHeader label="Estado" column={column} />
    ),
    cell: ({ getValue }) => (
      <span>{formatStatus(getValue())}</span>
    ),
  }),

  columnHelper.accessor(
    (project: ProjectItem) =>
      project.source ? formatProjectSource(project.source) : "Sin información",
    {
      id: "source",
      header: ({ column }) => (
        <SortableHeader label="Fuente" column={column} />
      ),
      filterFn: "includesString",
    },
  ),

  columnHelper.accessor(
    (project: ProjectItem) => (project.requiresLegalization ? "Sí" : "No"),
    {
      id: "requiresLegalization",
      header: ({ column }) => (
        <SortableHeader label="Legalización" column={column} />
      ),
      filterFn: "includesString",
      cell: ({ getValue }) =>
        getValue() === "Sí" ? (
          <Badge variant="outline">Sí</Badge>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
    },
  ),

  columnHelper.accessor(
    (project: ProjectItem) =>
      project.startDate
        ? new Date(project.startDate).getFullYear().toString()
        : "—",
    {
      id: "year",
      header: ({ column }) => (
        <SortableHeader label="Año" column={column} />
      ),
      filterFn: "includesString",
    },
  ),
]);
