import { notFound } from "next/navigation";
import { getProjectById } from "../../services/projects";
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
import { formatStatus, formatProjectSource } from "@/app/services/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  RiAttachmentLine,
  // RiCalendarLine,
  RiChat3Line,
  RiFileCheckLine,
  RiFlagLine,
  RiHistoryLine,
  RiInformationLine,
  RiPriceTag3Line,
  RiTeamLine,
} from "@remixicon/react";

export const dynamic = "force-dynamic";

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

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { project, error } = await getProjectById(id);

  if (!project || error) {
    notFound();
  }

  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ModuleHeader
          eyebrow={`Proyecto #${project.id}`}
          title={project.name}
          subtitle={`Creado el ${formatDate(project.createdAt)}`}
        />

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

          <Tabs defaultValue="general" className="mt-6 w-full">
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="general">
                <RiInformationLine data-icon="inline-start" />
                General
              </TabsTrigger>
              <TabsTrigger value="categorias">
                <RiPriceTag3Line data-icon="inline-start" />
                Categorías
              </TabsTrigger>
              {/* <TabsTrigger value="fechas">
                <RiCalendarLine data-icon="inline-start" />
                Fechas y costos
              </TabsTrigger> */}
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
            </TabsContent>

            <TabsContent value="categorias" className="mt-6">
              <ProjectCategoriesPanel categories={project.categories} />
            </TabsContent>

            <TabsContent value="fechas" className="mt-6 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fechas</CardTitle>
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

              <Card>
                <CardHeader>
                  <CardTitle>Trazabilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Actualizado
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDate(project.updatedAt)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

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
          </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 flex w-full justify-end">
          <ProjectStatusEditForm
            projectId={project.id}
            currentStatus={project.status}
            assignments={project.actorAssignments ?? []}
          />
        </div>
      </section>
    </main>
  );
}
