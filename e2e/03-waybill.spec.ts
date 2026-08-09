import { expect, test } from "@playwright/test";
import { inputNearCaption, selectNearCaption } from "./helpers/forms";
import { loadTestData, recordCreatedIds } from "./helpers/test-data";

test.describe.serial("waybill lifecycle", () => {
  test("creates a waybill and offers PDF download", async ({ page }) => {
    const { waybill } = loadTestData();

    await page.goto("/waybill");
    await expect(
      page.getByRole("heading", { name: "Create New Shipment Waybill" })
    ).toBeVisible();

    const sender = page.getByRole("group", { name: "Sender" });
    await sender.locator("input").nth(0).fill(waybill.senderName);
    await sender.locator("input").nth(1).fill(waybill.senderPhone);

    const recipient = page.getByRole("group", { name: "Recipient" });
    await recipient.locator("input").nth(0).fill(waybill.receiverName);
    await recipient.locator("input").nth(1).fill(waybill.receiverPhone);

    const form = page.locator("main form");
    await selectNearCaption(form, "Origin").selectOption(waybill.origin);
    await selectNearCaption(form, "Destination").selectOption(waybill.destination);
    await inputNearCaption(form, "Weight (kg)").fill(waybill.weight);
    await inputNearCaption(form, "Volume (m3)").fill(waybill.volume);
    await inputNearCaption(form, "Cargo Description").fill(waybill.description);

    await page.getByRole("button", { name: "Calculate Pricing" }).click();
    await expect(page.getByText(/Total Amount: \$/)).toBeVisible();

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/waybills") &&
        response.request().method() === "POST" &&
        !response.url().includes("/pdf")
    );
    await page.getByRole("button", { name: "Create Waybill" }).click();
    const response = await createResponse;
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { id?: string };
    expect(body.id).toBeTruthy();

    recordCreatedIds({ waybillId: body.id ?? null });

    await expect(page.getByText(/created successfully/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download PDF" })
    ).toBeVisible();
  });

  test("shows the new waybill on the dashboard", async ({ page }) => {
    const { waybill, created } = loadTestData();
    expect(created.waybillId).toBeTruthy();

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Waybill Dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Loading waybills...")).toBeHidden();

    await expect(
      page.getByText(`${waybill.origin} -> ${waybill.destination}`).first()
    ).toBeVisible();
    await expect(
      page.getByText(`${waybill.senderName} -> ${waybill.receiverName}`).first()
    ).toBeVisible();
  });

  test("opens waybill detail and serves a PDF", async ({ page }) => {
    const { waybill, created } = loadTestData();
    expect(created.waybillId).toBeTruthy();
    const waybillId = created.waybillId!;

    await page.goto(`/waybill/${waybillId}`);
    await expect(page.getByText(waybill.senderName)).toBeVisible();
    await expect(page.getByText(waybill.receiverName)).toBeVisible();
    // Detail page renders origin / arrow / destination on separate lines.
    const routeCard = page
      .locator("div")
      .filter({ has: page.getByText("Route", { exact: true }) })
      .filter({ hasText: waybill.origin });
    await expect(routeCard.getByText(waybill.origin, { exact: true })).toBeVisible();
    await expect(routeCard.getByText(waybill.destination, { exact: true })).toBeVisible();

    const pdf = await page.request.get(`/api/waybills/${waybillId}/pdf`);
    expect(pdf.ok()).toBeTruthy();
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    const bytes = await pdf.body();
    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  test("filters dashboard by pending status", async ({ page }) => {
    const { waybill } = loadTestData();

    await page.goto("/dashboard");
    await page.locator("#status-filter").selectOption("pending");
    await expect(page.getByText("Loading waybills...")).toBeHidden();
    await expect(
      page.getByText(`${waybill.senderName} -> ${waybill.receiverName}`).first()
    ).toBeVisible();
  });
});
