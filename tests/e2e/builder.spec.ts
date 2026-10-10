import { expect, test } from "@playwright/test";

test("builder keeps the selected Pokémon and leaves unset fields empty", async ({ page }) => {
  await page.goto("/randomizer");
  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  const name = (await results.getByRole("heading", { level: 3 }).first().textContent())?.trim();
  expect(name).toBeTruthy();
  await results.getByRole("button").first().click();
  await page.getByRole("link", { name: "Continue to builder" }).click();

  // The dev server compiles and renders the builder route on first visit, which is slow under parallel load.
  await expect(page.getByRole("heading", { name: `Build ${name}`, level: 1 })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Back to the randomizer" })).toHaveCount(2);
  await expect(page.getByRole("spinbutton", { name: "HP EVs" })).toHaveValue("");
  await expect(page.getByRole("spinbutton", { name: "HP IVs" })).toHaveValue("31");
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue("");
  await expect(page.getByRole("spinbutton", { name: "Happiness value" })).toHaveValue("255");
  await expect(page.getByRole("slider", { name: "Happiness" })).toHaveValue("255");
  await expect(page.getByRole("combobox", { name: "Nature" })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: "Tera type" })).toHaveValue("");
  await expect(page.getByRole("spinbutton", { name: "Level" })).toHaveValue("50");
  await expect(page.getByRole("radio", { name: "Yes", exact: true })).not.toBeChecked();
  // Shiny starts at No, since the randomizer never rolls a shiny.
  await expect(page.getByRole("radio", { name: "No", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Continue to recap" })).toBeDisabled();

  await page.getByRole("button", { name: /^Ability:/ }).click();
  await page.getByRole("listbox", { name: "Abilities" }).getByRole("option").first().click();

  for (const [index, move] of ["Tackle", "Growl", "Pound", "Scratch"].entries()) {
    await page.getByRole("button", { name: `Choose move ${index + 1}` }).click();
    await page.getByRole("combobox", { name: "Search moves" }).fill(move);
    await page.getByRole("option", { name: new RegExp(`^${move},`) }).click();
  }

  await page.getByRole("button", { name: /^Held item:/ }).click();
  await page.getByRole("option", { name: "None", exact: true }).click();

  for (const stat of ["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed"]) {
    await page.getByRole("spinbutton", { name: `${stat} EVs`, exact: true }).fill("0");
  }
  await expect(page.getByRole("checkbox", { name: "I confirm this EV spread" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Nickname" }).fill("Ace One");
  await page.getByRole("slider", { name: "Happiness" }).fill("0");

  const nature = page.getByRole("combobox", { name: "Nature" });
  const natureValue = await nature.locator("option").nth(1).getAttribute("value");
  await nature.selectOption(natureValue!);
  await page.getByRole("combobox", { name: "Tera type" }).selectOption({ label: "Water" });
  await expect(page.getByRole("combobox", { name: "Tera type" })).toHaveValue("water");

  const male = page.getByRole("radio", { name: "Male", exact: true });
  if ((await male.count()) > 0) {
    await male.check();
  }

  await expect(page.getByRole("button", { name: "Continue to recap" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue to recap" }).click();
  await expect(page).toHaveURL(/\/recap$/);
  await expect(page.getByRole("heading", { level: 1, name: "Pokémon Recap", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to the builder" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: name!, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: name! })).toBeVisible();
  await expect(page.getByText("Ace One", { exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "Save to a new team" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved to Team 1, slot 1 of 6." })).toBeVisible();
  await expect(page.getByRole("list", { name: "Team 1 slots" })).toContainText("Ace One");

  const showdown = page.getByLabel("Showdown set text");
  await expect(showdown).toContainText(`Ace One (${name})`);
  await expect(showdown).toContainText("Level: 50");
  await expect(showdown).toContainText("Happiness: 0");
  await expect(showdown).toContainText("Tera Type: Water");
  await expect(showdown).not.toContainText("Shiny: Yes");

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy to Showdown" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Level: 50");
  expect(copied).toContain("Tera Type: Water");

  await page.getByRole("button", { name: "Next Randomizer" }).click();
  await expect(page).toHaveURL(/\/randomizer$/);
  await expect(page.getByRole("heading", { level: 1, name: "Configure your roll" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate Pokémon" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Current generation" })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Ability randomizer" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Move randomizer" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Item randomizer" })).not.toBeChecked();
  await expect(page.getByRole("heading", { level: 2, name: name!, exact: true })).toHaveCount(0);

  await page.goto("/teams");
  await expect(page.getByRole("heading", { level: 2, name: "Team 1" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Team 1 slots" })).toContainText(`Ace One (${name})`);
  await expect(page.getByRole("button", { name: "Copy team to Showdown" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy set" })).toBeVisible();
  await page.getByRole("button", { name: "View recap, slot 1" }).click();
  await expect(page.getByRole("region", { name: "Recap for slot 1" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: name! })).toBeVisible();
  await expect(page.getByLabel("Showdown set text")).toContainText(`Ace One (${name})`);
  await page.getByRole("button", { name: "Close recap" }).click();
  await expect(page.getByLabel("Showdown set text")).toHaveCount(0);

  await page.getByRole("button", { name: "Remove slot 1" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Removed the Pokémon in slot 1." })).toBeVisible();
  await expect(page.getByRole("list", { name: "Team 1 slots" })).toContainText("Slot 1. Empty");
});

test("the Teams page has a Back to the recap button that opens the recap", async ({ page }) => {
  await page.goto("/teams");
  await expect(page.getByRole("heading", { level: 1, name: "Teams", exact: true })).toBeVisible();
  const back = page.getByRole("link", { name: "Back to the recap" });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/\/recap$/);
  await expect(page.getByRole("heading", { level: 1, name: "Pokémon Recap", exact: true })).toBeVisible();
});
