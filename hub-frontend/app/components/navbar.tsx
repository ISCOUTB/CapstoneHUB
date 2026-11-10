"use client";

import { AuthNav } from "./auth-nav";
import { Brand } from "./brand";
import { ModuleHeader } from "./module-header";
import { usePageHeader } from "./page-header-context";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Topbar de la plataforma: en las pantallas internas muestra el header del
 * módulo (categoría + título) y el widget de sesión. En las pantallas sin
 * sidebar (login y registro) recupera la marca a la izquierda.
 */
export default function Navbar({
  showBrand = false,
}: Readonly<{ showBrand?: boolean }>) {
  const { header } = usePageHeader();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card">
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        {showBrand ? (
          <>
            <Brand variant="light" />

            <div className="ml-auto flex shrink-0 items-center">
              <AuthNav />
            </div>
          </>
        ) : (
          <>
            <SidebarTrigger
              aria-label="Abrir menú"
              className="size-9 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground lg:hidden"
            />

            <div className="min-w-0 flex-1 overflow-hidden">
              {header ? <ModuleHeader {...header} /> : null}
            </div>

            <div className="ml-auto flex shrink-0 items-center">
              <AuthNav />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
