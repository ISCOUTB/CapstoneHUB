"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  RiCloseLine,
  RiFilter3Line,
  RiSearchLine,
  RiSettings3Line,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useApiResource } from "@/lib/use-api-resource";
import { useAuth } from "../components/auth-provider";
import ServiceUnavailable from "../components/service-unavailable";
import GuideDocumentCard from "./guide-document-card";
import RoleManualCard, { RoleManualSummaryCard } from "./role-manual-card";
import { ROLE_MANUAL_ORDER, ROLE_MANUALS } from "./role-manuals";
import { canManageGuides, type UserRole } from "../services/roles";
import { formatRole } from "../services/utils";
import {
  GUIDE_CATEGORY_LABELS,
  GUIDE_CATEGORY_ORDER,
  formatGuideAudiences,
  formatGuideCategory,
  getGuideDocuments,
  guideFileKind,
  type GuideCategory,
  type GuideDocumentItem,
} from "../services/guides";

type RoleFilter = "all" | UserRole;

type DocumentSectionProps = {
  documents: GuideDocumentItem[];
  loading: boolean;
  error: string | null;
  role: RoleFilter;
  query: string;
  category: GuideCategory | "all";
  onRetry: () => void;
  onClearFilters: () => void;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function documentMatchesQuery(
  document: GuideDocumentItem,
  normalizedQuery: string,
): boolean {
  const haystack = normalizeText(
    [
      document.title,
      document.description ?? "",
      document.originalName ?? "",
      formatGuideCategory(document.category),
      formatGuideAudiences(document.audiences),
      guideFileKind(document),
    ].join(" "),
  );

  return haystack.includes(normalizedQuery);
}

function matchesAudience(
  document: GuideDocumentItem,
  role: RoleFilter,
): boolean {
  return (
    role === "all" ||
    document.audiences.length === 0 ||
    document.audiences.includes(role)
  );
}

function DocumentSection({
  documents,
  loading,
  error,
  role,
  query,
  category,
  onRetry,
  onClearFilters,
}: Readonly<DocumentSectionProps>) {
  const grouped = GUIDE_CATEGORY_ORDER.map((categoryKey) => ({
    category: categoryKey,
    documents: documents.filter(
      (document) => document.category === categoryKey,
    ),
  })).filter((group) => group.documents.length > 0);

  const hasFilters = Boolean(query.trim()) || category !== "all";
  const headingId = `documents-heading-${role}`;

  let emptyTitle = "Todavía no hay documentos publicados";
  let emptyDescription =
    "Los administradores pueden subir formatos, plantillas y guías desde Administrar guías.";

  if (query.trim()) {
    emptyTitle = "No encontramos documentos";
    emptyDescription = `No hay resultados para «${query.trim()}». Prueba con otro término o cambia la categoría.`;
  } else if (category !== "all") {
    emptyTitle = "No hay documentos en esta categoría";
    emptyDescription =
      "Cambia el filtro de categoría o limpia los filtros para ver todo el catálogo.";
  } else if (role !== "all") {
    emptyTitle = "Todavía no hay documentos para este rol";
    emptyDescription =
      "Los documentos compartidos con todos los roles siguen disponibles en la pestaña Todos.";
  }

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id={headingId}
            className="text-lg font-semibold tracking-tight"
          >
            Documentos
          </h2>
          <p className="text-sm text-muted-foreground">
            {role === "all"
              ? "Formatos, plantillas y guías disponibles para la comunidad."
              : `Documentos recomendados para el rol ${formatRole(role)}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-sm text-muted-foreground"
            aria-live="polite"
          >
            {loading
              ? "Cargando documentos…"
              : `${documents.length} documento${documents.length === 1 ? "" : "s"}`}
          </span>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
            >
              <RiCloseLine data-icon="inline-start" />
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <ServiceUnavailable onRetry={onRetry} message={error} />
      ) : grouped.length === 0 ? (
        <Empty className="rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section
              key={group.category}
              aria-labelledby={`guide-category-${role}-${group.category}`}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id={`guide-category-${role}-${group.category}`}
                  className="text-sm font-semibold tracking-tight"
                >
                  {GUIDE_CATEGORY_LABELS[group.category]}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {group.documents.length}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.documents.map((document) => (
                  <GuideDocumentCard key={document.id} document={document} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export default function GuidesExplorer() {
  const { session } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GuideCategory | "all">("all");
  const { data, loading, error, reload } = useApiResource(
    () => getGuideDocuments(),
    [],
  );

  const documents = data ?? [];
  const normalizedQuery = normalizeText(query.trim());
  const canManage = canManageGuides(session?.user.roles ?? []);

  const matchesFilters = useMemo(
    () => (document: GuideDocumentItem, role: RoleFilter) => {
      if (category !== "all" && document.category !== category) {
        return false;
      }

      if (!matchesAudience(document, role)) {
        return false;
      }

      return (
        !normalizedQuery ||
        documentMatchesQuery(document, normalizedQuery)
      );
    },
    [category, normalizedQuery],
  );

  const allDocuments = documents.filter((document) =>
    matchesFilters(document, "all"),
  );

  function documentsForRole(role: UserRole): GuideDocumentItem[] {
    return documents.filter((document) => matchesFilters(document, role));
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Encuentra los manuales de uso para cada rol y los formatos,
          plantillas y guías más usados en el desarrollo de proyectos Capstone.
          Los manuales están al inicio de cada sección para que puedas
          consultarlos antes de explorar los documentos.
        </p>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <RiSearchLine
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título, descripción o formato…"
              aria-label="Buscar documentos"
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={category}
              onValueChange={(value) => {
                if (value === null) {
                  return;
                }

                setCategory(value as GuideCategory | "all");
              }}
            >
              <SelectTrigger
                className="w-full sm:w-60"
                aria-label="Filtrar por categoría"
              >
                <RiFilter3Line
                  data-icon="inline-start"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Todas las categorías">
                  {category === "all"
                    ? "Todas las categorías"
                    : GUIDE_CATEGORY_LABELS[category]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {GUIDE_CATEGORY_ORDER.map((categoryKey) => (
                  <SelectItem key={categoryKey} value={categoryKey}>
                    {GUIDE_CATEGORY_LABELS[categoryKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canManage ? (
              <Button
                nativeButton={false}
                render={<Link href="/admin/guides" />}
              >
                <RiSettings3Line data-icon="inline-start" />
                Administrar guías
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Tabs
        value={selectedRole}
        onValueChange={(value) => {
          setSelectedRole((value ?? "all") as RoleFilter);
        }}
        className="gap-4"
      >
        <TabsList className="max-w-full flex-wrap">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {ROLE_MANUAL_ORDER.map((role) => (
            <TabsTrigger key={role} value={role}>
              {formatRole(role)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <section aria-labelledby="manuals-heading" className="space-y-4">
            <div>
              <h2
                id="manuals-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Manuales de usuario
              </h2>
              <p className="text-sm text-muted-foreground">
                Cada rol tiene una guía con sus tareas principales y accesos
                directos.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ROLE_MANUAL_ORDER.map((role) => (
                <RoleManualSummaryCard
                  key={role}
                  manual={ROLE_MANUALS[role]}
                  onSelect={() => setSelectedRole(role)}
                />
              ))}
            </div>
          </section>

          <DocumentSection
            documents={allDocuments}
            loading={loading}
            error={error}
            role="all"
            query={query}
            category={category}
            onRetry={reload}
            onClearFilters={clearFilters}
          />
        </TabsContent>

        {ROLE_MANUAL_ORDER.map((role) => (
          <TabsContent key={role} value={role} className="space-y-6">
            <RoleManualCard manual={ROLE_MANUALS[role]} />

            <DocumentSection
              documents={documentsForRole(role)}
              loading={loading}
              error={error}
              role={role}
              query={query}
              category={category}
              onRetry={reload}
              onClearFilters={clearFilters}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
