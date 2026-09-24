import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type ProjectMissingStateProps = {
  status: number | undefined;
};

export default function ProjectMissingState({
  status,
}: ProjectMissingStateProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Empty className="rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
        <EmptyHeader>
          <EmptyTitle>Proyecto no disponible</EmptyTitle>
          <EmptyDescription>
            Este proyecto no existe o es privado. Los proyectos privados solo son
            visibles para el proponente, los actores asignados y los evaluadores
            o administradores. Si ya iniciaste sesión con una cuenta autorizada,
            verifica el enlace.
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/projects">Volver a proyectos</Link>}
          />
          {status === 401 ? (
            <Button
              nativeButton={false}
              render={<Link href="/login">Iniciar sesión</Link>}
            />
          ) : null}
        </div>
      </Empty>
    </section>
  );
}
