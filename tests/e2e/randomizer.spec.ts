import { expect, type Locator, type Page, test } from "@playwright/test";

async function clickRolledOption(list: Locator, index = 0) {
  await list.getByRole("listitem").nth(index).getByRole("button").first().click();
}

async function moveRandomizerEarlier(page: Page, label: string, steps: number) {
  const handle = page.getByRole("button", { name: `Reorder ${label}` });
  await handle.focus();
  await page.keyboard.press("Space");
  for (let index = 0; index < steps; index += 1) {
    await page.keyboard.press("ArrowUp");
  }
  await page.keyboard.press("Space");
}

test("randomizer pages through previous generations and explains an empty pool", async ({
  page,
}) => {
  await page.goto("/randomizer");
  await expect(page.getByRole("heading", { name: "Configure your roll", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Generations/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear generations" })).toBeHidden();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(6);

  const firstNames = await results.getByRole("heading", { level: 3 }).allTextContents();
  expect(new Set(firstNames).size).toBe(6);

  await results.getByRole("button").first().click();
  await expect(page.getByText("Selected").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evolution", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Previous generated Pokémon" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next generated Pokémon" })).toBeDisabled();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  await expect(page.getByRole("list", { name: "Current generation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: firstNames[0], level: 3 })).toHaveCount(0);

  await page.getByRole("button", { name: "Previous generated Pokémon" }).click();
  await expect(page.getByRole("list", { name: "Generation 1" }).getByRole("listitem")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: firstNames[0], level: 3 })).toBeVisible();

  await page.getByRole("button", { name: "Next generated Pokémon" }).click();
  await expect(page.getByRole("list", { name: "Current generation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: firstNames[0], level: 3 })).toHaveCount(0);

  await page.getByRole("button", { name: /^Generations/ }).click();
  await expect(page.getByRole("button", { name: "Clear generations" })).toBeVisible();
  await page.getByRole("button", { name: "Clear generations" }).click();
  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  await expect(page.getByRole("alert")).toContainText("Only 0 Pokémon match your current filters");
  await expect(page.getByRole("list", { name: "Current generation" }).getByRole("listitem")).toHaveCount(
    6,
  );
});

test("selected Pokémon can be evolved to a later battle stage", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("3");

  await page.getByRole("button", { name: /^Generations/ }).click();
  await page.getByRole("button", { name: "Clear generations" }).click();
  await page.getByRole("checkbox", { name: "Gen 1" }).click();

  await page.getByRole("button", { name: /^Types/ }).click();
  await page.getByRole("button", { name: "Clear types" }).click();
  await page.getByRole("radio", { name: "Match every selected type" }).click();
  await page.getByRole("checkbox", { name: "Grass" }).click();
  await page.getByRole("checkbox", { name: "Poison" }).click();

  await page.getByRole("button", { name: /^Evolution stages/ }).click();
  await page.getByRole("button", { name: "Clear evolution stages" }).click();
  await page.getByRole("checkbox", { name: "Basic" }).click();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(3);

  await results.getByRole("button").first().click();
  await expect(page.getByRole("heading", { name: "Evolution", level: 2 })).toBeVisible();
  await expect(page.getByText("can evolve")).toBeVisible();

  const evolutionChoices = page.getByRole("list", { name: "Evolution choices" });
  await expect(evolutionChoices.getByRole("button").first()).toBeVisible();
  expect(await evolutionChoices.getByRole("button").count()).toBeGreaterThan(1);

  await evolutionChoices.getByRole("button").last().click();
  await expect(page.getByText("Using this evolution")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Continue with / })).toBeEnabled();
});

