import { expect, test } from "@playwright/test";
import { loadTestData } from "./helpers/test-data";

test.describe("driver cleanup", () => {
  test("deletes the e2e driver after workflows complete", async ({ page }) => {
    const { driver } = loadTestData();

    await page.goto("/drivers");
    const row = page.locator("tbody tr").filter({ hasText: driver.name });
    if ((await row.count()) === 0) {
      test.skip(true, "E2E driver already removed");
    }

    await row.getByRole("button", { name: "Delete" }).click();
    await expect(
      row.getByText(/Their waybills will be unassigned/)
    ).toBeVisible();
    await row.getByRole("button", { name: "Confirm delete" }).click();
    await expect(page.getByRole("cell", { name: driver.name })).toHaveCount(0);
  });
});
