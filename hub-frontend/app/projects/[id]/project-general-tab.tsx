import { Fragment, type ReactNode } from "react";
import { ProjectDetails } from "../../services/schemas";
import { formatProjectSource } from "@/app/services/utils";
import { formatCurrency, formatDate } from "./project-formatters";
import { Separator } from "@/components/ui/separator";

type ProjectGeneralTabProps = {
  readonly project: ProjectDetails;
};

/** Sección de texto simple: título y contenido, sin tarjeta propia. */
function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function ProjectGeneralTab({
  project,
}: ProjectGeneralTabProps) {
  const hasDeliverables = Boolean(
    project.deliverables && project.deliverables.length > 0,
  );
  const hasDatesAndCost = Boolean(
    project.startDate ||
      project.endDate ||
      project.location ||
      project.estimatedCost,
  );

  const sections: { title: string; content: ReactNode }[] = [
    {
      title: "Proponente",
      content: project.proposer ? (
        <div className="flex flex-col gap-1">
          <p>
            <span className="font-medium text-foreground">Nombre:</span>{" "}
            {project.proposer.fullName}
          </p>
          <p>
            <span className="font-medium text-foreground">Cédula:</span>{" "}
            {project.proposer.idNumber ?? "Sin información"}
          </p>
          <p>
            <span className="font-medium text-foreground">Correo:</span>{" "}
            {project.proposer.email ?? "Sin información"}
          </p>
        </div>
      ) : (
        <p>Sin información del proponente.</p>
      ),
    },
    {
      title: "Descripción",
      content: <p className="whitespace-pre-line">{project.description}</p>,
    },
    {
      title: "Contexto",
      content: <p className="whitespace-pre-line">{project.context}</p>,
    },
    {
      title: "Fuente del proyecto",
      content: (
        <p>
          {project.source
            ? formatProjectSource(project.source)
            : "Sin información"}
        </p>
      ),
    },
  ];

  if (project.engineeringArea) {
    const engineeringAreas: Record<string, string> = {
      systems: "Ingeniería de Sistemas",
      industrial: "Ingeniería Industrial",
      civil: "Ingeniería Civil",
      electrical: "Ingeniería Eléctrica y Electrónica",
      mechanical: "Ingeniería Mecánica",
      environmental: "Ingeniería Ambiental",
      other: "Otra área o ingeniería",
    };

    sections.push({
      title: "Área o ingeniería",
      content: <p>{engineeringAreas[project.engineeringArea] ?? project.engineeringArea}</p>,
    });
  }

  if (project.projectScope) {
    sections.push({
      title: "Alcance del proyecto",
      content: <p className="whitespace-pre-line">{project.projectScope}</p>,
    });
  }

  if (project.facultyAdvisors && project.facultyAdvisors.length > 0) {
    sections.push({
      title: "Profesores de contacto",
      content: (
        <ul className="list-disc space-y-1 pl-5">
          {project.facultyAdvisors.map((advisor) => (
            <li key={advisor}>{advisor}</li>
          ))}
        </ul>
      ),
    });
  } else if (project.facultyAdvisor) {
    sections.push({
      title: "Asesor de la facultad",
      content: <p>{project.facultyAdvisor}</p>,
    });
  }

  if (project.source === "external_entity") {
    const externalDetails = [
      project.externalNit ? `NIT: ${project.externalNit}` : null,
      project.externalAdvisorName ? `Asesor externo: ${project.externalAdvisorName}` : null,
      project.externalAdvisorEmail ? `Correo: ${project.externalAdvisorEmail}` : null,
    ].filter(Boolean);

    if (externalDetails.length > 0) {
      sections.push({
        title: "Contacto externo",
        content: (
          <div className="flex flex-col gap-1">
            {externalDetails.map((detail) => <p key={detail}>{detail}</p>)}
          </div>
        ),
      });
    }
  }

  if (project.researchGroup) {
    sections.push({
      title: "Grupo de investigación",
      content: <p>{project.researchGroup}</p>,
    });
  }

  if (project.socialOrganization || project.socialLocation || project.socialNit) {
    sections.push({
      title: "Información de impacto social",
      content: (
        <div className="flex flex-col gap-1">
          {project.socialOrganization && <p>Junta de Acción Comunal: {project.socialOrganization}</p>}
          {project.socialNit && <p>NIT: {project.socialNit}</p>}
          {project.socialLocation && <p>Localización: {project.socialLocation}</p>}
        </div>
      ),
    });
  }

  if (project.monetaryResources) {
    const resourcesLabels: Record<string, string> = {
      yes: "Sí",
      no: "No",
      na: "N/A",
    };

    sections.push({
      title: "Recursos monetarios",
      content: (
        <div className="flex flex-col gap-1">
          <p>{resourcesLabels[project.monetaryResources] ?? project.monetaryResources}</p>
          {project.monetaryResourcesDescription && (
            <p className="whitespace-pre-line">{project.monetaryResourcesDescription}</p>
          )}
        </div>
      ),
    });
  }

  if (project.teamRequirements) {
    sections.push({
      title: "Equipo requerido",
      content: (
        <p className="whitespace-pre-line">{project.teamRequirements}</p>
      ),
    });
  }

  if (hasDeliverables) {
    sections.push({
      title: "Entregables",
      content: (
        <ul className="list-disc space-y-1 pl-5">
          {project.deliverables?.map((deliverable) => (
            <li key={deliverable.id}>{deliverable.description}</li>
          ))}
        </ul>
      ),
    });
  }

  if (project.expectedOutcomes) {
    sections.push({
      title: "Expectativas al finalizar",
      content: (
        <p className="whitespace-pre-line">{project.expectedOutcomes}</p>
      ),
    });
  }

  sections.push({
    title: "Proceso de legalización",
    content: (
      <p>
        {project.requiresLegalization
          ? "El proyecto requiere proceso de legalización (contrato de confidencialidad, convenio u otros trámites con el proponente)."
          : "El proyecto no requiere proceso de legalización."}
      </p>
    ),
  });

  if (hasDatesAndCost) {
    sections.push({
      title: "Fechas, ubicación y costos",
      content: (
        <div className="flex flex-col gap-1">
          <p>
            <span className="font-medium text-foreground">Inicio:</span>{" "}
            {project.startDate
              ? formatDate(project.startDate)
              : "Sin información"}
          </p>
          <p>
            <span className="font-medium text-foreground">Fin:</span>{" "}
            {project.endDate ? formatDate(project.endDate) : "Sin información"}
          </p>
          <p>
            <span className="font-medium text-foreground">Ubicación:</span>{" "}
            {project.location ?? "Sin información"}
          </p>
          <p>
            <span className="font-medium text-foreground">
              Costo estimado:
            </span>{" "}
            {formatCurrency(project.estimatedCost)}
          </p>
        </div>
      ),
    });
  }

  return (
    <div className="flex flex-col">
      <p className="mb-4 text-right text-xs text-muted-foreground">
        Creado el {formatDate(project.createdAt)}
      </p>

      {sections.map((section, index) => (
        <Fragment key={section.title}>
          {index > 0 ? <Separator className="my-5" /> : null}
          <Section title={section.title}>{section.content}</Section>
        </Fragment>
      ))}
    </div>
  );
}
