import { readFile } from "node:fs/promises";
import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  BACKEND_URL,
  PASSWORD,
  registerProposer,
  uniqueEmail,
} from "./support";

/**
 * La descarga del informe la hace un administrador (o un docente asignado). La
 * prueba de descarga necesita una cuenta admin existente, configurada con
 * E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD; sin ellas se omite.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

async function createProjectWithProgram(
  request: APIRequestContext,
  accessToken: string,
  email: string,
): Promise<number> {
  const created = await request.post(`${BACKEND_URL}/projects`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: "Proyecto informe de hitos E2E",
      description: "Descripción del proyecto",
      context: "Contexto del proyecto",
      namep: "Proponente E2E",
      correo: email,
      isPrivate: true,
      source: "internal_need",
      submissionConsentAt: new Date().toISOString(),
      programRequirements: [
        { programId: "ingenieria-industrial", studentCount: 2 },
      ],
    },
  });
  expect(created.ok()).toBe(true);

  const project = (await created.json()) as { id: number };
  return project.id;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/home/);
}

async function openMilestones(page: Page, projectId: number) {
  await page.goto(`/projects/${projectId}`);
  await page.getByRole("tab", { name: "Hitos" }).click();
  await expect(
    page.getByRole("heading", { name: "Evaluación de hitos" }),
  ).toBeVisible();
}

test("el proponente ve la evaluación de hitos sin el botón del informe", async ({
  page,
  request,
}) => {
  const email = uniqueEmail("hitos-proponente");
  const { accessToken } = await registerProposer(request, email);
  const projectId = await createProjectWithProgram(request, accessToken, email);

  await login(page, email, PASSWORD);
  await openMilestones(page, projectId);

  await expect(
    page.getByRole("button", { name: "Descargar informe de hitos" }),
  ).toHaveCount(0);
});

test.describe("informe de hitos como administrador", () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Requiere E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD con un administrador existente",
  );

  test("el administrador descarga el informe de hitos del proyecto", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("hitos-owner");
    const { accessToken } = await registerProposer(request, email);
    const projectId = await createProjectWithProgram(
      request,
      accessToken,
      email,
    );

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await openMilestones(page, projectId);

    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Descargar informe de hitos" })
      .click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^hitos-proyecto-\d+-.+\.pdf$/,
    );

    const filePath = await download.path();
    if (!filePath) {
      throw new Error("La descarga no produjo un archivo.");
    }

    const content = await readFile(filePath);
    expect(content.subarray(0, 4).toString()).toBe("%PDF");
  });
});
