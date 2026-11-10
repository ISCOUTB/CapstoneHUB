import { canManageRubrics } from "../services/roles";
import { canViewKpis } from "../services/stats";

export type AppLink = {
  href: string;
  label: string;
};

export type AppSection = {
  id: string;
  label: string;
  links: AppLink[];
};

/**
 * Links de la sidebar. La primera sección es siempre visible; las acciones de
 * usuario dependen de la sesión y de los roles globales, igual que las
 * antiguas pestañas bajo el statusbar.
 */
export function sidebarSections(
  roles: readonly string[] | null,
): AppSection[] {
  const sections: AppSection[] = [
    {
      id: "navigation",
      label: "Navegación",
      links: [
        { href: "/home", label: "Inicio" },
        { href: "/projects", label: "Proyectos" },
        { href: "/submit", label: "Proponer" },
      ],
    },
  ];

  if (!roles) {
    return sections;
  }

  const userLinks: AppLink[] = [];

  if (roles.includes("admin")) {
    userLinks.push({ href: "/admin/users", label: "Administración" });
  }

  if (canManageRubrics(roles)) {
    userLinks.push({ href: "/admin/rubrics", label: "Rúbricas" });
  }

  if (canViewKpis(roles)) {
    userLinks.push({ href: "/profile/kpis", label: "Indicadores" });
  }

  userLinks.push({ href: "/profile", label: "Mi perfil" });

  sections.push({
    id: "account",
    label: "Acciones de usuario",
    links: userLinks,
  });

  return sections;
}
