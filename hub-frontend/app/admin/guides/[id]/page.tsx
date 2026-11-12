import type { Metadata } from "next";
import GuideDocumentForm from "../guide-document-form";

export const metadata: Metadata = {
  title: "Editar documento | CapstoneHUB",
};

export const dynamic = "force-dynamic";

export default async function EditGuideDocumentPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <GuideDocumentForm documentId={Number(id)} />;
}
