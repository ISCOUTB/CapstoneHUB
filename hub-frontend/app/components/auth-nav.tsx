"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";
import { formatRole, getInitials } from "../services/utils";

/**
 * Bloque de sesión de la barra de navegación. Vive sobre el azul profundo UTB,
 * así que no usa los `Button` de superficie clara: la píldora de perfil y el
 * botón de sesión están tintados para ese fondo.
 */
export function AuthNav({ showUserInfo = true }: { showUserInfo?: boolean }) {
  const { session, isAuthenticated, ready, logout } = useAuth();

  const userRoles = (session?.user.roles ?? [])
    .map((role) => formatRole(role))
    .join(", ");

  if (!ready) {
    return (
      <div className="flex shrink-0 items-center gap-3">
        <div className="h-8 w-28 animate-pulse rounded-xl bg-white/10" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex h-9 shrink-0 items-center justify-center rounded-xl bg-utb-blue px-4 text-[13px] font-semibold text-white shadow-lg shadow-utb-blue/30 transition-colors hover:bg-utb-blue-dark focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
      >
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {showUserInfo ? (
        <Link
          href="/profile"
          className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 py-1.5 pr-3 pl-1.5 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-utb-blue text-[11px] font-bold text-white ring-2 ring-white/10 transition-shadow group-hover:ring-utb-blue-pale/40">
            {getInitials(session?.user.fullName ?? "")}
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-[180px] truncate text-[13px] leading-tight font-semibold text-white">
              {session?.user.fullName}
            </span>
            <span className="block max-w-[180px] truncate text-[11px] leading-tight text-utb-blue-pale/70">
              {userRoles || "Sin rol asignado"}
            </span>
          </span>
        </Link>
      ) : null}

      <button
        type="button"
        onClick={logout}
        className="flex h-9 shrink-0 items-center justify-center rounded-xl border border-white/15 px-3.5 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
