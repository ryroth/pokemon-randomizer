import { expect, test } from "@playwright/test";

test("the current page is marked in the header", async ({ page }) => {
  await page.goto("/randomizer");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Randomizer", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Builder", exact: true })).not.toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Teams", exact: true })).not.toHaveAttribute("aria-current", "page");
});

test("an unknown page explains that it is missing", async ({ page }) => {
  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: "Page not found", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Back to the start" }).click();
  await expect(page).toHaveURL("/");
});

test("the header fits a phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const brand = page.getByRole("link", { name: "Pokémon Randomizer" });
  await expect(brand).toBeVisible();
  const box = await brand.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(8);
  expect(box?.width).toBeGreaterThan(120);

  const nav = page.getByRole("navigation", { name: "Primary" });
  for (const name of ["Randomizer", "Builder", "Recap", "Teams"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows).toBe(false);
});
