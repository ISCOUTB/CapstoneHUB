import ModuleHeader from "../../components/module-header";
import { formatDate } from "./project-formatters";
import { ProjectDetails } from "../../services/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ProjectDetailsHeaderProps = {
  project: ProjectDetails;
  isMember: boolean;
};

/** Encabezado del detalle: título del módulo y aviso de vista pública. */
export default function ProjectDetailsHeader({
  project,
  isMember,
}: ProjectDetailsHeaderProps) {
  return (
    <>
      <ModuleHeader
        eyebrow={`Proyecto #${project.id}`}
        title={project.name}
        subtitle={`Creado el ${formatDate(project.createdAt)}`}
      />

      {!isMember ? (
        <Alert className="mb-6">
          <AlertDescription>
            Estás viendo la información pública de un proyecto finalizado. El
            equipo, las observaciones, los anexos, los hitos y las entregas solo
            son visibles para el proponente, los actores asignados y los
            evaluadores.
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
