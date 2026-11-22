import { type ProjectItem } from "../services/schemas";

export type ProjectDensity = "comfortable" | "compact";

export type ProjectSort =
  | "relevance"
  | "name-asc"
  | "name-desc"
  | "year-desc"
  | "year-asc";

export type ProjectListFilters = {
  search: string;
  status: string[];
  proposer: string[];
  source: string[];
  legalization: string[];
  year: string[];
  sort: ProjectSort;
  assignedToMe: boolean;
  proposedByMe: boolean;
  hasTeam: boolean;
  privateOnly: boolean;
};

export type FilterOption = {
  value: string;
  label: string;
};

/** Claves de los filtros en la URL, compartidas por el listado y la galería. */
export const PROJECT_FILTER_PARAMS = {
  search: "q",
  status: "estado",
  proposer: "proponente",
  source: "fuente",
  legalization: "legalizacion",
  year: "anio",
  assignedToMe: "asignados",
  proposedByMe: "propuestos",
  hasTeam: "equipo",
  privateOnly: "privados",
  sort: "orden",
} as const;


export const PROJECT_STATUS_OPTIONS: FilterOption[] = [
  { value: "proposed", label: "Propuesto" },
  { value: "under_review", label: "En revisión" },
  { value: "approved", label: "Aprobado" },
  { value: "in_progress", label: "En progreso" },
  { value: "paused", label: "En pausa" },
  { value: "closed", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "rejected", label: "Rechazado" },
];

export const PROJECT_SOURCE_OPTIONS: FilterOption[] = [
  { value: "external_entity", label: "Entidad externa" },
  { value: "research", label: "Investigación" },
  { value: "internal_need", label: "Necesidad interna" },
  { value: "social_impact", label: "Impacto social" },
];

export const LEGALIZATION_OPTIONS: FilterOption[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

export const PROJECT_SORT_OPTIONS: { value: ProjectSort; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "name-asc", label: "Nombre A-Z" },
  { value: "name-desc", label: "Nombre Z-A" },
  { value: "year-desc", label: "Año más reciente" },
  { value: "year-asc", label: "Año más antiguo" },
];

export const PROJECT_STATUS_VALUES = PROJECT_STATUS_OPTIONS.map(
  (option) => option.value,
);

export const PROJECT_SOURCE_VALUES = PROJECT_SOURCE_OPTIONS.map(
  (option) => option.value,
);

export function createDefaultFilters(): ProjectListFilters {
  return {
    search: "",
    status: [],
    proposer: [],
    source: [],
    legalization: [],
    year: [],
    sort: "relevance",
    assignedToMe: false,
    proposedByMe: false,
    hasTeam: false,
    privateOnly: false,
  };
}

export function toggleFilterValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

export function getProjectYear(project: ProjectItem): string | null {
  if (!project.startDate) {
    return null;
  }

  // La API envía fechas sin hora (`YYYY-MM-DD`). Leer el año del texto evita
  // que la zona horaria local lo desplace al año anterior.
  const yearMatch = /^(\d{4})-/.exec(project.startDate);

  if (yearMatch) {
    return yearMatch[1];
  }

  const year = new Date(project.startDate).getFullYear();

  return Number.isNaN(year) ? null : String(year);
}

/** Opciones de año presentes en un conjunto de proyectos. */
export function buildYearOptions(projects: ProjectItem[]): FilterOption[] {
  const years = new Set<string>();
  let hasProjectsWithoutYear = false;

  for (const project of projects) {
    const year = getProjectYear(project);

    if (year) {
      years.add(year);
    } else {
      hasProjectsWithoutYear = true;
    }
  }

  const options = Array.from(years)
    .sort((left, right) => Number(right) - Number(left))
    .map((year) => ({ value: year, label: year }));

  if (hasProjectsWithoutYear) {
    options.push({ value: "sin-anio", label: "Sin año" });
  }

  return options;
}

export function isProjectStatus(value: string): boolean {
  return PROJECT_STATUS_VALUES.includes(value);
}

export function isProjectSource(value: string): boolean {
  return PROJECT_SOURCE_VALUES.includes(value);
}

export function isProjectSort(value: string | null): value is ProjectSort {
  return PROJECT_SORT_OPTIONS.some((option) => option.value === value);
}

export function isLegalizationValue(value: string): boolean {
  return LEGALIZATION_OPTIONS.some((option) => option.value === value);
}
