import { test, expect } from "@playwright/test";

test.describe("IMPERO Smoke Tests", () => {
  test("renders landing page or auth redirect cleanly", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/IMPERO/);
  });

  test("loads auth page with branding and login form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByText("IMPERO").first()).toBeVisible();
  });

  test("landing page renders cleanly with brand tagline", async ({ page }) => {
    await page.goto("/landing");
    await expect(page.getByText("IMPERO").first()).toBeVisible();
  });
});
