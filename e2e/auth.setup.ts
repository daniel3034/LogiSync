import { test as setup } from "@playwright/test";
import path from "node:path";
import { loginViaUi } from "./helpers/auth";
import { refreshGeneratedValues } from "./helpers/test-data";

const authFile = path.join(__dirname, ".auth", "admin.json");

setup("authenticate as admin and refresh fixtures", async ({ page }) => {
  refreshGeneratedValues();
  await loginViaUi(page);
  await page.context().storageState({ path: authFile });
});
