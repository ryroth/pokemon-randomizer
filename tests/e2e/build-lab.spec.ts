import { expect, test, type Page } from "@playwright/test";

async function openBuilder(page: Page) {
  await page.goto("/randomizer");
  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  const name = (await results.getByRole("heading", { level: 3 }).first().textContent())?.trim();
  await results.getByRole("button").first().click();
  await page.getByRole("link", { name: "Continue to builder" }).click();
  await expect(page.getByRole("heading", { name: `Build ${name}`, level: 1 })).toBeVisible({ timeout: 20_000 });
}

test("IV spreads come from a dropdown, and the EV budget still clears", async ({ page }) => {
  await openBuilder(page);

  // The EV presets and the confirmation checkbox are gone.
  await expect(page.getByRole("button", { name: /Fast Physical Sweeper/ })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "I confirm this EV spread" })).toHaveCount(0);

  const spreads = page.getByRole("combobox", { name: "IV spreads" });
  await expect(spreads).toHaveValue("all-31");
  await spreads.selectOption({ label: "31/0/31/31/31/0" });
  await expect(page.getByRole("spinbutton", { name: "HP IVs", exact: true })).toHaveValue("31");
  await expect(page.getByRole("spinbutton", { name: "Attack IVs", exact: true })).toHaveValue("0");
  await expect(page.getByRole("spinbutton", { name: "Speed IVs", exact: true })).toHaveValue("0");

  await page.getByRole("spinbutton", { name: "HP IVs", exact: true }).fill("30");
  await expect(spreads).toHaveValue("");

  await spreads.selectOption({ label: "31/31/31/31/31/31" });
  await expect(page.getByRole("spinbutton", { name: "Attack IVs", exact: true })).toHaveValue("31");

  const bar = page.getByRole("progressbar", { name: "EVs used" });
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  await expect(bar).toHaveAttribute("aria-valuemax", "508");
  await page.getByRole("spinbutton", { name: "Attack EVs", exact: true }).fill("252");
  await page.getByRole("spinbutton", { name: "Speed EVs", exact: true }).fill("252");
  await page.getByRole("spinbutton", { name: "HP EVs", exact: true }).fill("4");
  await expect(bar).toHaveAttribute("aria-valuenow", "508");
  await expect(page.getByText("Remaining: 0")).toBeVisible();

  // The budget is full, so another stat cannot take any more.
  await page.getByRole("spinbutton", { name: "Defense EVs", exact: true }).fill("100");
  await expect(page.getByRole("spinbutton", { name: "Defense EVs", exact: true })).toHaveValue("0");

  await page.getByRole("button", { name: "Clear all EVs" }).click();
  await expect(page.getByRole("spinbutton", { name: "HP EVs", exact: true })).toHaveValue("");
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
});

test("the builder starts at level 50, with a Tera type dropdown and a quiet empty item", async ({ page }) => {
  await openBuilder(page);

  await expect(page.getByRole("spinbutton", { name: "Level" })).toHaveValue("50");
  // One placeholder plus the nineteen Tera types.
  await expect(page.getByRole("combobox", { name: "Tera type" }).locator("option")).toHaveCount(20);

  // With no item chosen there is no white image square, only a dashed "nothing" mark.
  const itemTrigger = page.getByRole("button", { name: /^Held item:/ });
  await expect(itemTrigger.locator("img")).toHaveCount(0);
  await expect(itemTrigger.locator(".bg-white")).toHaveCount(0);
});

test("the level and happiness boxes can be emptied and retyped", async ({ page }) => {
  await openBuilder(page);

  const level = page.getByRole("spinbutton", { name: "Level" });
  await level.click();
  await level.press("Control+A");
  await level.press("Backspace");
  // The default must not snap back in while the box is empty.
  await expect(level).toHaveValue("");
  await level.pressSequentially("37");
  await expect(level).toHaveValue("37");
  await level.blur();
  await expect(level).toHaveValue("37");

  // Leaving it empty restores the saved value rather than leaving a gap.
  await level.press("Control+A");
  await level.press("Backspace");
  await expect(level).toHaveValue("");
  await level.blur();
  await expect(level).toHaveValue("37");

  const happiness = page.getByRole("spinbutton", { name: "Happiness value" });
  await happiness.press("Control+A");
  await happiness.press("Backspace");
  await expect(happiness).toHaveValue("");
  await happiness.pressSequentially("120");
  await expect(happiness).toHaveValue("120");
});

