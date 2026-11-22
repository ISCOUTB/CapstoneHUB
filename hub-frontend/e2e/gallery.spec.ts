import { expect, test, type Page } from "@playwright/test";

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

function makeProject(
  overrides: Partial<typeof finishedProject> & {
    id: number;
    name: string;
  },
) {
  return { ...finishedProject, ...overrides };
}

async function mockProjects(page: Page, projects: typeof finishedProject[]) {
  const requestedUrls: string[] = [];

  await page.route(/\/api\/projects\?/, async (route) => {
    const url = new URL(route.request().url());
    requestedUrls.push(url.toString());

    const search = (url.searchParams.get("search") ?? "").toLocaleLowerCase(
      "es",
    );
    const source = url.searchParams.get("source");
    const year = url.searchParams.get("year");

    const filtered = projects.filter((project) => {
      const matchesSearch =
        !search ||
        `${project.name} ${project.description} ${
          project.proposer?.fullName ?? ""
        }`
          .toLocaleLowerCase("es")
          .includes(search);

      const matchesSource = !source || project.source === source;
      const matchesYear =
        !year || (project.startDate?.startsWith(`${year}-`) ?? false);

      return matchesSearch && matchesSource && matchesYear;
    });

    await route.fulfill({ json: filtered });
  });

  return requestedUrls;
}

test("muestra los proyectos finalizados públicos sin sesión", async ({
  page,
}) => {
  const requestedUrls = await mockProjects(page, [finishedProject]);

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
  await expect(
    page.getByText("Filtros rápidos", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Fuente", exact: true }),
  ).toBeVisible();

  const params = new URL(requestedUrls[0]).searchParams;

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

test("busca proyectos y sincroniza el término en la URL", async ({
  page,
}) => {
  const projects = [
    makeProject({
      id: 1,
      name: "Cacao Blockchain",
      description: "Trazabilidad del cacao fino de aroma.",
      source: "research",
      startDate: "2025-01-15",
    }),
    makeProject({
      id: 2,
      name: "Puentes de Hormigón",
      description: "Monitoreo estructural de puentes.",
      source: "internal_need",
      startDate: "2024-03-10",
    }),
  ];
  const requestedUrls = await mockProjects(page, projects);

  await page.goto("/gallery");
  await page
    .getByRole("searchbox", { name: "Buscar en la galería" })
    .fill("cacao");

  await expect(
    page.getByRole("link", { name: "Ver el proyecto Cacao Blockchain" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver el proyecto Puentes de Hormigón" }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/q=cacao/);
  await expect
    .poll(() =>
      requestedUrls.some(
        (value) => new URL(value).searchParams.get("search") === "cacao",
      ),
    )
    .toBe(true);
});

test("filtra por fuente y restaura el filtro desde la URL", async ({
  page,
}) => {
  const projects = [
    makeProject({
      id: 1,
      name: "Cacao Blockchain",
      source: "research",
    }),
    makeProject({
      id: 2,
      name: "Puentes de Hormigón",
      source: "internal_need",
    }),
  ];
  const requestedUrls = await mockProjects(page, projects);

  await page.goto("/gallery?fuente=research");

  await page.getByRole("button", { name: /Fuente/ }).click();

  const sourceFilter = page.getByRole("checkbox", {
    name: "Investigación",
  });
  await expect(sourceFilter).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("link", { name: "Ver el proyecto Cacao Blockchain" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver el proyecto Puentes de Hormigón" }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      requestedUrls.some(
        (value) =>
          new URL(value).searchParams.get("source") === "research",
      ),
    )
    .toBe(true);
});

test("filtra por año y refleja la selección en la URL", async ({ page }) => {
  const projects = [
    makeProject({ id: 1, name: "Proyecto 2025", startDate: "2025-01-15" }),
    makeProject({ id: 2, name: "Proyecto 2024", startDate: "2024-03-10" }),
  ];
  const requestedUrls = await mockProjects(page, projects);

  await page.goto("/gallery");
  await page.getByRole("button", { name: "Año", exact: true }).click();
  await page.getByRole("checkbox", { name: "2024" }).click();
  await page.keyboard.press("Escape");

  await expect(
    page.getByRole("link", { name: "Ver el proyecto Proyecto 2024" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver el proyecto Proyecto 2025" }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/anio=2024/);
  await expect
    .poll(() =>
      requestedUrls.some(
        (value) => new URL(value).searchParams.get("year") === "2024",
      ),
    )
    .toBe(true);
});

test("pagina los resultados de nueve en nueve", async ({ page }) => {
  const projects = Array.from({ length: 12 }, (_, index) =>
    makeProject({
      id: index + 1,
      name: `Proyecto ${index + 1}`,
      startDate: `${2025 - Math.floor(index / 3)}-01-15`,
    }),
  );
  await mockProjects(page, projects);

  await page.goto("/gallery");

  const cards = page.getByRole("link", { name: /Ver el proyecto Proyecto/ });
  await expect(cards).toHaveCount(9);
  await expect(page.getByLabel("Página")).toHaveValue("1");

  await page.getByRole("button", { name: "Siguiente" }).click();

  await expect(cards).toHaveCount(3);
  await expect(page.getByLabel("Página")).toHaveValue("2");
});

test("limpia los filtros cuando la búsqueda no tiene resultados", async ({
  page,
}) => {
  const projects = [
    makeProject({ id: 1, name: "Proyecto Uno" }),
    makeProject({ id: 2, name: "Proyecto Dos" }),
  ];
  await mockProjects(page, projects);

  await page.goto("/gallery");
  await page
    .getByRole("searchbox", { name: "Buscar en la galería" })
    .fill("sin-resultados");

  await expect(
    page.getByText("No hay proyectos con esos filtros", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Limpiar filtros" }).first().click();

  await expect(
    page.getByRole("link", { name: "Ver el proyecto Proyecto Uno" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/gallery$/);
});
