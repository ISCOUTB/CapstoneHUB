"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "./app-sidebar";
import Navbar from "./navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Shell de la plataforma: sidebar fija a la izquierda + topbar sticky. En
 * login/registro se oculta la sidebar para dejar el formulario a ancho completo.
 */
export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <TooltipProvider>
      <SidebarProvider open onOpenChange={() => undefined}>
        {isAuthPage ? null : <AppSidebar />}

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar isAuthPage={isAuthPage} />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
