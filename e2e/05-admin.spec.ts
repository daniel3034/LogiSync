import { expect, test } from "@playwright/test";
import { loadTestData } from "./helpers/test-data";

test.describe.serial("admin operations", () => {
  test("assigns a driver and advances waybill status", async ({ page }) => {
    const { waybill, created } = loadTestData();
    expect(created.waybillId).toBeTruthy();
    expect(created.driverId).toBeTruthy();

    await page.goto("/admin/waybills");
    await expect(
      page.getByRole("heading", { name: "Waybill Driver Assignment" })
    ).toBeVisible();
    await expect(page.getByText("Loading internal assignments...")).toBeHidden();

    const row = page
      .locator("tbody tr")
      .filter({
        hasText: `${waybill.senderName} -> ${waybill.receiverName}`,
      })
      .first();
    await expect(row).toBeVisible();

    const driverSelect = row.locator("td").nth(5).locator("select");
    await driverSelect.selectOption(created.driverId!);
    await expect(driverSelect).toHaveValue(created.driverId!);

    const statusSelect = row.locator("td").nth(6).locator("select");
    await statusSelect.selectOption("in_transit");
    await expect(statusSelect).toHaveValue("in_transit");
  });

  test("saves and removes a route pricing override", async ({ page }) => {
    const { routeOverride } = loadTestData();

    await page.goto("/admin/waybills");
    await expect(
      page.getByRole("heading", { name: "Route Pricing Overrides" })
    ).toBeVisible();

    const overrideCard = page
      .locator("div.rounded-2xl")
      .filter({
        has: page.getByRole("heading", { name: "Route Pricing Overrides" }),
      });

    await overrideCard.locator("select").nth(0).selectOption(routeOverride.origin);
    await overrideCard
      .locator("select")
      .nth(1)
      .selectOption(routeOverride.destination);
    await overrideCard.locator('input[type="number"]').fill(routeOverride.multiplier);
    await overrideCard.getByRole("button", { name: "Save Override" }).click();

    const overrideRow = overrideCard
      .locator("tbody tr")
      .filter({ hasText: routeOverride.origin })
      .filter({ hasText: routeOverride.destination })
      .first();
    await expect(overrideRow).toBeVisible();
    await expect(
      overrideRow.getByText(Number(routeOverride.multiplier).toFixed(2))
    ).toBeVisible();

    await overrideRow.getByRole("button", { name: "Remove" }).click();
    await expect(
      overrideCard
        .locator("tbody tr")
        .filter({ hasText: routeOverride.origin })
        .filter({ hasText: routeOverride.destination })
        .filter({ hasText: Number(routeOverride.multiplier).toFixed(2) })
    ).toHaveCount(0);
  });

  test("routes page lists priced pairs including the demo route", async ({
    page,
  }) => {
    const { waybill } = loadTestData();

    await page.goto("/routes");
    await expect(
      page.getByRole("heading", { name: "Route pricing" })
    ).toBeVisible();

    await page.getByLabel("Filter routes").fill(waybill.destination);
    const row = page
      .locator("tbody tr")
      .filter({ hasText: waybill.origin })
      .filter({ hasText: waybill.destination })
      .first();
    await expect(row).toBeVisible();
  });
});
