import { expect, test } from "@playwright/test";

const finishedProject = {
  id: 1,
  name: "Proyecto Uno",
  description: "Descripción del proyecto uno.",
  status: "closed",
  phase: "semester_1",
  startDate: "2025-01-15",
  location: "Cartagena",
  requiresLegalization: false,
  isPrivate: false,
  source: "internal_need",
  sourceDetails: null,
  programRequirements: [],
  proposer: {
    type: "natural_person",
    fullName: "Ana Proponente",
    idNumber: null,
    email: null,
  },
  actors: [],
  canViewSensitiveData: false,
  isPrivatePreview: false,
};

test("muestra los proyectos finalizados públicos sin sesión", async ({
  page,
}) => {
  let requestedUrl = "";

  await page.route(/\/api\/projects\?/, async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({ json: [finishedProject] });
  });

  await page.goto("/gallery");

  await expect(
    page.getByRole("heading", { name: "Galería", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver el proyecto Proyecto Uno" }),
  ).toBeVisible();
  await expect(
    page.getByText("Descripción del proyecto uno.", { exact: true }),
  ).toBeVisible();

  const params = new URL(requestedUrl).searchParams;

  expect(params.get("status")).toBe("closed");
  expect(params.get("isPrivate")).toBe("false");
  expect(params.get("sort")).toBe("year-desc");
});

test("muestra el estado vacío cuando no hay proyectos finalizados", async ({
  page,
}) => {
  await page.route(/\/api\/projects\?/, (route) =>
    route.fulfill({ json: [] }),
  );

  await page.goto("/gallery");

  await expect(
    page.getByText("Aún no hay proyectos finalizados", { exact: true }),
  ).toBeVisible();
});
