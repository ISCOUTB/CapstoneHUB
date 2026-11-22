"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import AccessNotice from "../components/access-notice";
import ListPagination from "../components/list-pagination";
import ServiceUnavailable from "../components/service-unavailable";
import { isServiceUnavailableStatus } from "@/lib/http";
import {
  type ProjectListQuery,
} from "../services/projects";
import { type ProjectItem } from "../services/schemas";
import ProjectListRow from "./project-list-row";
import ProjectListSidebar from "./project-list-sidebar";
import ProjectListToolbar from "./project-list-toolbar";
import {
  PROJECT_FILTER_PARAMS,
  createDefaultFilters,
  isLegalizationValue,
  isProjectSort,
  isProjectSource,
  isProjectStatus,
  type ProjectDensity,
  type ProjectListFilters,
} from "./project-list-config";
import { useRemoteProjects } from "./use-remote-projects";

type ProjectsListProps = {
  readonly projects: ProjectItem[];
};

const PAGE_SIZE = 10;

function isTruthyParam(value: string | null): boolean {
  return value === "1" || value === "true";
}

function filtersFromSearchParams(
  searchParams: URLSearchParams,
): ProjectListFilters {
  const sortParam = searchParams.get(PROJECT_FILTER_PARAMS.sort);

  return {
    search: searchParams.get(PROJECT_FILTER_PARAMS.search) ?? "",
    status: searchParams
      .getAll(PROJECT_FILTER_PARAMS.status)
      .filter(isProjectStatus),
    proposer: searchParams
      .getAll(PROJECT_FILTER_PARAMS.proposer)
      .filter(Boolean),
    source: searchParams
      .getAll(PROJECT_FILTER_PARAMS.source)
      .filter(isProjectSource),
    legalization: searchParams
      .getAll(PROJECT_FILTER_PARAMS.legalization)
      .filter(isLegalizationValue),
    year: searchParams.getAll(PROJECT_FILTER_PARAMS.year).filter(Boolean),
    assignedToMe: isTruthyParam(
      searchParams.get(PROJECT_FILTER_PARAMS.assignedToMe),
    ),
    proposedByMe: isTruthyParam(
      searchParams.get(PROJECT_FILTER_PARAMS.proposedByMe),
    ),
    hasTeam: isTruthyParam(searchParams.get(PROJECT_FILTER_PARAMS.hasTeam)),
    privateOnly: isTruthyParam(
      searchParams.get(PROJECT_FILTER_PARAMS.privateOnly),
    ),
    sort: isProjectSort(sortParam) ? sortParam : "relevance",
  };
}

function filtersToSearchParams(
  filters: ProjectListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  const search = filters.search.trim();

  if (search) {
    params.set(PROJECT_FILTER_PARAMS.search, search);
  }

  filters.status.forEach((value) =>
    params.append(PROJECT_FILTER_PARAMS.status, value),
  );
  filters.proposer.forEach((value) =>
    params.append(PROJECT_FILTER_PARAMS.proposer, value),
  );
  filters.source.forEach((value) =>
    params.append(PROJECT_FILTER_PARAMS.source, value),
  );
  filters.legalization.forEach((value) =>
    params.append(PROJECT_FILTER_PARAMS.legalization, value),
  );
  filters.year.forEach((value) =>
    params.append(PROJECT_FILTER_PARAMS.year, value),
  );

  if (filters.assignedToMe) {
    params.set(PROJECT_FILTER_PARAMS.assignedToMe, "1");
  }

  if (filters.proposedByMe) {
    params.set(PROJECT_FILTER_PARAMS.proposedByMe, "1");
  }

  if (filters.hasTeam) {
    params.set(PROJECT_FILTER_PARAMS.hasTeam, "1");
  }

  if (filters.privateOnly) {
    params.set(PROJECT_FILTER_PARAMS.privateOnly, "1");
  }

  if (filters.sort !== "relevance") {
    params.set(PROJECT_FILTER_PARAMS.sort, filters.sort);
  }

  return params;
}

function filtersToApiQuery(
  filters: ProjectListFilters,
): ProjectListQuery {
  const query: ProjectListQuery = { limit: 100 };
  const search = filters.search.trim();

  if (search) {
    query.search = search;
  }

  if (filters.status.length > 0) {
    query.status = filters.status;
  }

  if (filters.proposer.length > 0) {
    query.proposer = filters.proposer;
  }

  if (filters.source.length > 0) {
    query.source = filters.source;
  }

  if (filters.legalization.length === 1) {
    query.requiresLegalization = filters.legalization[0] === "si";
  }

  const years = filters.year
    .filter((year) => year !== "sin-anio")
    .map(Number)
    .filter((year) => Number.isInteger(year));

  if (years.length > 0) {
    query.year = years;
  }

  if (filters.year.includes("sin-anio")) {
    query.withoutYear = true;
  }

  if (filters.assignedToMe) {
    query.assignedToMe = true;
  }

  if (filters.proposedByMe) {
    query.proposedByMe = true;
  }

  if (filters.hasTeam) {
    query.hasTeam = true;
  }

  if (filters.privateOnly) {
    query.isPrivate = true;
  }

  if (filters.sort !== "relevance") {
    query.sort = filters.sort;
  }

  return query;
}

