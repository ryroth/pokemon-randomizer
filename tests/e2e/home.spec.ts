import { expect, test } from "@playwright/test";

test("home page presents the randomizer shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pokémon Randomizer", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start randomizing" })).toBeEnabled();

  await page.getByRole("link", { name: "Start randomizing" }).click();
  await expect(page).toHaveURL(/\/randomizer$/);
  await expect(page.getByRole("heading", { name: "Configure your roll" })).toBeVisible();
});
