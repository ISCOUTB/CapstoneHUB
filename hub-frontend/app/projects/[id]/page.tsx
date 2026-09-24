import ProjectDetailsView from "./project-details-view";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectDetailsView id={id} />;
}
