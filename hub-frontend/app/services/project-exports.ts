import { getApiUrl } from "@/lib/api";
import { downloadResponseFile } from "@/lib/download";
import { ensureOk } from "@/lib/http";

/** Descarga el libro general con todos los proyectos visibles para el usuario. */
export async function downloadProjectsExcel(): Promise<void> {
  const response = await fetch(getApiUrl("/api/projects/export/excel"), {
    cache: "no-store",
  });

  await ensureOk(response, { action: "generar el Excel de proyectos" });
  await downloadResponseFile(response, "capstonehub-proyectos.xlsx");
}
