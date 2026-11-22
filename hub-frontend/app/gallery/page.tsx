import type { Metadata } from "next";
import { Suspense } from "react";
import GalleryExplorer from "./gallery-explorer";
import GallerySkeleton from "./gallery-skeleton";

const GALLERY_DESCRIPTION =
  "Proyectos finalizados de la Universidad Tecnológica de Bolívar.";

export const metadata: Metadata = {
  title: "Galería de proyectos | CapstoneHUB",
  description: GALLERY_DESCRIPTION,
};

export default function GalleryPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Galería
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {GALLERY_DESCRIPTION}
          </p>
        </div>

        <Suspense fallback={<GallerySkeleton />}>
          <GalleryExplorer />
        </Suspense>
      </section>
    </main>
  );
}
