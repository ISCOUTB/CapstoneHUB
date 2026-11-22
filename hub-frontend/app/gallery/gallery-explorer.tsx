"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApiResource } from "@/lib/use-api-resource";
import { getProjects } from "../services/projects";
import { buildYearOptions } from "../projects/project-list-config";
import { useRemoteProjects } from "../projects/use-remote-projects";
import GalleryFilterSidebar from "./gallery-filter-sidebar";
import {
  GALLERY_BASE_QUERY,
  createDefaultGalleryFilters,
  galleryFiltersFromSearchParams,
  galleryFiltersToApiQuery,
  galleryFiltersToSearchParams,
  hasActiveGalleryFilters,
  type GalleryFilters,
} from "./gallery-filters";
import GalleryResults from "./gallery-results";
import GalleryToolbar from "./gallery-toolbar";

export default function GalleryExplorer() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<GalleryFilters>(() =>
    galleryFiltersFromSearchParams(
      new URLSearchParams(searchParams.toString()),
    ),
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const {
    data: baseData,
    loading: baseLoading,
    error: baseError,
  } = useApiResource(
    () => getProjects(GALLERY_BASE_QUERY),
    [reloadKey],
  );

  const hasActiveFilters = hasActiveGalleryFilters(filters);
  const apiQuery = useMemo(
    () => galleryFiltersToApiQuery(filters),
    [filters],
  );
  const queryKey = useMemo(() => JSON.stringify(apiQuery), [apiQuery]);
  const remoteProjects = useRemoteProjects({
    enabled: hasActiveFilters,
    query: apiQuery,
    queryKey,
    reloadKey,
  });

  const currentRemote =
    remoteProjects?.queryKey === queryKey ? remoteProjects : null;
  const baseProjects = useMemo(
    () => baseData?.projects ?? [],
    [baseData],
  );
  const projects = hasActiveFilters
    ? (remoteProjects?.projects ?? [])
    : baseProjects;

  const yearOptions = useMemo(() => {
    const options = buildYearOptions(baseProjects);
    const values = new Set(options.map((option) => option.value));

    for (const selected of filters.year) {
      if (!values.has(selected)) {
        options.push({
          value: selected,
          label: selected === "sin-anio" ? "Sin año" : selected,
        });
        values.add(selected);
      }
    }

    return options.sort((left, right) => {
      if (left.value === "sin-anio") {
        return 1;
      }

      if (right.value === "sin-anio") {
        return -1;
      }

      return Number(right.value) - Number(left.value);
    });
  }, [baseProjects, filters.year]);

  const loading = hasActiveFilters ? remoteProjects === null : baseLoading;
  const status = hasActiveFilters
    ? currentRemote?.status
    : baseData?.status;
  const error = hasActiveFilters
    ? (currentRemote?.error ?? null)
    : (baseData?.error ?? baseError ?? null);

  useEffect(() => {
    function handlePopState() {
      setFilters(
        galleryFiltersFromSearchParams(
          new URLSearchParams(window.location.search),
        ),
      );
      setPageIndex(0);
    }

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const nextSearch = galleryFiltersToSearchParams(filters).toString();
    const currentSearch = window.location.search.replace(/^\?/, "");

    if (nextSearch === currentSearch) {
      return;
    }

    const nextUrl = `${window.location.pathname}${
      nextSearch ? `?${nextSearch}` : ""
    }${window.location.hash}`;

    window.history.replaceState(null, "", nextUrl);
  }, [filters]);

  function handleFiltersChange(nextFilters: GalleryFilters) {
    setFilters(nextFilters);
    setPageIndex(0);
  }

  function clearFilters() {
    setFilters(createDefaultGalleryFilters());
    setPageIndex(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <GalleryToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="order-2 min-w-0 flex-1 lg:order-1">
          <GalleryResults
            projects={projects}
            loading={loading}
            status={status}
            error={error}
            hasActiveFilters={hasActiveFilters}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            onClearFilters={clearFilters}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        </div>

        <GalleryFilterSidebar
          className="order-1 lg:order-2"
          filters={filters}
          onFiltersChange={handleFiltersChange}
          yearOptions={yearOptions}
          yearsLoading={baseLoading}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
}
