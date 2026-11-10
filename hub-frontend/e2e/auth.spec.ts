import { expect, test } from "@playwright/test";
import { PASSWORD, registerProposer, uniqueEmail } from "./support";

test("inicia sesión y muestra el menú de perfil", async ({ page, request }) => {
  const email = uniqueEmail();
  await registerProposer(request, email);

  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page).toHaveURL(/\/home/);
  await page.getByRole("heading", { name: "Inicio" }).waitFor();
  await expect(
    page.getByText("Mis proyectos", { exact: true }),
  ).toBeVisible();

  // En móvil los enlaces de usuario viven en el drawer de la sidebar.
  const menuButton = page.getByRole("button", {
    name: "Abrir menú",
    exact: true,
  });
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }

  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "Mi perfil" })).toBeVisible();

  // El drawer es modal: hay que cerrarlo para abrir el menú de perfil.
  const closeMenuButton = page.getByRole("button", {
    name: "Cerrar menú",
    exact: true,
  });
  if (await closeMenuButton.isVisible()) {
    await closeMenuButton.click();
  }

  const profileTrigger = page.getByRole("button", {
    name: "Abrir menú de perfil",
  });
  const profileMenu = page.locator('[data-slot="dropdown-menu-content"]');

  // La navbar termina de hidratar después del primer render; se reintenta el
  // click hasta que el menú exista, sin esperas fijas.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await profileMenu.isVisible()) {
      break;
    }

    await profileTrigger.click();
    const opened = await profileMenu
      .waitFor({ state: "visible", timeout: 1000 })
      .then(() => true)
      .catch(() => false);

    if (opened) {
      break;
    }
  }

  await expect(profileMenu).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Mi perfil" })).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Cerrar sesión" }),
  ).toBeVisible();
});

test("la landing pública no monta el chrome de la app", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Gestión de proyectos/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Iniciar sesión" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }),
  ).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(0);
});

test("redirige /home al login cuando no hay sesión", async ({ page }) => {
  await page.goto("/home");

  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)home/);
});

test("muestra un error con credenciales inválidas", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("no-existe@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("mala-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(
    page.getByText("Correo o contraseña incorrectos."),
  ).toBeVisible();
});
