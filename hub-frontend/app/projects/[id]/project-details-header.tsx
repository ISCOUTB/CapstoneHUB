import ModuleHeader from "../../components/module-header";
import { ProjectDetails } from "../../services/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ProjectDetailsHeaderProps = {
  readonly project: ProjectDetails;
  readonly isMember: boolean;
};

/** Encabezado del detalle: título del módulo y aviso de vista pública. */
export default function ProjectDetailsHeader({
  project,
  isMember,
}: ProjectDetailsHeaderProps) {
  const teamSize = isMember ? (project.actorAssignments?.length ?? 0) : undefined;

  return (
    <>
      <ModuleHeader
        eyebrow={`Proyecto #${project.id}`}
        title={project.name}
        teamSize={teamSize}
      />

      {!isMember ? (
        <Alert className="mb-6">
          <AlertDescription>
            Estás viendo la información pública de un proyecto. El equipo, las
            observaciones, los anexos, los hitos y las entregas solo son
            visibles para el proponente, los actores asignados y los
            directivos.
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
