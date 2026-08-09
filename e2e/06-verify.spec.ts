import { expect, test } from "@playwright/test";
import { loadTestData } from "./helpers/test-data";

test.describe("public QR verification", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("verify page is public and hides financials", async ({ page }) => {
    const { waybill, created } = loadTestData();
    expect(created.waybillId).toBeTruthy();
    const waybillId = created.waybillId!;

    await page.goto(`/verify/${waybillId}`, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Cargo verification" })
    ).toBeVisible();
    await expect(page.getByText(waybill.senderName)).toBeVisible();
    await expect(page.getByText(waybill.receiverName)).toBeVisible();
    await expect(
      page.getByText(`${waybill.origin} → ${waybill.destination}`)
    ).toBeVisible();
    await expect(page.getByText(`${waybill.weight} kg`)).toBeVisible();
    await expect(page.getByText(`${waybill.volume} m³`)).toBeVisible();

    await expect(page.getByText(/client cost/i)).toHaveCount(0);
    await expect(page.getByText(/driver payment/i)).toHaveCount(0);
    await expect(page.getByText(/net margin/i)).toHaveCount(0);
    await expect(page.getByText(/\$\d/)).toHaveCount(0);
  });

  test("unknown waybill id shows not-found copy", async ({ page }) => {
    await page.goto("/verify/does-not-exist-e2e", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: "Waybill not found" })
    ).toBeVisible();
  });
});
