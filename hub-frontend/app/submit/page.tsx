import SubmitProjectForm from "../components/submit-project-form";
import PageFrame from "../components/page-frame";

export default function SubmitPage() {
  return (
    <PageFrame
      eyebrow="Nueva propuesta"
      title="Proponer un proyecto"
      accentColor="rgba(56,189,248,0.34)"
      maxWidth="max-w-4xl"
    >
      <SubmitProjectForm />
    </PageFrame>
  );
}