test("a new Pokémon starts with no nickname, Tera type, or gender, and shiny at No", async ({ page }) => {
  await openBuilder(page);

  await page.getByRole("combobox", { name: "Tera type" }).selectOption("fire");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Ace One");
  const shiny = page.getByRole("group", { name: "Shiny" });
  await expect(shiny.getByRole("radio", { name: "No" })).toBeChecked();
  await shiny.getByRole("radio", { name: "Yes" }).check();
  const male = page.getByRole("radio", { name: "Male", exact: true });
  if (await male.count()) {
    await male.check();
  }

  // Go back and build a different Pokémon from the same roll.
  await page.getByRole("link", { name: "Back to the randomizer" }).first().click();
  const results = page.getByRole("list", { name: "Current generation" });
  const nextName = (await results.getByRole("heading", { level: 3 }).nth(1).textContent())?.trim();
  await results.getByRole("listitem").nth(1).getByRole("button").first().click();
  await page.getByRole("link", { name: "Continue to builder" }).click();
  await expect(page.getByRole("heading", { name: `Build ${nextName}`, level: 1 })).toBeVisible({ timeout: 20_000 });

  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: "Tera type" })).toHaveValue("");
  await expect(page.getByText("No Tera type chosen yet.")).toBeVisible();
  // A gender-locked or genderless Pokémon has no radios. A mixed one starts with neither chosen.
  await expect(page.getByRole("radio", { name: "Male", exact: true, checked: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Female", exact: true, checked: true })).toHaveCount(0);
  const nextShiny = page.getByRole("group", { name: "Shiny" });
  await expect(nextShiny.getByRole("radio", { name: "No" })).toBeChecked();
  await expect(nextShiny.getByRole("radio", { name: "Yes" })).not.toBeChecked();
});

test("move rows line up in sortable columns", async ({ page }) => {
  await openBuilder(page);

  await page.getByRole("button", { name: "Choose move 1" }).click();
  const dialog = page.getByRole("dialog", { name: /Choose move 1/ });
  for (const heading of ["Name", "Type", "Cat", "Pow", "Acc", "PP", "Effect"]) {
    await expect(dialog.getByRole("button", { name: new RegExp(`^(Sort by )?${heading}`) })).toBeVisible();
  }

  // Every row is one grid with a cell per heading.
  await expect(dialog.getByRole("option").first().locator("> div > *")).toHaveCount(7);

  await dialog.getByRole("button", { name: "Sort by Pow" }).click();
  await expect(dialog.getByRole("button", { name: /^Pow, sorted/ })).toBeVisible();
});

test("a Pokémon's own moves can be narrowed to level-up, TM, egg, or tutor moves", async ({ page }) => {
  await openBuilder(page);

  const name = (await page.getByRole("heading", { level: 1 }).first().textContent())?.replace(/^Build /, "").trim();
  await page.getByRole("radio", { name: `${name}'s moves` }).check();
  await page.getByRole("button", { name: "Choose move 1" }).click();
  const dialog = page.getByRole("dialog", { name: /Choose move 1/ });

  const chips = dialog.getByRole("group", { name: "How the move is learned" });
  for (const method of ["Level-Up", "TM", "Egg", "Tutor"]) {
    await expect(chips.getByRole("checkbox", { name: method, exact: true })).not.toBeChecked();
  }
  await expect(dialog.getByRole("button", { name: "Learned" })).toHaveCount(0);
  await expect(dialog.getByText("Learned", { exact: true })).toBeVisible();

  const everyMove = await dialog.getByRole("option").count();
  expect(everyMove).toBeGreaterThan(0);

  await chips.locator("label", { hasText: /^TM$/ }).click();
  await expect(chips.getByRole("checkbox", { name: "TM", exact: true })).toBeChecked();
  await expect.poll(() => dialog.getByRole("option").count()).toBeLessThan(everyMove);
  const tmMoves = await dialog.getByRole("option").count();
  for (const row of await dialog.getByRole("option").all()) {
    await expect(row).toContainText("TM");
  }

  // More than one method shows moves that match any of them.
  await chips.locator("label", { hasText: /^Level-Up$/ }).click();
  await expect.poll(() => dialog.getByRole("option").count()).toBeGreaterThan(tmMoves - 1);
});
test("the move palette searches and chooses from the keyboard", async ({ page }) => {
  await openBuilder(page);

  await page.getByRole("button", { name: "Choose move 1" }).click();
  const search = page.getByRole("combobox", { name: "Search moves" });
  await expect(search).toBeFocused();
  await search.fill("tackle");
  const first = page.getByRole("option").first();
  await expect(first).toContainText("Tackle");
  await expect(first).toContainText("40");
  await expect(first.getByRole("img", { name: "Physical" })).toBeVisible();
  await expect(search).toHaveAttribute("aria-activedescendant", /.+/);

  await search.press("Enter");
  await expect(page.getByRole("dialog", { name: /Choose move 1/ })).toBeHidden();
  await expect(page.getByRole("button", { name: "Choose move 1, currently Tackle" })).toBeVisible();

  // Moves already chosen are not offered again for another slot.
  await page.getByRole("button", { name: "Choose move 2" }).click();
  await page.getByRole("combobox", { name: "Search moves" }).fill("tackle");
  await expect(page.getByRole("option", { name: /^Tackle,/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("combobox", { name: "Search moves" })).toHaveCount(0);
});

test("the Nature list shows raised and lowered stats", async ({ page }) => {
  await openBuilder(page);
  const nature = page.getByRole("combobox", { name: "Nature" });
  await expect(nature.locator("option", { hasText: "Jolly (+Spe, −SpA)" })).toHaveCount(1);
  await nature.selectOption({ label: "Jolly (+Spe, −SpA)" });
  await expect(page.getByText("Raises Spe, lowers SpA.")).toBeVisible();
});
