"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/auth-provider";
import PageFrame from "../../../components/page-frame";
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
    <PageFrame
      eyebrow={`Proyecto #${project.id}`}
      title="Editar proyecto"
      accentColor="rgba(16,185,129,0.32)"
      teamSize={project.actorAssignments?.length ?? 0}
      maxWidth="max-w-4xl"
    >
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
                Solo los administradores, directivos y docentes o evaluadores
                asignados pueden editar los datos del proyecto, y no es posible
                cuando el proyecto está finalizado o rechazado.
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
    </PageFrame>
  );
}
