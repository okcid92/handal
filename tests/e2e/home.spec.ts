import { expect, test } from "@playwright/test";

test("home page exposes the login panel", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /plateforme académique next.js/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
});