function hasActiveFilters(filters: ProjectListFilters): boolean {
  return (
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
    filters.sort !== "relevance"
  );
}

type ProjectsResultsProps = {
  readonly projects: ProjectItem[];
  readonly loading: boolean;
  readonly status?: number;
  readonly error: string | null;
  readonly density: ProjectDensity;
  readonly filters: ProjectListFilters;
  readonly pageIndex: number;
  readonly onPageChange: (pageIndex: number) => void;
  readonly onClearFilters: () => void;
  readonly onRetry: () => void;
};

function ProjectsResults({
  projects,
  loading,
  status,
  error,
  density,
  filters,
  pageIndex,
  onPageChange,
  onClearFilters,
  onRetry,
}: ProjectsResultsProps) {
  if (loading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (status === 401) {
    return (
      <AccessNotice
        className="rounded-2xl"
        title="Inicia sesión para ver los proyectos"
        message="Solo los proyectos finalizados y públicos se pueden consultar sin cuenta. Inicia sesión para ver tus proyectos propuestos y asignados."
      />
    );
  }

  if (isServiceUnavailableStatus(status)) {
    return (
      <ServiceUnavailable
        className="mb-6"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Empty className="rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
        <EmptyHeader>
          <EmptyTitle>No hay proyectos con esos filtros</EmptyTitle>
          <EmptyDescription>
            Prueba a cambiar la búsqueda o a limpiar los filtros
            seleccionados.
          </EmptyDescription>
        </EmptyHeader>

        {hasActiveFilters(filters) ? (
          <EmptyContent>
            <Button variant="outline" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }

  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedProjects = projects.slice(
    safePageIndex * PAGE_SIZE,
    (safePageIndex + 1) * PAGE_SIZE,
  );

  return (
    <>
      <p className="px-1 pb-2 text-xs text-muted-foreground">
        {projects.length} {projects.length === 1 ? "proyecto" : "proyectos"}
      </p>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
        <ul className="divide-y divide-border">
          {paginatedProjects.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              density={density}
            />
          ))}
        </ul>
      </div>

      <ListPagination
        id="projects-page-input"
        pageIndex={safePageIndex}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default function ProjectsList({ projects }: ProjectsListProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ProjectListFilters>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [density, setDensity] = useState<ProjectDensity>("comfortable");
  const [pageIndex, setPageIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const apiQuery = useMemo(() => filtersToApiQuery(filters), [filters]);
  const queryKey = useMemo(() => JSON.stringify(apiQuery), [apiQuery]);
  const serverQuery = hasActiveFilters(filters);
  const remoteProjects = useRemoteProjects({
    enabled: serverQuery,
    query: apiQuery,
    queryKey,
    reloadKey,
  });
  const isRemoteCurrent = remoteProjects?.queryKey === queryKey;
  const currentRemote = isRemoteCurrent ? remoteProjects : null;
  const displayProjects = serverQuery
    ? (remoteProjects?.projects ?? [])
    : projects;
  const remoteLoading = serverQuery && remoteProjects === null;
  const remoteError = serverQuery ? (currentRemote?.error ?? null) : null;
  const remoteStatus = serverQuery ? currentRemote?.status : undefined;

  useEffect(() => {
    function handlePopState() {
      setFilters(
        filtersFromSearchParams(
          new URLSearchParams(window.location.search),
        ),
      );
      setPageIndex(0);
    }

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const params = filtersToSearchParams(filters);
    const nextSearch = params.toString();
    const currentSearch = window.location.search.replace(/^\?/, "");

    if (nextSearch === currentSearch) {
      return;
    }

    const nextUrl = `${window.location.pathname}${
      nextSearch ? `?${nextSearch}` : ""
    }${window.location.hash}`;

    window.history.replaceState(null, "", nextUrl);
  }, [filters]);

  function handleFiltersChange(nextFilters: ProjectListFilters) {
    setFilters(nextFilters);
    setPageIndex(0);
  }

  function clearFilters() {
    setFilters(createDefaultFilters());
    setPageIndex(0);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <ProjectListToolbar
          projects={projects}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          density={density}
          onDensityChange={setDensity}
          onClearFilters={clearFilters}
        />

        <ProjectsResults
          projects={displayProjects}
          loading={remoteLoading}
          status={remoteStatus}
          error={remoteError}
          density={density}
          filters={filters}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          onClearFilters={clearFilters}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </div>

      <ProjectListSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
}
