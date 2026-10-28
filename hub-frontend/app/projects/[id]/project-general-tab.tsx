import { Fragment, type ReactNode } from "react";
import { ProjectDetails } from "../../services/schemas";
import { formatProjectSource } from "@/app/services/utils";
import { formatCurrency, formatDate } from "./project-formatters";
import { Separator } from "@/components/ui/separator";

type ProjectGeneralTabProps = {
  readonly project: ProjectDetails;
};

type ProjectSection = { title: string; content: ReactNode };

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

function getBaseSections(project: ProjectDetails): ProjectSection[] {
  return [
    {
      title: "Proponente",
      content: project.proposer ? (
        <div className="flex flex-col gap-1">
          <p><span className="font-medium text-foreground">Nombre:</span> {project.proposer.fullName}</p>
          <p><span className="font-medium text-foreground">Cédula:</span> {project.proposer.idNumber ?? "Sin información"}</p>
          <p><span className="font-medium text-foreground">Correo:</span> {project.proposer.email ?? "Sin información"}</p>
        </div>
      ) : <p>Sin información del proponente.</p>,
    },
    { title: "Descripción", content: <p className="whitespace-pre-line">{project.description}</p> },
    { title: "Contexto", content: <p className="whitespace-pre-line">{project.context}</p> },
    {
      title: "Fuente del proyecto",
      content: <p>{project.source ? formatProjectSource(project.source) : "Sin información"}</p>,
    },
  ];
}

function getEngineeringAreaSection(project: ProjectDetails): ProjectSection | null {
  if (!project.engineeringArea) return null;
  const labels: Record<string, string> = {
    systems: "Ingeniería de Sistemas y Computación",
    industrial: "Ingeniería Industrial",
    civil: "Ingeniería Civil",
    electrical: "Ingeniería Eléctrica y Electrónica",
    mechanical: "Ingeniería Mecánica",
    environmental: "Ingeniería Ambiental",
    other: "Otra área o ingeniería",
  };
  const areas = project.engineeringArea.split(",").filter(Boolean);
  return {
    title: "Área o ingeniería",
    content: <ul className="list-disc space-y-1 pl-5">{areas.map((area, index) => <li key={`${area}-${index}`}>{labels[area] ?? area}</li>)}</ul>,
  };
}

function getAdvisorSection(project: ProjectDetails): ProjectSection | null {
  if (project.facultyAdvisors && project.facultyAdvisors.length > 0) {
    return {
      title: "Profesores de contacto",
      content: <ul className="list-disc space-y-1 pl-5">{project.facultyAdvisors.map((advisor, index) => <li key={`${advisor}-${index}`}>{advisor}</li>)}</ul>,
    };
  }
  if (project.facultyAdvisor) {
    return { title: "Asesor de la facultad", content: <p>{project.facultyAdvisor}</p> };
  }
  return null;
}

function getExternalContactSection(project: ProjectDetails): ProjectSection | null {
  if (project.source !== "external_entity") return null;
  const details = [
    project.nit ? `NIT: ${project.nit}` : null,
    project.externalAdvisorName ? `Asesor externo: ${project.externalAdvisorName}` : null,
    project.externalAdvisorEmail ? `Correo: ${project.externalAdvisorEmail}` : null,
  ].filter((detail): detail is string => detail !== null);
  if (details.length === 0) return null;
  return {
    title: "Contacto externo",
    content: <div className="flex flex-col gap-1">{details.map((detail) => <p key={detail}>{detail}</p>)}</div>,
  };
}

function getSocialImpactSection(project: ProjectDetails): ProjectSection | null {
  const hasDetails = Boolean(project.socialOrganization || project.socialLocation || (project.source === "social_impact" && project.nit));
  if (!hasDetails) return null;
  return {
    title: "Información de impacto social",
    content: (
      <div className="flex flex-col gap-1">
        {project.socialOrganization && <p>Junta de Acción Comunal: {project.socialOrganization}</p>}
        {project.nit && <p>NIT: {project.nit}</p>}
        {project.socialLocation && <p>Localización: {project.socialLocation}</p>}
      </div>
    ),
  };
}

