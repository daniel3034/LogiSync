import { expect, test } from "@playwright/test";
import { adminCredentials } from "./helpers/auth";

test.describe("auth and public entry", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("landing page shows brand and sign-in link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("LogiSync").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("unauthenticated dashboard visit redirects to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "LogiSync" })).toBeVisible();
  });

  test("invalid credentials show an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password-value");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin can sign in with .env credentials", async ({ page }) => {
    const { email, password } = adminCredentials();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Waybill Dashboard" })
    ).toBeVisible();
  });

  test("sign out clears the session", async ({ page }) => {
    const { email, password } = adminCredentials();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Navbar and sidebar both render Sign out; prefer the banner control.
    // Wait for the server-action redirect so we do not abort logout mid-flight.
    await Promise.all([
      page.waitForURL(/\/login/),
      page.getByRole("banner").getByRole("button", { name: "Sign out" }).click(),
    ]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
