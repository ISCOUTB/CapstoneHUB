import SubmitProjectForm from "../components/submit-project-form";
import ModuleHeader from "../components/module-header";

export default function SubmitPage() {
  return (
    <main className="flex-1 text-foreground">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ModuleHeader
          eyebrow="Nueva propuesta"
          title="Proponer un proyecto"
          subtitle="Describe la iniciativa y el contexto en el que se desarrollará. La propuesta quedará registrada para revisión del comité."
          accentColor="rgba(56,189,248,0.34)"
        />

        <SubmitProjectForm />
      </section>
    </main>
  );
}
