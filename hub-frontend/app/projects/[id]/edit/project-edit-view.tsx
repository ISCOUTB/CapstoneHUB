"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/auth-provider";
import ModuleHeader from "../../../components/module-header";
import ProjectDetailsSkeleton from "../project-details-skeleton";
import ProjectGeneralEditForm from "../project-general-edit-form";
import ProjectMissingState from "../project-missing-state";
import { useCanEditProject } from "../use-can-edit-project";
import { useProjectDetails } from "../use-project-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProjectEditView({ id }: { readonly id: string }) {
  const router = useRouter();
  const { ready } = useAuth();
  const { project, loading, status } = useProjectDetails(id);
  const canEdit = useCanEditProject(project);
  const backHref = `/projects/${id}`;

  if (loading || !ready) {
    return <ProjectDetailsSkeleton />;
  }

  if (!project) {
    return <ProjectMissingState status={status} />;
  }

  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ModuleHeader
          eyebrow={`Proyecto #${project.id}`}
          title="Editar proyecto"
          subtitle="Actualiza los datos del proyecto. Cada cambio queda registrado en el historial."
          accentColor="rgba(16,185,129,0.32)"
          actions={
            <Link
              href={backHref}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-semibold text-utb-deep-blue shadow-lg shadow-utb-deep-blue/20 transition-colors hover:bg-utb-blue-pale focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              Volver al proyecto
            </Link>
          }
        />

        {canEdit ? (
          <ProjectGeneralEditForm
            project={project}
            onSaved={() => {
              router.push(backHref);
              router.refresh();
            }}
            onCancel={() => router.push(backHref)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Edición no disponible</CardTitle>
              <CardDescription>
                Solo los administradores y evaluadores pueden editar los datos
                del proyecto, y no es posible cuando el proyecto está finalizado
                o rechazado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  No tienes permisos para editar este proyecto.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
