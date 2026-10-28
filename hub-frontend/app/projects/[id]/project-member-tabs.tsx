import { ProjectDetails } from "../../services/schemas";
import ProjectActorAssignmentPanel from "./project-actor-assignment-panel";
import ProjectObservationsPanel from "./project-observations-panel";
import ProjectMilestonesPanel from "./project-milestones-panel";
import ProjectReportsPanel from "./project-reports-panel";
import ProjectAttachmentsPanel from "./project-attachments-panel";
import ProjectStatusHistoryPanel from "./project-status-history-panel";
import ProjectChangeHistoryPanel from "./project-change-history-panel";
import ProjectEvaluationTab from "./project-evaluation-tab";
import { TabsContent } from "@/components/ui/tabs";

type ProjectMemberTabsProps = {
  readonly project: ProjectDetails;
  /** Asignaciones del proyecto, ya normalizadas por la vista. */
  readonly assignments: NonNullable<ProjectDetails["actorAssignments"]>;
  readonly canViewEvaluation: boolean;
  /**
   * Recarga en segundo plano el detalle del proyecto. Los paneles la llaman tras
   * una mutación para reflejar los cambios sin recargar la página.
   */
  readonly onProjectChange: () => Promise<void>;
};

/** Pestañas internas: solo se renderizan para miembros del proyecto. */
export default function ProjectMemberTabs({
  project,
  assignments,
  canViewEvaluation,
  onProjectChange,
}: ProjectMemberTabsProps) {
  return (
    <>
      <TabsContent value="equipo" className="mt-6">
        <ProjectActorAssignmentPanel
          projectId={project.id}
          assignments={assignments}
          onProjectChange={onProjectChange}
        />
      </TabsContent>

      <TabsContent value="observaciones" className="mt-6">
        <ProjectObservationsPanel
          projectId={project.id}
          observations={project.observations ?? []}
          assignments={assignments}
          onProjectChange={onProjectChange}
        />
      </TabsContent>

      <TabsContent value="hitos" className="mt-6">
        <ProjectMilestonesPanel
          projectId={project.id}
          milestones={project.milestones ?? []}
          actorAssignments={assignments}
          projectPhase={project.phase ?? null}
          reports={project.reports ?? []}
          onProjectChange={onProjectChange}
        />
      </TabsContent>

      <TabsContent value="entregas" className="mt-6">
        <ProjectReportsPanel
          projectId={project.id}
          reports={project.reports ?? []}
          actorAssignments={assignments}
          onProjectChange={onProjectChange}
        />
      </TabsContent>

      {canViewEvaluation ? (
        <TabsContent value="evaluacion" className="mt-6">
          <ProjectEvaluationTab
            project={project}
            onProjectChange={onProjectChange}
          />
        </TabsContent>
      ) : null}

      <TabsContent value="anexos" className="mt-6">
        <ProjectAttachmentsPanel
          projectId={project.id}
          attachments={project.attachments ?? []}
          assignments={assignments}
          onProjectChange={onProjectChange}
        />
      </TabsContent>

      <TabsContent value="historial" className="mt-6">
        <div className="flex flex-col gap-6">
          <ProjectChangeHistoryPanel history={project.changeHistory ?? []} />
          <ProjectStatusHistoryPanel history={project.statusHistory ?? []} />
        </div>
      </TabsContent>
    </>
  );
}