test("ability randomizer runs on its own tab after continue", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await expect(page.getByRole("tab", { name: "Abilities" })).toBeDisabled();
  await expect(page.getByRole("spinbutton", { name: "Ability count" })).toHaveCount(0);

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(6);

  await expect(page.getByRole("button", { name: "Generate abilities" })).toHaveCount(0);

  await results.getByRole("button").first().click();
  await expect(page.getByRole("heading", { name: "Evolution", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate abilities" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Abilities" })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Continue to builder" })).toHaveCount(0);

  await page.getByRole("button", { name: /^Continue to abilities/ }).click();
  await expect(page.getByRole("heading", { name: /^Abilities for /, level: 1 })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Ability count" })).toHaveValue("3");
  await expect(page.getByText("standard abilities are available")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate Pokémon" })).toHaveCount(0);
  await expect(page.getByText(/Generate abilities for .+ before continuing/)).toBeVisible();

  await page.getByRole("button", { name: "Generate abilities" }).click();
  const abilityResults = page.getByRole("list", { name: "Generated abilities" });
  await expect(abilityResults.getByRole("listitem")).toHaveCount(3);
  await expect(abilityResults.getByRole("heading", { level: 3 })).toHaveCount(3);

  await clickRolledOption(abilityResults);
  await expect(abilityResults.getByText("Selected").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
});

test("move randomizer runs after abilities on the typical path", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await page.getByRole("checkbox", { name: "Move randomizer" }).check();
  await expect(page.getByRole("tab", { name: "Moves" })).toBeDisabled();
  await expect(page.getByRole("spinbutton", { name: "Move count" })).toHaveCount(0);

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(6);

  await results.getByRole("button").first().click();
  await expect(page.getByRole("heading", { name: "Evolution", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Continue to abilities/ })).toBeEnabled();

  await page.getByRole("button", { name: /^Continue to abilities/ }).click();
  await page.getByRole("button", { name: "Generate abilities" }).click();
  const abilityResults = page.getByRole("list", { name: "Generated abilities" });
  await clickRolledOption(abilityResults);

  await page.getByRole("button", { name: /^Continue to moves/ }).click();
  await expect(page.getByRole("heading", { name: /^Moves for /, level: 1 })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Move count" })).toHaveValue("8");
  await expect(page.getByRole("radio", { name: "2 moves per Pokémon" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Move categories/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Move types/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear categories" })).toBeHidden();
  await page.getByRole("button", { name: /^Move categories/ }).click();
  await expect(page.getByRole("checkbox", { name: "Physical" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Special" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Status" })).toBeChecked();
  await page.getByRole("button", { name: /^Move types/ }).click();
  await expect(page.getByRole("checkbox", { name: "Fire" })).toBeChecked();
  await expect(page.getByText("moves match these filters")).toBeVisible();
  await expect(page.getByText(/Generate moves for .+ before continuing/)).toBeVisible();

  await page.getByRole("button", { name: "Generate moves" }).click();
  const moveResults = page.getByRole("list", { name: "Generated moves" });
  await expect(moveResults.getByRole("listitem")).toHaveCount(8);
  await expect(moveResults.getByText(/^Power |^No power/).first()).toBeVisible();
  await expect(moveResults.getByText(/^Accuracy \d+%$|^Can't miss/).first()).toBeVisible();
  await expect(page.getByText("0 of 4 moves selected")).toBeVisible();

  await clickRolledOption(moveResults, 0);
  await clickRolledOption(moveResults, 1);
  await clickRolledOption(moveResults, 2);
  await expect(page.getByRole("link", { name: "Continue to builder" })).toHaveCount(0);
  await clickRolledOption(moveResults, 3);
  await expect(page.getByText("4 of 4 moves selected")).toBeVisible();
  await expect(moveResults.getByText("Selected")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
});

test("randomizer order tiles can be dragged to change the sequence", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("checkbox", { name: "Item randomizer" }).check();
  const steps = page.getByRole("list", { name: "Randomizer steps" });
  await expect(steps.getByRole("listitem").first()).toContainText("Pokémon randomizer");
  await expect(page.getByRole("button", { name: "Use typical order" })).toBeDisabled();

  await page.getByRole("button", { name: "Reorder Item randomizer" }).dragTo(
    page.getByRole("button", { name: "Reorder Pokémon randomizer" }),
  );

  await expect(steps.getByRole("listitem").first()).toContainText("Item randomizer");
  await expect(page.getByRole("tab", { name: "Items" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Use typical order" })).toBeEnabled();
});

test("move-first order lets the user apply a chosen number of moves then select a Pokémon", async ({
  page,
}) => {
  await page.goto("/randomizer");

  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("3");
  await page.getByRole("checkbox", { name: "Move randomizer" }).check();
  await moveRandomizerEarlier(page, "Move randomizer", 2);
  await expect(page.getByRole("tab", { name: "Moves" })).toBeEnabled();

  await page.getByRole("tab", { name: "Moves" }).click();
  await expect(page.getByRole("heading", { name: "Move randomizer", level: 1 })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Move count" })).toHaveValue("8");
  await expect(page.getByRole("radio", { name: "4 moves per Pokémon (full moveset)" })).toBeChecked();
  await expect(page.getByRole("button", { name: /^Move categories/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Move types/ })).toBeVisible();
  await page.getByRole("button", { name: /^Move categories/ }).click();
  await expect(page.getByRole("checkbox", { name: "Physical" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Special" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Status" })).toBeChecked();
  await page.getByRole("radio", { name: "2 moves per Pokémon" }).check();

  await page.getByRole("button", { name: "Generate moves" }).click();
  const moveResults = page.getByRole("list", { name: "Generated moves" });
  await expect(moveResults.getByRole("listitem")).toHaveCount(8);
  await expect(moveResults.getByText("In this pool")).toHaveCount(8);
  await expect(moveResults.getByRole("button", { name: /^Re-roll / })).toHaveCount(8);

  await page.getByRole("button", { name: "Continue to Pokémon" }).click();
  await expect(page.getByRole("heading", { name: "Configure your roll", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(3);

  const firstCard = results.getByRole("listitem").first();
  const selectButton = firstCard.getByRole("button").first();
  await expect(selectButton).toBeDisabled();
  await expect(firstCard.getByRole("combobox", { name: /^Move 3 for / })).toHaveCount(0);
  await firstCard.getByRole("combobox", { name: /^Move 1 for / }).selectOption({ index: 1 });
  await expect(selectButton).toBeDisabled();
  await firstCard.getByRole("combobox", { name: /^Move 2 for / }).selectOption({ index: 1 });
  await expect(selectButton).toBeEnabled();
  await selectButton.click();
  await expect(firstCard.getByText("Selected")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
});

test("item randomizer runs after moves on the typical path", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await page.getByRole("checkbox", { name: "Move randomizer" }).check();
  await page.getByRole("checkbox", { name: "Item randomizer" }).check();
  await expect(page.getByRole("tab", { name: "Items" })).toBeDisabled();
  await expect(page.getByRole("spinbutton", { name: "Item count" })).toHaveCount(0);

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(6);

  await results.getByRole("button").first().click();
  await expect(page.getByRole("heading", { name: "Evolution", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Continue to abilities/ })).toBeEnabled();

  await page.getByRole("button", { name: /^Continue to abilities/ }).click();
  await page.getByRole("button", { name: "Generate abilities" }).click();
  const abilityResults = page.getByRole("list", { name: "Generated abilities" });
  await clickRolledOption(abilityResults);

  await page.getByRole("button", { name: /^Continue to moves/ }).click();
  await page.getByRole("button", { name: "Generate moves" }).click();
  const moveResults = page.getByRole("list", { name: "Generated moves" });
  await clickRolledOption(moveResults, 0);
  await clickRolledOption(moveResults, 1);
  await clickRolledOption(moveResults, 2);
  await clickRolledOption(moveResults, 3);

  await page.getByRole("button", { name: /^Continue to items/ }).click();
  await expect(page.getByRole("heading", { name: /^Items for /, level: 1 })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Item count" })).toHaveValue("3");
  await expect(page.getByRole("button", { name: /^Item categories/ })).toBeVisible();
  await expect(page.getByText("items match these filters")).toBeVisible();
  await expect(page.getByText(/Generate items for .+ before continuing/)).toBeVisible();

  await page.getByRole("button", { name: "Generate items" }).click();
  const itemResults = page.getByRole("list", { name: "Generated items" });
  await expect(itemResults.getByRole("listitem")).toHaveCount(4);
  await expect(itemResults.getByRole("heading", { name: "None", level: 3 })).toBeVisible();

  await clickRolledOption(itemResults, 1);
  await expect(itemResults.getByText("Selected").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
});

test("item-first order lets the user apply items then select a Pokémon", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("3");
  await page.getByRole("checkbox", { name: "Item randomizer" }).check();
  await moveRandomizerEarlier(page, "Item randomizer", 3);
  await expect(page.getByRole("tab", { name: "Items" })).toBeEnabled();

  await page.getByRole("tab", { name: "Items" }).click();
  await expect(page.getByRole("heading", { name: "Item randomizer", level: 1 })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Item count" })).toHaveValue("3");
  await expect(page.getByRole("button", { name: /^Item categories/ })).toBeVisible();
  await expect(page.getByText("items match these filters")).toBeVisible();

  await page.getByRole("button", { name: "Generate items" }).click();
  const itemResults = page.getByRole("list", { name: "Generated items" });
  await expect(itemResults.getByRole("listitem")).toHaveCount(3);
  await expect(itemResults.getByText("In this pool")).toHaveCount(3);
  await expect(itemResults.getByRole("button", { name: /^Re-roll / })).toHaveCount(3);

  await page.getByRole("button", { name: "Continue to Pokémon" }).click();
  await expect(page.getByRole("heading", { name: "Configure your roll", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(3);

  const firstCard = results.getByRole("listitem").first();
  const selectButton = firstCard.getByRole("button").first();
  await expect(selectButton).toBeDisabled();
  await firstCard.getByRole("combobox", { name: /^Item for / }).selectOption({ index: 1 });
  await expect(selectButton).toBeEnabled();
  await selectButton.click();
  await expect(firstCard.getByText("Selected")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
  await expect(page.getByRole("button", { name: /^Continue to items/ })).toHaveCount(0);
});

test("item categories follow Showdown teambuilder groups", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("checkbox", { name: "Item randomizer" }).check();
  await moveRandomizerEarlier(page, "Item randomizer", 3);
  await page.getByRole("tab", { name: "Items" }).click();

  await expect(page.getByRole("button", { name: /^Item categories All categories/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear item categories" })).toBeHidden();
  await page.getByRole("button", { name: /^Item categories/ }).click();
  await expect(page.getByRole("checkbox", { name: "Popular Items" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Items", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Pokémon-Specific Items" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Usually Useless Items" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Useless Items" })).toBeChecked();

  await page.getByRole("button", { name: "Clear item categories" }).click();
  await expect(page.getByText("0 items match these filters")).toBeVisible();

  await page.getByRole("checkbox", { name: "Popular Items" }).click();
  await expect(page.getByText(/^\d+ items match these filters/)).toBeVisible();
  await expect(page.getByText("0 items match these filters")).toHaveCount(0);

  await page.getByRole("button", { name: "Generate items" }).click();
  const itemResults = page.getByRole("list", { name: "Generated items" });
  await expect(itemResults.getByRole("listitem")).toHaveCount(3);
  await expect(itemResults.getByText("Popular Items")).toHaveCount(3);
});

test("ability-first order lets the user apply abilities then select a Pokémon", async ({
  page,
}) => {
  await page.goto("/randomizer");

  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("3");
  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await moveRandomizerEarlier(page, "Ability randomizer", 1);
  await expect(page.getByRole("tab", { name: "Abilities" })).toBeEnabled();

  await page.getByRole("tab", { name: "Abilities" }).click();
  await expect(page.getByRole("heading", { name: "Ability randomizer", level: 1 })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Ability count" })).toHaveValue("3");

  await page.getByRole("button", { name: "Generate abilities" }).click();
  const abilityResults = page.getByRole("list", { name: "Generated abilities" });
  await expect(abilityResults.getByRole("listitem")).toHaveCount(3);
  await expect(abilityResults.getByText("In this pool")).toHaveCount(3);
  await expect(abilityResults.getByRole("button", { name: /^Re-roll / })).toHaveCount(3);

  await page.getByRole("button", { name: "Continue to Pokémon" }).click();
  await expect(page.getByRole("heading", { name: "Configure your roll", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(3);

  const firstCard = results.getByRole("listitem").first();
  const selectButton = firstCard.getByRole("button").first();
  await expect(selectButton).toBeDisabled();
  await firstCard.getByRole("combobox", { name: /^Ability for / }).selectOption({ index: 1 });
  await expect(selectButton).toBeEnabled();
  await selectButton.click();
  await expect(firstCard.getByText("Selected")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
  await expect(page.getByRole("button", { name: /^Continue to abilities/ })).toHaveCount(0);
});

test("any generated option can be re-rolled in place any number of times", async ({ page }) => {
  await page.goto("/randomizer");

  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await page.getByRole("checkbox", { name: "Move randomizer" }).check();
  await page.getByRole("checkbox", { name: "Item randomizer" }).check();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(6);
  await expect(results.getByRole("button", { name: /^Re-roll / })).toHaveCount(6);

  const firstNames = await results.getByRole("heading", { level: 3 }).allTextContents();
  await results.getByRole("button", { name: `Re-roll ${firstNames[0]}` }).click();
  await expect(results.getByRole("heading", { name: firstNames[0], level: 3, exact: true })).toHaveCount(0);
  const afterFirstReroll = await results.getByRole("heading", { level: 3 }).allTextContents();
  expect(afterFirstReroll.slice(1)).toEqual(firstNames.slice(1));
  expect(new Set(afterFirstReroll).size).toBe(6);

  await results.getByRole("button", { name: `Re-roll ${afterFirstReroll[0]}` }).click();
  await expect(results.getByRole("heading", { name: afterFirstReroll[0], level: 3, exact: true })).toHaveCount(0);
  const afterSecondReroll = await results.getByRole("heading", { level: 3 }).allTextContents();
  expect(afterSecondReroll.slice(1)).toEqual(firstNames.slice(1));
  expect(new Set(afterSecondReroll).size).toBe(6);

  await clickRolledOption(results);

  await page.getByRole("button", { name: /^Continue to abilities/ }).click();
  await page.getByRole("button", { name: "Generate abilities" }).click();
  const abilityResults = page.getByRole("list", { name: "Generated abilities" });
  const abilityNames = await abilityResults.getByRole("heading", { level: 3 }).allTextContents();
  await abilityResults.getByRole("button", { name: `Re-roll ${abilityNames[0]}` }).click();
  await expect(abilityResults.getByRole("heading", { name: abilityNames[0], level: 3 })).toHaveCount(0);
  const abilityAfter = await abilityResults.getByRole("heading", { level: 3 }).allTextContents();
  expect(abilityAfter.slice(1)).toEqual(abilityNames.slice(1));
  expect(new Set(abilityAfter).size).toBe(3);
  await clickRolledOption(abilityResults);

  await page.getByRole("button", { name: /^Continue to moves/ }).click();
  await page.getByRole("button", { name: "Generate moves" }).click();
  const moveResults = page.getByRole("list", { name: "Generated moves" });
  const moveNames = await moveResults.getByRole("heading", { level: 3 }).allTextContents();
  await moveResults.getByRole("button", { name: `Re-roll ${moveNames[0]}` }).click();
  await expect(moveResults.getByRole("heading", { name: moveNames[0], level: 3 })).toHaveCount(0);
  const moveAfter = await moveResults.getByRole("heading", { level: 3 }).allTextContents();
  expect(moveAfter.slice(1)).toEqual(moveNames.slice(1));
  expect(new Set(moveAfter).size).toBe(8);
  await clickRolledOption(moveResults, 0);
  await clickRolledOption(moveResults, 1);
  await clickRolledOption(moveResults, 2);
  await clickRolledOption(moveResults, 3);

  await page.getByRole("button", { name: /^Continue to items/ }).click();
  await page.getByRole("button", { name: "Generate items" }).click();
  const itemResults = page.getByRole("list", { name: "Generated items" });
  await expect(itemResults.getByRole("heading", { name: "None", level: 3 })).toBeVisible();
  await expect(itemResults.getByRole("button", { name: "Re-roll None" })).toHaveCount(0);
  const itemNames = await itemResults.getByRole("heading", { level: 3 }).allTextContents();
  const firstItemName = itemNames.find((name) => name !== "None");
  expect(firstItemName).toBeDefined();
  await itemResults.getByRole("button", { name: `Re-roll ${firstItemName}` }).click();
  await expect(itemResults.getByRole("heading", { name: firstItemName, level: 3 })).toHaveCount(0);
  const itemAfter = await itemResults.getByRole("heading", { level: 3 }).allTextContents();
  expect(itemAfter).toContain("None");
  expect(itemAfter).not.toContain(firstItemName);
  expect(new Set(itemAfter.filter((name) => name !== "None")).size).toBe(3);
  await clickRolledOption(itemResults, 1);
  await expect(page.getByRole("link", { name: "Continue to builder" })).toBeEnabled();
});

test("re-roll keeps the current option when the remaining Pokémon pool is empty", async ({
  page,
}) => {
  await page.goto("/randomizer");

  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("3");
  await page.getByRole("button", { name: /^Generations/ }).click();
  await page.getByRole("button", { name: "Clear generations" }).click();
  await page.getByRole("checkbox", { name: "Gen 1" }).click();
  await page.getByRole("button", { name: /^Types/ }).click();
  await page.getByRole("button", { name: "Clear types" }).click();
  await page.getByRole("radio", { name: "Match every selected type" }).click();
  await page.getByRole("checkbox", { name: "Grass" }).click();
  await page.getByRole("checkbox", { name: "Poison" }).click();
  await page.getByRole("button", { name: /^Evolution stages/ }).click();
  await page.getByRole("button", { name: "Clear evolution stages" }).click();
  await page.getByRole("checkbox", { name: "Basic" }).click();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(3);
  const names = await results.getByRole("heading", { level: 3 }).allTextContents();

  await results.getByRole("button", { name: `Re-roll ${names[0]}` }).click();
  await expect(page.getByRole("alert")).toContainText(
    "No other matching Pokémon are left to re-roll this one",
  );
  await expect(results.getByRole("heading", { level: 3 })).toHaveText(names);
});
