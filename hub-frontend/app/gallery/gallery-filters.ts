import {
  PROJECT_FILTER_PARAMS,
  PROJECT_SORT_OPTIONS,
  isProjectSource,
  type ProjectSort,
} from "../projects/project-list-config";
import type { ProjectListQuery } from "../services/projects";

export type GallerySort = Exclude<ProjectSort, "relevance">;

export type GalleryFilters = {
  search: string;
  source: string[];
  year: string[];
  sort: GallerySort;
};

export const GALLERY_PAGE_SIZE = 9;

export const GALLERY_SORT_OPTIONS: { value: GallerySort; label: string }[] =
  PROJECT_SORT_OPTIONS.filter(
    (option) => option.value !== "relevance",
  ) as { value: GallerySort; label: string }[];

const GALLERY_SORT_VALUES = new Set<string>(
  GALLERY_SORT_OPTIONS.map((option) => option.value),
);

/** Filtros que siempre acompañan a la galería: solo proyectos públicos cerrados. */
export const GALLERY_BASE_QUERY: ProjectListQuery = {
  status: ["closed"],
  isPrivate: false,
  sort: "year-desc",
  limit: 100,
};

export function createDefaultGalleryFilters(): GalleryFilters {
  return {
    search: "",
    source: [],
    year: [],
    sort: "year-desc",
  };
}

export function isGallerySort(value: string | null): value is GallerySort {
  return value !== null && GALLERY_SORT_VALUES.has(value);
}

function isGalleryYear(value: string): boolean {
  return value === "sin-anio" || /^\d{4}$/.test(value);
}

export function galleryFiltersFromSearchParams(
  searchParams: URLSearchParams,
): GalleryFilters {
  return {
    search: searchParams.get(PROJECT_FILTER_PARAMS.search) ?? "",
    source: searchParams
      .getAll(PROJECT_FILTER_PARAMS.source)
      .filter(isProjectSource),
    year: searchParams
      .getAll(PROJECT_FILTER_PARAMS.year)
      .filter(isGalleryYear),
    sort: isGallerySort(searchParams.get(PROJECT_FILTER_PARAMS.sort))
      ? (searchParams.get(PROJECT_FILTER_PARAMS.sort) as GallerySort)
      : "year-desc",
  };
}

export function galleryFiltersToSearchParams(
  filters: GalleryFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  const search = filters.search.trim();

  if (search) {
    params.set(PROJECT_FILTER_PARAMS.search, search);
  }

  filters.source.forEach((value) =>
    params.append(PROJECT_FILTER_PARAMS.source, value),
  );
  filters.year.forEach((value) =>
    params.append(PROJECT_FILTER_PARAMS.year, value),
  );

  if (filters.sort !== "year-desc") {
    params.set(PROJECT_FILTER_PARAMS.sort, filters.sort);
  }

  return params;
}

export function galleryFiltersToApiQuery(
  filters: GalleryFilters,
): ProjectListQuery {
  const query: ProjectListQuery = {
    ...GALLERY_BASE_QUERY,
    sort: filters.sort,
  };
  const search = filters.search.trim();

  if (search) {
    query.search = search;
  }

  if (filters.source.length > 0) {
    query.source = filters.source;
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

  return query;
}

export function hasActiveGalleryFilters(filters: GalleryFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.source.length > 0 ||
    filters.year.length > 0 ||
    filters.sort !== "year-desc"
  );
}
