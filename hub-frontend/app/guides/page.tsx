import type { Metadata } from "next";
import PageFrame from "../components/page-frame";
import GuidesExplorer from "./guides-explorer";

export const metadata: Metadata = {
  title: "Guías y documentos | CapstoneHUB",
};

export default function GuidesPage() {
  return (
    <PageFrame
      eyebrow="Recursos"
      title="Guías y documentos"
      accentColor="rgba(45,212,191,0.32)"
      maxWidth="max-w-6xl"
    >
      <GuidesExplorer />
    </PageFrame>
  );
}
