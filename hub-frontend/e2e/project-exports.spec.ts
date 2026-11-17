import { expect, test } from "@playwright/test";
import {
  BACKEND_URL,
  PASSWORD,
  registerProposer,
  uniqueEmail,
} from "./support";

test("los roles sin permiso no ven la exportación de proyectos", async ({
  page,
  request,
}) => {
  const email = uniqueEmail("export");
  const { accessToken } = await registerProposer(request, email);

  const created = await request.post(`${BACKEND_URL}/projects`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Proyecto exportación E2E",
      description: "Descripción del proyecto",
      context: "Contexto del proyecto",
      namep: "Proponente E2E",
      correo: email,
      isPrivate: true,
      source: "internal_need",
      submissionConsentAt: new Date().toISOString(),
    },
  });
  expect(created.ok()).toBe(true);
  const project = (await created.json()) as { id: number };

  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/home/);

  await page.goto("/projects");
  await expect(
    page.getByText("Filtros rápidos", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Exportar a Excel" }),
  ).toHaveCount(0);

  await page.goto(`/projects/${project.id}`);
  await expect(
    page.getByRole("heading", { name: "Proyecto exportación E2E" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Descargar PDF" }),
  ).toHaveCount(0);
});
