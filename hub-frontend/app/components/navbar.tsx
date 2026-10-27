"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "./auth-provider";
import { AuthNav } from "./auth-nav";
import { UtbLogo } from "./utb-logo";
import { cn } from "@/lib/utils";
import { formatRole } from "../services/utils";

interface NavLink {
  href: string;
  label: string;
}

/** Ítem de navegación: píldora azul UTB cuando la ruta está activa. */
function NavItem({
  href,
  label,
  pathname,
  onNavigate,
  className,
}: NavLink & {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-150",
        "focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none",
        isActive
          ? "bg-utb-blue text-white shadow-lg shadow-utb-blue/30"
          : "text-white/55 hover:bg-white/10 hover:text-white/90",
        className
      )}
    >
      {label}
      {isActive ? (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
      ) : null}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = session?.user.roles.includes("admin") ?? false;
  const userRoles = (session?.user.roles ?? [])
    .map((role) => formatRole(role))
    .join(", ");

  const links: NavLink[] = [
    { href: "/projects", label: "Proyectos" },
    ...(isAdmin ? [{ href: "/admin/users", label: "Administración" }] : []),
    { href: "/submit", label: "Proponer" },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-utb-deep-blue">
      <div className="noise-overlay relative">
        <div className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60" />

        {/* Una sola fila: marca a la izquierda, enlaces, sesión a la derecha. */}
        <div className="relative z-10 mx-auto flex w-full max-w-384 items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={closeMobile}
            className="flex shrink-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
          >
            <UtbLogo className="h-7 w-auto text-white sm:h-8" />

            <span
              className="h-6 w-px shrink-0 bg-white/20 sm:h-7"
              aria-hidden="true"
            />

            <span className="text-base font-bold tracking-tight text-white sm:text-lg">
              Capstone<span className="text-utb-blue-pale">HUB</span>
            </span>
          </Link>

          {/* Menú de escritorio: se oculta antes de que le falte espacio */}
          <nav
            aria-label="Navegación principal"
            className="ml-3 hidden min-w-0 items-center gap-1 lg:flex"
          >
            {links.map((link) => (
              <NavItem key={link.href} {...link} pathname={pathname} />
            ))}
          </nav>

          <div className="ml-auto hidden lg:flex">
            <AuthNav />
          </div>

          {/* Botón hamburguesa: solo visible cuando no cabe el menú de escritorio */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="ml-auto flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none lg:hidden"
          >
            {mobileOpen ? (
              <X className="size-4.5" aria-hidden="true" />
            ) : (
              <Menu className="size-4.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Panel móvil: repite todo lo que el menú de escritorio esconde */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            className="relative z-10 border-t border-white/10 px-4 py-3 sm:px-6 lg:hidden"
          >
            <nav aria-label="Navegación móvil" className="flex flex-col gap-1">
              {links.map((link) => (
                <NavItem
                  key={link.href}
                  {...link}
                  pathname={pathname}
                  onNavigate={closeMobile}
                  className="justify-start"
                />
              ))}
            </nav>

            <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3">
              {session ? (
                <>
                  <p className="px-3.5 text-sm">
                    <span className="block font-semibold text-white">
                      {session.user.fullName}
                    </span>
                    <span className="block text-xs text-utb-blue-pale/70">
                      {userRoles || "Sin rol asignado"}
                    </span>
                  </p>
                  <NavItem
                    href="/profile"
                    label="Mi perfil"
                    pathname={pathname}
                    onNavigate={closeMobile}
                    className="justify-start"
                  />
                </>
              ) : null}
              <div className="px-1.5">
                <AuthNav showUserInfo={false} />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
