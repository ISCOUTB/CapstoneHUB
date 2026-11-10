"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RiHome5Line } from "@remixicon/react";
import { useAuth } from "../components/auth-provider";
import PageFrame from "../components/page-frame";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Inicio de la plataforma (dentro del shell). Por ahora es un placeholder: el
 * panel real se construirá más adelante. Requiere sesión.
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
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-utb-blue/10">
            <RiHome5Line
              className="size-6 text-utb-blue"
              aria-hidden="true"
            />
          </span>

          <h2 className="text-lg font-semibold tracking-tight">
            Bienvenido a CapstoneHUB
          </h2>

          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            El panel de inicio estará disponible próximamente. Mientras tanto,
            puedes consultar los proyectos o registrar una nueva propuesta
            desde la navegación.
          </p>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
