"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "./app-sidebar";
import Navbar from "./navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Shell de la plataforma: sidebar fija a la izquierda + topbar sticky. La
 * landing pública (`/`) no monta chrome; login y registro solo muestran el
 * topbar con la marca.
 */
export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const showSidebar = !isLanding && !isAuthPage;

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <SidebarProvider open onOpenChange={() => undefined}>
        {showSidebar ? <AppSidebar /> : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar showBrand={!showSidebar} />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
