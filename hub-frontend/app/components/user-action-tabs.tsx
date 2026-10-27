"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiBookOpenLine,
  RiDashboardLine,
  RiTeamLine,
  RiUser3Line,
} from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import { userTabLinks } from "./navigation-links";

const ICONS: Record<string, typeof RiUser3Line> = {
  "/admin/users": RiTeamLine,
  "/admin/rubrics": RiBookOpenLine,
  "/profile/kpis": RiDashboardLine,
  "/profile": RiUser3Line,
};

/**
 * Pestañas de acciones rápidas bajo el statusbar. No son sticky: acompañan al
 * statusbar y desaparecen con el scroll; solo la navbar queda fija.
 */
export default function UserActionTabs() {
  const pathname = usePathname();
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  const links = userTabLinks(session.user.roles);

  return (
    <div className="border-b border-border/60 bg-background">
      <nav
        aria-label="Acciones de usuario"
        className="mx-auto flex w-full max-w-[96rem] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8"
      >
        {links.map((link) => {
          // `/profile` es padre de `/profile/kpis`: solo se marca en su ruta.
          const isActive =
            link.href === "/profile"
              ? pathname === "/profile"
              : pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
          const Icon = ICONS[link.href] ?? RiUser3Line;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-utb-blue/40 focus-visible:outline-none",
                isActive
                  ? "border-utb-blue text-utb-blue"
                  : "border-transparent text-muted-foreground hover:border-utb-blue/30 hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
