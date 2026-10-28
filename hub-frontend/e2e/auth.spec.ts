import { expect, test } from "@playwright/test";
import { PASSWORD, registerProposer, uniqueEmail } from "./support";

test("inicia sesión y muestra el menú de perfil", async ({ page, request }) => {
  const email = uniqueEmail();
  await registerProposer(request, email);

  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page).toHaveURL(/\/projects/);
  await page.getByRole("heading", { name: "Lista de proyectos" }).waitFor();

  // En móvil el widget de perfil vive en el menú hamburguesa.
  const menuButton = page.getByRole("button", { name: "Abrir menú" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }

  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "Mi perfil" })).toBeVisible();

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

test("muestra un error con credenciales inválidas", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("no-existe@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("mala-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(
    page.getByText("Correo o contraseña incorrectos."),
  ).toBeVisible();
});
