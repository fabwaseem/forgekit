import { expect, test } from "@playwright/test";

test("landing page explains the starter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ship an AI product, not a single chat box." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
});

test("sign-in form accepts email and password", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("theme toggle switches the document class", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /theme/i });
  await expect(html).not.toHaveClass(/dark/);
  await toggle.click();
  await expect(html).toHaveClass(/dark/);
  await toggle.click();
  await expect(html).not.toHaveClass(/dark/);
});
