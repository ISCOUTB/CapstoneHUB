"use client";

import Link from "next/link";
import {
  RiArrowDownSLine,
  RiLogoutBoxRLine,
  RiUser3Line,
} from "@remixicon/react";
import { useAuth } from "./auth-provider";
import { formatRole, getInitials } from "../services/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Bloque de sesión de la barra de navegación. Vive sobre el azul profundo UTB,
 * así que no usa los `Button` de superficie clara. El widget de perfil abre un
 * dropdown con el acceso al perfil y el cierre de sesión.
 */
export function AuthNav({
  showUserInfo = true,
  onNavigate,
}: {
  showUserInfo?: boolean;
  onNavigate?: () => void;
}) {
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
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/register"
          className="flex h-9 shrink-0 items-center justify-center rounded-xl border border-white/15 px-3.5 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="flex h-9 shrink-0 items-center justify-center rounded-xl bg-utb-blue px-4 text-[13px] font-semibold text-white shadow-lg shadow-utb-blue/30 transition-colors hover:bg-utb-blue-dark focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Abrir menú de perfil"
            className="group flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 py-1.5 pr-2.5 pl-1.5 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-utb-blue-pale/60 focus-visible:outline-none"
          />
        }
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-utb-blue text-[11px] font-bold text-white ring-2 ring-white/10 transition-shadow group-hover:ring-utb-blue-pale/40">
          {getInitials(session?.user.fullName ?? "")}
        </span>

        {showUserInfo ? (
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-[180px] truncate text-[13px] leading-tight font-semibold text-white">
              {session?.user.fullName}
            </span>
            <span className="block max-w-[180px] truncate text-[11px] leading-tight text-utb-blue-pale/70">
              {userRoles || "Sin rol asignado"}
            </span>
          </span>
        ) : null}

        <RiArrowDownSLine
          className="size-4 shrink-0 text-white/50 transition-transform group-data-[popup-open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <div className="px-2 py-1.5">
          <span className="block truncate text-sm font-semibold text-foreground">
            {session?.user.fullName}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {session?.user.email}
          </span>
          {userRoles ? (
            <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
              {userRoles}
            </span>
          ) : null}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={<Link href="/profile" />}
          onClick={onNavigate}
        >
          <RiUser3Line />
          Mi perfil
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
        >
          <RiLogoutBoxRLine />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
