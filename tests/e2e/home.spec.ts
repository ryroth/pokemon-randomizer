import { expect, test } from "@playwright/test";

test("home page presents the randomizer shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pokémon Randomizer", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start randomizing" }).first()).toBeEnabled();

  await page.getByRole("link", { name: "Start randomizing" }).first().click();
  await expect(page).toHaveURL(/\/randomizer$/);
  await expect(page.getByRole("heading", { name: "Configure your roll" })).toBeVisible();
});

test("the header returns home and Start randomizing clears the last setup", async ({ page }) => {
  await page.goto("/randomizer");
  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await expect(page.getByRole("checkbox", { name: "Ability randomizer" })).toBeChecked();

  await page.getByRole("link", { name: "Pokémon Randomizer" }).first().click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Pokémon Randomizer", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Start randomizing" }).first().click();
  await expect(page).toHaveURL(/\/randomizer$/);
  await expect(page.getByRole("heading", { name: "Configure your roll" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Ability randomizer" })).not.toBeChecked();
  await expect(page.getByRole("spinbutton", { name: "Pokémon count" })).toHaveValue("3");
});
