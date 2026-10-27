import { canManageRubrics } from "../services/roles";
import { canViewKpis } from "../services/stats";

export type AppLink = {
  href: string;
  label: string;
};

/** Navegación principal que vive en la navbar superior. */
export function navigationLinks(): AppLink[] {
  return [
    { href: "/", label: "Inicio" },
    { href: "/projects", label: "Proyectos" },
    { href: "/submit", label: "Proponer" },
  ];
}

/**
 * Acciones rápidas de la sesión. Se muestran como pestañas debajo del
 * statusbar y cambian según los roles globales.
 */
export function userTabLinks(roles: readonly string[]): AppLink[] {
  const links: AppLink[] = [];

  if (roles.includes("admin")) {
    links.push({ href: "/admin/users", label: "Administración" });
  }

  if (canManageRubrics(roles)) {
    links.push({ href: "/admin/rubrics", label: "Rúbricas" });
  }

  if (canViewKpis(roles)) {
    links.push({ href: "/profile/kpis", label: "Indicadores" });
  }

  links.push({ href: "/profile", label: "Mi perfil" });

  return links;
}
