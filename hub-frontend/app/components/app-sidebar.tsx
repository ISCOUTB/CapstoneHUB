"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiAddCircleLine,
  RiBookOpenLine,
  RiCloseLine,
  RiDashboardLine,
  RiFolder3Line,
  RiHome5Line,
  RiTeamLine,
  RiUser3Line,
} from "@remixicon/react";
import { Brand } from "./brand";
import { useAuth } from "./auth-provider";
import { sidebarSections } from "./navigation-links";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof RiUser3Line> = {
  "/": RiHome5Line,
  "/projects": RiFolder3Line,
  "/submit": RiAddCircleLine,
  "/admin/users": RiTeamLine,
  "/admin/rubrics": RiBookOpenLine,
  "/profile/kpis": RiDashboardLine,
  "/profile": RiUser3Line,
};

/** `/profile` es padre de `/profile/kpis`: solo se marca en su ruta exacta. */
function isActiveLink(pathname: string, href: string): boolean {
  if (href === "/" || href === "/profile") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Sidebar institucional: marca, navegación principal y accesos de usuario.
 * En escritorio es fija y siempre está expandida; en móvil se monta en un
 * Sheet y se cierra al navegar.
 */
export default function AppSidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const sections = sidebarSections(session?.user.roles ?? null);

  const closeMobile = () => setOpenMobile(false);

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="offcanvas" className="border-sidebar-border">
      <SidebarHeader className="h-16 flex-row items-center justify-between gap-2 border-b border-sidebar-border px-3 py-0">
        <Brand onNavigate={closeMobile} />

        {isMobile ? (
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Cerrar menú"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
          >
            <RiCloseLine className="size-4.5" aria-hidden="true" />
          </button>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        <nav
          aria-label="Navegación principal"
          className="flex flex-col gap-1 py-3"
        >
          {sections.map((section) => (
            <SidebarGroup
              key={section.id}
              role="group"
              aria-labelledby={`sidebar-section-${section.id}`}
            >
              <SidebarGroupLabel
                id={`sidebar-section-${section.id}`}
                className="h-7 px-2 text-[10px] font-bold tracking-[0.18em] text-utb-blue-pale/45 uppercase"
              >
                {section.label}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {section.links.map((link) => {
                    const isActive = isActiveLink(pathname, link.href);
                    const Icon = ICONS[link.href] ?? RiUser3Line;

                    return (
                      <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton
                          render={<Link href={link.href} />}
                          isActive={isActive}
                          aria-current={isActive ? "page" : undefined}
                          onClick={closeMobile}
                          className={cn(
                            "h-10 rounded-xl px-3 text-[13px] font-medium transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60",
                            isActive
                              ? "bg-utb-blue text-white shadow-lg shadow-utb-blue/25 hover:bg-utb-blue hover:text-white data-active:bg-utb-blue data-active:text-white data-active:hover:bg-utb-blue data-active:hover:text-white"
                              : "text-sidebar-foreground/55 hover:bg-white/10 hover:text-sidebar-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4",
                              isActive
                                ? "text-white"
                                : "text-utb-blue-pale/60",
                            )}
                            aria-hidden="true"
                          />
                          <span>{link.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <p className="text-[10px] leading-relaxed font-bold tracking-[0.16em] text-sidebar-foreground/30 uppercase">
          Universidad Tecnológica de Bolívar
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
