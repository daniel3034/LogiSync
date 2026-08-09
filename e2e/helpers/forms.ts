import type { Locator, Page } from "@playwright/test";

/**
 * LogiSync forms often use a `<label>` caption with a sibling control
 * (no `htmlFor` / nesting), so Playwright `getByLabel` cannot find them.
 */
function fieldContainer(root: Page | Locator, caption: string | RegExp) {
  return root
    .locator("label")
    .filter({
      hasText: typeof caption === "string" ? new RegExp(`^${escapeRegExp(caption)}$`) : caption,
    })
    .locator("..");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function selectNearCaption(
  root: Page | Locator,
  caption: string | RegExp
) {
  return fieldContainer(root, caption).locator("select");
}

export function inputNearCaption(
  root: Page | Locator,
  caption: string | RegExp
) {
  return fieldContainer(root, caption).locator("input, textarea").first();
}
