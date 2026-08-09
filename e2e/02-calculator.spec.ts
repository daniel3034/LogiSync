import { expect, test } from "@playwright/test";
import { inputNearCaption, selectNearCaption } from "./helpers/forms";
import { loadTestData } from "./helpers/test-data";

test.describe("freight calculator", () => {
  test("calculates client cost, driver payment, and net margin", async ({
    page,
  }) => {
    const { calculator } = loadTestData();

    await page.goto("/calculator");
    await expect(
      page.getByRole("heading", { name: "Freight Cost Calculator" })
    ).toBeVisible();

    const main = page.locator("main");
    await selectNearCaption(main, "Origin City").selectOption(calculator.origin);
    await selectNearCaption(main, "Destination City").selectOption(
      calculator.destination
    );
    await inputNearCaption(main, "Weight (kg)").fill(calculator.weight);
    await inputNearCaption(main, /Volume/).fill(calculator.volume);
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
    await expect(page.getByText("Client Cost", { exact: true })).toBeVisible();
    await expect(page.getByText("Driver Payment", { exact: true })).toBeVisible();
    await expect(page.getByText("Net Margin", { exact: true })).toBeVisible();
    await expect(page.getByText(/\$\d/).first()).toBeVisible();
  });

  test("shows validation when origin and destination are missing", async ({
    page,
  }) => {
    await page.goto("/calculator");
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(
      page.getByText("Please select origin and destination.")
    ).toBeVisible();
  });
});
