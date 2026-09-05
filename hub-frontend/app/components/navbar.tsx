"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, ready, logout } = useAuth();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="border-b border-slate-200 bg-blue-700 shadow-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-8 px-6 py-4 sm:px-10 lg:px-12">
        <Link
          href="/"
          className={`text-lg font-semibold transition ${
            isActive("/") ? "text-white" : "text-gray-50"
          }`}
        >
          CapstoneHUB
        </Link>

        <Link
          href="/projects"
          className={`text-sm font-medium transition ${
            isActive("/projects")
              ? "text-white border-b-2 border-white"
              : "text-gray-50"
          }`}
        >
          Proyectos
        </Link>

        <Link
          href="/submit"
          className={`text-sm font-medium transition ${
            isActive("/submit")
              ? "text-white border-b-2 border-white"
              : "text-gray-50"
          }`}
        >
          Proponer
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {!ready ? (
            <span className="text-sm text-white">Cargando...</span>
          ) : isAuthenticated ? (
            <>
              <span className="hidden text-sm text-white sm:inline">
                Sesión iniciada
              </span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
