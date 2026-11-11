import { expect, test } from "@playwright/test";

test("abre Guías desde la sidebar y muestra los manuales por rol", async ({
  page,
}) => {
  await page.goto("/projects");

  const menuButton = page.getByRole("button", {
    name: "Abrir menú",
    exact: true,
  });

  if (await menuButton.isVisible()) {
    await menuButton.click();
  }

  await page.getByRole("link", { name: "Guías", exact: true }).click();

  await expect(page).toHaveURL(/\/guides$/);
  await expect(
    page.getByRole("heading", { name: "Guías y documentos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Manuales de usuario" }),
  ).toBeVisible();

  for (const role of [
    "Estudiante",
    "Docente",
    "Evaluador",
    "Directivo",
    "Administrador",
    "Proponente",
  ]) {
    await expect(page.getByRole("tab", { name: role })).toBeVisible();
  }

  await page.getByRole("tab", { name: "Docente", exact: true }).click();
  await expect(page.getByText("Manual del docente", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Documentos", exact: true }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("filtra los documentos desde la búsqueda", async ({ page }) => {
  await page.goto("/guides");

  const search = page.getByRole("textbox", { name: "Buscar documentos" });

  await expect(search).toBeVisible();
  await expect(page.getByText(/^\d+ documentos?$/)).toBeVisible();

  await search.fill("zzzz-sin-resultados");

  await expect(page.getByText("No encontramos documentos")).toBeVisible();
  await expect(page.getByText(/^0 documentos?$/)).toBeVisible();

  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(search).toHaveValue("");
});
