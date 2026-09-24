import { ProjectDetails } from "../../services/schemas";
import ProjectActorAssignmentPanel from "./project-actor-assignment-panel";
import ProjectObservationsPanel from "./project-observations-panel";
import ProjectMilestonesPanel from "./project-milestones-panel";
import ProjectReportsPanel from "./project-reports-panel";
import ProjectAttachmentsPanel from "./project-attachments-panel";
import ProjectStatusHistoryPanel from "./project-status-history-panel";
import { TabsContent } from "@/components/ui/tabs";

type ProjectMemberTabsProps = {
  project: ProjectDetails;
  /** Asignaciones del proyecto, ya normalizadas por la vista. */
  assignments: NonNullable<ProjectDetails["actorAssignments"]>;
};

/** Pestañas internas: solo se renderizan para miembros del proyecto. */
export default function ProjectMemberTabs({
  project,
  assignments,
}: ProjectMemberTabsProps) {
  return (
    <>
      <TabsContent value="equipo" className="mt-6">
        <ProjectActorAssignmentPanel
          projectId={project.id}
          assignments={assignments}
        />
      </TabsContent>

      <TabsContent value="observaciones" className="mt-6">
        <ProjectObservationsPanel
          projectId={project.id}
          observations={project.observations ?? []}
          assignments={assignments}
        />
      </TabsContent>

      <TabsContent value="hitos" className="mt-6">
        <ProjectMilestonesPanel
          projectId={project.id}
          milestones={project.milestones ?? []}
          actorAssignments={assignments}
        />
      </TabsContent>

      <TabsContent value="entregas" className="mt-6">
        <ProjectReportsPanel
          projectId={project.id}
          reports={project.reports ?? []}
          actorAssignments={assignments}
        />
      </TabsContent>

      <TabsContent value="anexos" className="mt-6">
        <ProjectAttachmentsPanel
          projectId={project.id}
          attachments={project.attachments ?? []}
          assignments={assignments}
        />
      </TabsContent>

      <TabsContent value="historial" className="mt-6">
        <ProjectStatusHistoryPanel history={project.statusHistory ?? []} />
      </TabsContent>
    </>
  );
}
