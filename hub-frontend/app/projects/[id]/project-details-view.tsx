"use client";

import ProjectStatusEditForm from "../../components/project-status-edit-form";
import ProjectCategoriesPanel from "./project-categories-panel";
import ProjectDetailsBadges from "./project-details-badges";
import ProjectDetailsHeader from "./project-details-header";
import ProjectDetailsSkeleton from "./project-details-skeleton";
import ProjectGeneralTab from "./project-general-tab";
import ProjectMemberTabs from "./project-member-tabs";
import ProjectMissingState from "./project-missing-state";
import ProjectTabs from "./project-tabs";
import { visibleProjectTabs } from "./project-tabs-config";
import { useIsProjectMember } from "./use-is-project-member";
import { useProjectDetails } from "./use-project-details";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ProjectTabsList({ isMember }: { isMember: boolean }) {
  return (
    <TabsList className="w-full sm:w-fit">
      {visibleProjectTabs(isMember).map(({ value, label, Icon }) => (
        <TabsTrigger key={value} value={value}>
          <Icon data-icon="inline-start" />
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export default function ProjectDetailsView({ id }: { id: string }) {
  const { project, loading, status } = useProjectDetails(id);
  const isMember = useIsProjectMember(project);

  if (loading) {
    return <ProjectDetailsSkeleton />;
  }

  if (!project) {
    return <ProjectMissingState status={status} />;
  }

  const assignments = project.actorAssignments ?? [];

  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProjectDetailsHeader project={project} isMember={isMember} />

        <Card>
          <CardContent>
            <ProjectDetailsBadges project={project} />

            <ProjectTabs
              defaultTab="general"
              validTabs={visibleProjectTabs(isMember).map((tab) => tab.value)}
              className="mt-6 w-full"
            >
              <ProjectTabsList isMember={isMember} />

              <TabsContent value="general" className="mt-6 flex flex-col gap-6">
                <ProjectGeneralTab project={project} />
              </TabsContent>

              <TabsContent value="categorias" className="mt-6">
                <ProjectCategoriesPanel categories={project.categories} />
              </TabsContent>

              {isMember ? (
                <ProjectMemberTabs
                  project={project}
                  assignments={assignments}
                />
              ) : null}
            </ProjectTabs>
          </CardContent>
        </Card>

        {isMember ? (
          <div className="mt-6 flex w-full justify-end">
            <ProjectStatusEditForm
              projectId={project.id}
              currentStatus={project.status}
              assignments={assignments}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
