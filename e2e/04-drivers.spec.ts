import { expect, test } from "@playwright/test";
import { loadTestData, recordCreatedIds } from "./helpers/test-data";

test.describe.serial("drivers directory", () => {
  test("adds a driver with preferred cities", async ({ page }) => {
    const { driver } = loadTestData();

    await page.goto("/drivers");
    await expect(page.getByRole("heading", { name: "Drivers" })).toBeVisible();

    await page.getByRole("button", { name: "Add driver" }).click();
    await expect(
      page.getByRole("heading", { name: "Add a driver" })
    ).toBeVisible();

    const form = page.locator("form").filter({
      has: page.getByRole("heading", { name: "Add a driver" }),
    });
    await form.locator('input[name="name"]').fill(driver.name);
    await form.locator('input[name="phone"]').fill(driver.phone);
    await form.locator('select[name="truckSize"]').selectOption(driver.truckSize);

    for (const city of driver.preferredCities) {
      await form.getByRole("checkbox", { name: city }).check();
    }

    await form.getByRole("button", { name: "Add driver" }).click();
    await expect(page.getByRole("cell", { name: driver.name })).toBeVisible();
    await expect(page.getByRole("cell", { name: driver.phone })).toBeVisible();

    const response = await page.request.get("/api/drivers");
    expect(response.ok()).toBeTruthy();
    const drivers = (await response.json()) as Array<{
      id: string;
      phone: string;
    }>;
    const created = drivers.find((item) => item.phone === driver.phone);
    expect(created).toBeTruthy();
    recordCreatedIds({ driverId: created?.id ?? null });
  });

  test("updates a driver profile and preferred cities", async ({ page }) => {
    const { driver } = loadTestData();
    const nextPhone = "+503 9999-1111";
    const cityToRemove = driver.preferredCities[0];
    const cityToAdd = "San Miguel";

    await page.goto("/drivers");
    await expect(page.getByRole("cell", { name: driver.name })).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: driver.name });
    await row.getByRole("button", { name: "Edit" }).click();

    await row.locator('input[name="name"]').fill(`${driver.name} Updated`);
    await row.locator('input[name="phone"]').fill(nextPhone);
    await row.locator('select[name="truckSize"]').selectOption("large");

    await row.getByRole("checkbox", { name: cityToRemove }).uncheck();
    await row.getByRole("checkbox", { name: cityToAdd }).check();
    await row.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Driver updated.")).toBeVisible();
    await expect(page.getByRole("cell", { name: `${driver.name} Updated` })).toBeVisible();
    await expect(page.getByText(`serving ${cityToAdd}`)).toBeVisible();
  });

  test("filters drivers by preferred destination city", async ({ page }) => {
    const { driver } = loadTestData();
    const city = driver.preferredCities[0];

    await page.goto("/drivers");
    await page.locator('select[name="city"]').selectOption(city);
    await expect(page).toHaveURL(new RegExp(`city=${encodeURIComponent(city)}`));
    await expect(page.getByRole("cell", { name: driver.name })).toBeVisible();
    await expect(page.getByText(`serving ${city}`)).toBeVisible();
  });

  test("city filter hides drivers that do not serve that city", async ({
    page,
  }) => {
    const { driver } = loadTestData();
    const unusedCity = "Panama City";
    expect(driver.preferredCities).not.toContain(unusedCity);

    await page.goto(`/drivers?city=${encodeURIComponent(unusedCity)}`);
    await expect(page.getByRole("cell", { name: driver.name })).toHaveCount(0);
  });
});
