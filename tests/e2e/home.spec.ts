import { expect, test } from "@playwright/test";

test("home page exposes the login panel", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /handal orchestre/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /se connecter/i }),
  ).toBeVisible();
});

test("login mode toggle switches placeholder", async ({ page }) => {
  await page.goto("/");

  const loginInput = page.locator('input[autocomplete="username"]');
  await expect(loginInput).toHaveAttribute("placeholder", /N0/);

  await page.getByRole("button", { name: "Personnel" }).click();
  await expect(loginInput).toHaveAttribute("placeholder", /handal\.local/);

  await page.getByRole("button", { name: "Etudiant" }).click();
  await expect(loginInput).toHaveAttribute("placeholder", /N0/);
});

test("demo account selector pre-fills the form", async ({ page }) => {
  await page.goto("/");

  await page.selectOption("select", "teacher");
  const loginInput = page.locator('input[autocomplete="username"]');
  await expect(loginInput).toHaveValue(/handal\.local/);
});

test("invalid login shows error message", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Etudiant" }).click();
  await page.locator('input[autocomplete="username"]').fill("N01331820231");
  await page.locator('input[autocomplete="current-password"]').fill("wrong-password");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.locator("body")).toContainText(
    /identifiant ou mot de passe incorrect|invalid credentials/i,
  );
});

test("student login redirects to /student", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Etudiant" }).click();
  await page.locator('input[autocomplete="username"]').fill("N01331820231");
  await page.locator('input[autocomplete="current-password"]').fill("mon926732");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/student/);
  await expect(page.locator("body")).toContainText(/HANDAL/i);
});

test("staff login redirects to role dashboard", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Personnel" }).click();
  await page.locator('input[autocomplete="username"]').fill("teacher@handal.local");
  await page.locator('input[autocomplete="current-password"]').fill("mon926732");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/teacher/);
  await expect(page.locator("body")).toContainText(/Tableau de Bord/i);
});

test("unauthenticated access to /student redirects to home", async ({ page }) => {
  await page.goto("/student");
  await page.waitForURL(/\//);
  await expect(
    page.getByRole("button", { name: /se connecter/i }),
  ).toBeVisible();
});

test("navbar links are present on home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /connexion/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /solutions/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /workflow/i })).toBeVisible();
});
