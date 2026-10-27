import { expect, test } from "@playwright/test";
import { PASSWORD, registerProposer, uniqueEmail } from "./support";

test("inicia sesión y cierra sesión", async ({ page, request }) => {
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

  const profileTrigger = page.getByRole("button", {
    name: "Abrir menú de perfil",
  });
  const profileMenu = page.locator('[data-slot="dropdown-menu-content"]');

  // El primer click puede ocurrir antes de que React hidrate la navbar.
  await expect
    .poll(
      async () => {
        if (await profileMenu.isVisible()) {
          return true;
        }
        await profileTrigger.click();
        return profileMenu.isVisible();
      },
      { timeout: 10_000 },
    )
    .toBe(true);

  await expect(page.getByRole("menuitem", { name: "Mi perfil" })).toBeVisible();
  // El menú se desmonta al cerrar sesión; `force` evita esperar actionability
  // sobre un nodo que desaparece durante el click.
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click({
    force: true,
  });
  await expect(page).toHaveURL(/\/login/);
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
