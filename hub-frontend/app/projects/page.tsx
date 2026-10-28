import PageFrame from "../components/page-frame";
import ProjectsExplorer from "./projects-explorer";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return (
    <PageFrame eyebrow="Gestión de proyectos" title="Lista de proyectos">
      <ProjectsExplorer />
    </PageFrame>
  );
}
