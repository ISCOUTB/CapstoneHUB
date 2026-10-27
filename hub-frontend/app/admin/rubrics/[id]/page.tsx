import RubricTemplateForm from "../rubric-template-form";

export const dynamic = "force-dynamic";

export default async function EditRubricPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RubricTemplateForm templateId={Number(id)} />;
}
