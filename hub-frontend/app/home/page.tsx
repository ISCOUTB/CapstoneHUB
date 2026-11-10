"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth-provider";
import PageFrame from "../components/page-frame";
import AssignedProjects from "./assigned-projects";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Inicio de la plataforma (dentro del shell). Por ahora concentra los proyectos
 * propios y asignados del usuario. Requiere sesión.
 */
export default function HomePage() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login?next=/home");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) {
    return (
      <main className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-56 w-full rounded-2xl" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageFrame eyebrow="Inicio" title="Inicio">
      <AssignedProjects />
    </PageFrame>
  );
}
