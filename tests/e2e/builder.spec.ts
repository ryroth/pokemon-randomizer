import { expect, test } from "@playwright/test";

test("builder keeps the selected Pokémon and leaves unset fields empty", async ({ page }) => {
  await page.goto("/randomizer");
  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  const name = (await results.getByRole("heading", { level: 3 }).first().textContent())?.trim();
  expect(name).toBeTruthy();
  await results.getByRole("button").first().click();
  await page.getByRole("link", { name: "Continue to builder" }).click();

  await expect(page.getByRole("heading", { name: `Build ${name}`, level: 1 })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "HP EVs" })).toHaveValue("");
  await expect(page.getByRole("spinbutton", { name: "HP IVs" })).toHaveValue("31");
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue("");
  await expect(page.getByRole("spinbutton", { name: "Happiness value" })).toHaveValue("255");
  await expect(page.getByRole("slider", { name: "Happiness" })).toHaveValue("255");
  await expect(page.getByRole("combobox", { name: "Nature" })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: "Tera type" })).toHaveValue("");
  await expect(page.getByRole("spinbutton", { name: "Level" })).toHaveValue("");
  await expect(page.getByRole("radio", { name: "Shiny" })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Not shiny" })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Continue to recap" })).toBeDisabled();

  await page.getByRole("combobox", { name: "Ability" }).click();
  await page.getByRole("listbox", { name: "Abilities" }).getByRole("option").first().click();

  for (const move of ["Tackle", "Growl", "Pound", "Scratch"]) {
    await page.getByRole("textbox", { name: "Search moves" }).fill(move);
    await page.getByRole("button", { name: move }).click();
  }

  await page.getByRole("button", { name: "None", exact: true }).click();

  for (const stat of ["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed"]) {
    await page.getByRole("spinbutton", { name: `${stat} EVs` }).fill("0");
  }
  await page.getByRole("checkbox", { name: "I confirm this EV spread" }).check();
  await page.getByRole("textbox", { name: "Nickname" }).fill("Ace");
  await page.getByRole("slider", { name: "Happiness" }).fill("0");

  const nature = page.getByRole("combobox", { name: "Nature" });
  const natureValue = await nature.locator("option").nth(1).getAttribute("value");
  await nature.selectOption(natureValue!);
  await page.getByRole("combobox", { name: "Tera type" }).selectOption({ label: "Water" });

  const male = page.getByRole("radio", { name: "Male" });
  if ((await male.count()) > 0) {
    await male.check();
  }

  await page.getByRole("spinbutton", { name: "Level" }).fill("50");
  await page.getByRole("radio", { name: "Not shiny" }).check();
  await expect(page.getByRole("button", { name: "Continue to recap" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue to recap" }).click();
  await expect(page).toHaveURL(/\/recap$/);
});
