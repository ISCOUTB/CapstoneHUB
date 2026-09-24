"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProjectById } from "../../services/projects";
import { ProjectDetails } from "../../services/schemas";
import ModuleHeader from "../../components/module-header";
import ProjectStatusEditForm from "../../components/project-status-edit-form";
import ProjectObservationsPanel from "./project-observations-panel";
import ProjectActorAssignmentPanel from "./project-actor-assignment-panel";
import ProjectCategoriesPanel from "./project-categories-panel";
import ProjectMilestonesPanel from "./project-milestones-panel";
import ProjectReportsPanel from "./project-reports-panel";
import ProjectStatusHistoryPanel from "./project-status-history-panel";
import ProjectAttachmentsPanel from "./project-attachments-panel";
import ProjectAssignmentBadge from "./project-assignment-badge";
import ProjectLegalizationBadge from "./project-legalization-badge";
import ProjectSourceBadge from "./project-source-badge";
import ProjectTabs from "./project-tabs";
import { useAuth } from "../../components/auth-provider";
import { formatStatus, formatProjectSource } from "@/app/services/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  RiAttachmentLine,
  RiChat3Line,
  RiFileCheckLine,
  RiFlagLine,
  RiHistoryLine,
  RiInformationLine,
  RiPriceTag3Line,
  RiTeamLine,
} from "@remixicon/react";

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatCurrency(value: string | null): string {
  if (!value) {
    return "No definido";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return value;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

/**
 * Indica si el espectador puede ver los datos sensibles del proyecto (equipo,
 * observaciones, anexos, historial, entregas, hitos). El backend ya oculta esas
 * relaciones a los espectadores públicos, así que el flag que devuelve es la
 * fuente de verdad; la comprobación en cliente es solo un respaldo mientras
 * carga la respuesta.
 */
function useIsProjectMember(project: ProjectDetails | null): boolean {
  const { session, ready } = useAuth();

  return useMemo(() => {
    if (!project) {
      return false;
    }

    if (typeof project.canViewSensitiveData === "boolean") {
      return project.canViewSensitiveData;
    }

    if (!ready || !session) {
      return false;
    }

    const roles = session.user.roles;

    if (
      roles.includes("admin") ||
      roles.includes("evaluator") ||
      roles.includes("coordinator")
    ) {
      return true;
    }

    return (project.actorAssignments ?? []).some(
      (assignment) => assignment.userId === session.user.id,
    );
  }, [ready, session, project]);
}

function ProjectDetailsView({ id }: { id: string }) {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function loadProject() {
      try {
        setLoading(true);

        const {
          project: nextProject,
          status: nextStatus,
          error,
        } = await getProjectById(id);

        if (!active) {
          return;
        }

        setProject(nextProject ?? null);
        setStatus(error ? nextStatus : undefined);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      active = false;
    };
  }, [id]);

  const isMember = useIsProjectMember(project);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-24 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </section>
    );
  }

  if (!project) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Empty className="rounded-2xl bg-card shadow-sm ring-1 ring-utb-blue/10">
          <EmptyHeader>
            <EmptyTitle>Proyecto no disponible</EmptyTitle>
            <EmptyDescription>
              Este proyecto no existe o es privado. Los proyectos privados solo
              son visibles para el proponente, los actores asignados y los
              evaluadores o administradores. Si ya iniciaste sesión con una
              cuenta autorizada, verifica el enlace.
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

  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ModuleHeader
          eyebrow={`Proyecto #${project.id}`}
          title={project.name}
          subtitle={`Creado el ${formatDate(project.createdAt)}`}
        />

        {!isMember ? (
          <Alert className="mb-6">
            <AlertDescription>
              Estás viendo la información pública de un proyecto finalizado. El
              equipo, las observaciones, los anexos, los hitos y las entregas
              solo son visibles para el proponente, los actores asignados y los
              evaluadores.
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Estado: {formatStatus(project.status)}</Badge>
            <ProjectAssignmentBadge
              assignments={project.actorAssignments ?? []}
            />
            <ProjectLegalizationBadge
              requiresLegalization={project.requiresLegalization}
            />
            <ProjectSourceBadge source={project.source} />
          </div>

          <ProjectTabs
            defaultTab="general"
            validTabs={
              isMember
                ? [
                    "general",
                    "categorias",
                    "equipo",
                    "observaciones",
                    "hitos",
                    "entregas",
                    "anexos",
                    "historial",
                  ]
                : ["general", "categorias"]
            }
            className="mt-6 w-full"
          >
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="general">
                <RiInformationLine data-icon="inline-start" />
                General
              </TabsTrigger>
              <TabsTrigger value="categorias">
                <RiPriceTag3Line data-icon="inline-start" />
                Categorías
              </TabsTrigger>
              {isMember ? (
                <>
                  <TabsTrigger value="equipo">
                    <RiTeamLine data-icon="inline-start" />
                    Equipo
                  </TabsTrigger>
                  <TabsTrigger value="observaciones">
                    <RiChat3Line data-icon="inline-start" />
                    Observaciones
                  </TabsTrigger>
                  <TabsTrigger value="hitos">
                    <RiFlagLine data-icon="inline-start" />
                    Hitos
                  </TabsTrigger>
                  <TabsTrigger value="entregas">
                    <RiFileCheckLine data-icon="inline-start" />
                    Entregas
                  </TabsTrigger>
                  <TabsTrigger value="anexos">
                    <RiAttachmentLine data-icon="inline-start" />
                    Anexos
                  </TabsTrigger>
                  <TabsTrigger value="historial">
                    <RiHistoryLine data-icon="inline-start" />
                    Historial
                  </TabsTrigger>
                </>
              ) : null}
            </TabsList>

            <TabsContent value="general" className="mt-6 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proponente</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.proposer ? (
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            Nombre completo
                          </TableCell>
                          <TableCell className="text-right">
                            {project.proposer.fullName}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            Cédula
                          </TableCell>
                          <TableCell className="text-right">
                            {project.proposer.idNumber ?? "Sin información"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            Correo
                          </TableCell>
                          <TableCell className="text-right">
                            {project.proposer.email}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">
                      Sin información del proponente.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contexto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {project.context}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fuente del proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {project.source
                      ? formatProjectSource(project.source)
                      : "Sin información"}
                  </p>
                </CardContent>
              </Card>

              {project.facultyAdvisor ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Asesor de la facultad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {project.facultyAdvisor}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {project.teamRequirements ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Equipo requerido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-muted-foreground">
                      {project.teamRequirements}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {project.deliverables && project.deliverables.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Entregables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {project.deliverables.map((deliverable) => (
                        <li key={deliverable.id}>{deliverable.description}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}

              {project.expectedOutcomes ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Expectativas al finalizar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-muted-foreground">
                      {project.expectedOutcomes}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Proceso de legalización</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {project.requiresLegalization
                      ? "El proyecto requiere proceso de legalización (contrato de confidencialidad, convenio u otros trámites con el proponente)."
                      : "El proyecto no requiere proceso de legalización."}
                  </p>
                </CardContent>
              </Card>

              {project.startDate || project.estimatedCost ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Fechas y costos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            Inicio
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(project.startDate)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            Costo estimado
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(project.estimatedCost)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="categorias" className="mt-6">
              <ProjectCategoriesPanel categories={project.categories} />
            </TabsContent>

            {isMember ? (
              <>
                <TabsContent value="equipo" className="mt-6">
                  <ProjectActorAssignmentPanel
                    projectId={project.id}
                    assignments={project.actorAssignments ?? []}
                  />
                </TabsContent>

                <TabsContent value="observaciones" className="mt-6">
                  <ProjectObservationsPanel
                    projectId={project.id}
                    observations={project.observations ?? []}
                    assignments={project.actorAssignments ?? []}
                  />
                </TabsContent>

                <TabsContent value="hitos" className="mt-6">
                  <ProjectMilestonesPanel
                    projectId={project.id}
                    milestones={project.milestones ?? []}
                    actorAssignments={project.actorAssignments ?? []}
                  />
                </TabsContent>

                <TabsContent value="entregas" className="mt-6">
                  <ProjectReportsPanel
                    projectId={project.id}
                    reports={project.reports ?? []}
                    actorAssignments={project.actorAssignments ?? []}
                  />
                </TabsContent>

                <TabsContent value="anexos" className="mt-6">
                  <ProjectAttachmentsPanel
                    projectId={project.id}
                    attachments={project.attachments ?? []}
                    assignments={project.actorAssignments ?? []}
                  />
                </TabsContent>

                <TabsContent value="historial" className="mt-6">
                  <ProjectStatusHistoryPanel
                    history={project.statusHistory ?? []}
                  />
                </TabsContent>
              </>
            ) : null}
          </ProjectTabs>
          </CardContent>
        </Card>

        {isMember ? (
          <div className="mt-6 flex w-full justify-end">
            <ProjectStatusEditForm
              projectId={project.id}
              currentStatus={project.status}
              assignments={project.actorAssignments ?? []}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default ProjectDetailsView;