function getMonetaryResourcesSection(project: ProjectDetails): ProjectSection | null {
  if (!project.monetaryResources) return null;
  const labels: Record<string, string> = { yes: "Sí", no: "No", na: "N/A" };
  return {
    title: "Recursos monetarios",
    content: (
      <div className="flex flex-col gap-1">
        <p>{labels[project.monetaryResources] ?? project.monetaryResources}</p>
        {project.monetaryResourcesDescription && <p className="whitespace-pre-line">{project.monetaryResourcesDescription}</p>}
      </div>
    ),
  };
}

function getDatesAndCostSection(project: ProjectDetails): ProjectSection | null {
  const hasDetails = Boolean(project.startDate || project.endDate || project.location || project.estimatedCost);
  if (!hasDetails) return null;
  return {
    title: "Fechas, ubicación y costos",
    content: (
      <div className="flex flex-col gap-1">
        <p><span className="font-medium text-foreground">Inicio:</span> {project.startDate ? formatDate(project.startDate) : "Sin información"}</p>
        <p><span className="font-medium text-foreground">Fin:</span> {project.endDate ? formatDate(project.endDate) : "Sin información"}</p>
        <p><span className="font-medium text-foreground">Ubicación:</span> {project.location ?? "Sin información"}</p>
        <p><span className="font-medium text-foreground">Costo estimado:</span> {formatCurrency(project.estimatedCost)}</p>
      </div>
    ),
  };
}

function getOptionalSections(project: ProjectDetails): ProjectSection[] {
  const sections: ProjectSection[] = [];
  const engineering = getEngineeringAreaSection(project);
  const advisor = getAdvisorSection(project);
  const externalContact = getExternalContactSection(project);
  const socialImpact = getSocialImpactSection(project);
  const monetaryResources = getMonetaryResourcesSection(project);
  const datesAndCost = getDatesAndCostSection(project);

  if (engineering) sections.push(engineering);
  if (project.projectScope) sections.push({ title: "Alcance del proyecto", content: <p className="whitespace-pre-line">{project.projectScope}</p> });
  if (advisor) sections.push(advisor);
  if (externalContact) sections.push(externalContact);
  if (project.researchGroup) sections.push({ title: "Grupo de investigación", content: <p>{project.researchGroup}</p> });
  if (socialImpact) sections.push(socialImpact);
  if (monetaryResources) sections.push(monetaryResources);
  if (project.teamRequirements) sections.push({ title: "Equipo requerido", content: <p className="whitespace-pre-line">{project.teamRequirements}</p> });
  if (project.deliverables && project.deliverables.length > 0) {
    sections.push({ title: "Entregables", content: <ul className="list-disc space-y-1 pl-5">{project.deliverables.map((item) => <li key={item.id}>{item.description}</li>)}</ul> });
  }
  if (project.expectedOutcomes) sections.push({ title: "Expectativas al finalizar", content: <p className="whitespace-pre-line">{project.expectedOutcomes}</p> });
  sections.push({
    title: "Proceso de legalización",
    content: <p>{project.requiresLegalization ? "El proyecto requiere proceso de legalización (contrato de confidencialidad, convenio u otros trámites con el proponente)." : "El proyecto no requiere proceso de legalización."}</p>,
  });
  if (datesAndCost) sections.push(datesAndCost);
  return sections;
}

export default function ProjectGeneralTab({ project }: ProjectGeneralTabProps) {
  const sections = [...getBaseSections(project), ...getOptionalSections(project)];

  return (
    <div className="flex flex-col">
      <p className="mb-4 text-right text-xs text-muted-foreground">Creado el {formatDate(project.createdAt)}</p>
      {sections.map((section, index) => (
        <Fragment key={section.title}>
          {index > 0 ? <Separator className="my-5" /> : null}
          <Section title={section.title}>{section.content}</Section>
        </Fragment>
      ))}
    </div>
  );
}
