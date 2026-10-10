import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Waits until React has attached to an element. Clicking a submit button before that submits the
 * form natively and reloads the page, which only happens under a cold dev server.
 */
export async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(() => locator.evaluate((element) => Object.keys(element).some((key) => key.startsWith("__reactProps"))))
    .toBe(true);
}
/**
 * Opens a collapsed filter dropdown, such as "Generations" or "Move categories", and leaves it open
 * if it already is. Returns the dropdown's group so a test can look inside it.
 */
export async function openFilter(page: Page, label: string): Promise<Locator> {
  const summary = page.getByRole("button", { name: new RegExp(`^${label}`) }).first();
  await expect(summary).toBeVisible();
  if ((await summary.getAttribute("aria-expanded")) !== "true") {
    await summary.click();
  }
  await expect(summary).toHaveAttribute("aria-expanded", "true");
  return page.getByRole("group", { name: label, exact: true });
}