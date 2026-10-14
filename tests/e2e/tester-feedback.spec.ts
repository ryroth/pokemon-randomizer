import { expect, test, type Locator, type Page } from "@playwright/test";
import { openFilter, waitForHydration } from "./helpers";

async function openBuilder(page: Page): Promise<string> {
  await page.goto("/randomizer");
  const generate = page.getByRole("button", { name: "Generate Pokémon" });
  await waitForHydration(generate);
  await generate.click();
  const results = page.getByRole("list", { name: "Current generation" });
  const name = (await results.getByRole("heading", { level: 3 }).first().textContent())?.trim();
  expect(name).toBeTruthy();
  await results.getByRole("button").first().click();
  await page.getByRole("link", { name: "Continue to builder" }).click();
  await expect(page.getByRole("heading", { name: `Build ${name}`, level: 1 })).toBeVisible({ timeout: 20_000 });
  return name!;
}

/** Fills in everything the builder needs except Tera type and gender, with the given moves. */
async function fillBuilder(page: Page, moves: string[], firstSlot = 1) {
  await page.getByRole("button", { name: /^Ability:/ }).click();
  await page.getByRole("listbox", { name: "Abilities" }).getByRole("option").first().click();

  for (const [index, move] of moves.entries()) {
    await page.getByRole("button", { name: `Choose move ${firstSlot + index}` }).click();
    await page.getByRole("combobox", { name: "Search moves" }).fill(move);
    await page.getByRole("option", { name: new RegExp(`^${move},`) }).click();
  }

  await page.getByRole("button", { name: /^Held item:/ }).click();
  await page.getByRole("option", { name: "None", exact: true }).click();

  for (const stat of ["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed"]) {
    await page.getByRole("spinbutton", { name: `${stat} EVs`, exact: true }).fill("0");
  }
  const nature = page.getByRole("combobox", { name: "Nature" });
  await nature.selectOption((await nature.locator("option").nth(1).getAttribute("value"))!);
}

test("Shiny sits right under the Nickname, above the picture and the rest of the build", async ({ page }) => {
  await openBuilder(page);

  const nickname = await page.getByRole("textbox", { name: "Nickname" }).boundingBox();
  const shiny = await page.getByRole("group", { name: "Shiny" }).boundingBox();
  const ability = await page.getByRole("heading", { name: "Ability", level: 2 }).boundingBox();
  const moves = await page.getByRole("heading", { name: "Moves", level: 2 }).boundingBox();
  expect(nickname && shiny && ability && moves).toBeTruthy();
  expect(shiny!.y).toBeGreaterThan(nickname!.y);
  expect(shiny!.y).toBeLessThan(ability!.y);
  expect(shiny!.y).toBeLessThan(moves!.y);

  // The picture changes in the same view when Shiny changes.
  const picture = page.getByRole("region", { name: /^Artwork of / });
  await expect(picture).toBeVisible();
  await page.getByRole("group", { name: "Shiny" }).getByRole("radio", { name: "Yes" }).check();
  await expect(page.getByRole("region", { name: /^Shiny artwork of / })).toBeVisible();
  const box = await page.getByRole("region", { name: /^Shiny artwork of / }).boundingBox();
  const viewport = page.viewportSize();
  expect(box!.y).toBeLessThan(viewport!.height);
});

test("a set can finish with one move, no Tera type, and no gender, then the recap fills in the rest", async ({
  page,
}) => {
  const name = await openBuilder(page);
  await fillBuilder(page, ["Protect"]);

  await expect(page.getByRole("combobox", { name: "Tera type" })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Continue to recap" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue to recap" }).click();
  await expect(page).toHaveURL(/\/recap$/);

  await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  const moves = page.getByRole("list", { name: "Moves" });
  await expect(moves.getByRole("listitem")).toHaveCount(1);
  // Tera type defaults to the primary type, so the set always names one.
  await expect(page.getByLabel("Showdown set text")).toContainText(/Tera Type: \w+/);
  await expect(page.getByLabel("Showdown set text")).toContainText("- Protect");
  await expect(page.getByLabel("Showdown set text")).not.toContainText("- Last Resort");
});

test("selecting a part of the recap opens that part in the builder", async ({ page }) => {
  const name = await openBuilder(page);
  await fillBuilder(page, ["Protect", "Last Resort"]);
  await page.getByRole("textbox", { name: "Nickname" }).fill("Ace One");
  await page.getByRole("button", { name: "Continue to recap" }).click();
  await expect(page).toHaveURL(/\/recap$/);

  await page.getByRole("link", { name: "Edit move 2: Last Resort" }).click();
  await expect(page).toHaveURL(/\/builder#move-2$/);
  await expect(page.getByRole("heading", { name: `Build ${name}`, level: 1 })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#move-2")).toBeInViewport();
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue("Ace One");

  await page.getByRole("button", { name: "Continue to recap" }).click();
  await expect(page).toHaveURL(/\/recap$/);
  await page.getByRole("link", { name: "Edit nickname" }).click();
  await expect(page).toHaveURL(/\/builder#nickname$/);
  await expect(page.getByRole("textbox", { name: "Nickname" })).toBeFocused();

  await page.getByRole("button", { name: "Continue to recap" }).click();
  await page.getByRole("link", { name: "Edit ability" }).click();
  await expect(page).toHaveURL(/\/builder#ability$/);
  await expect(page.locator("#ability")).toBeInViewport();

  await page.getByRole("button", { name: "Continue to recap" }).click();
  await page.getByRole("link", { name: "Edit shiny" }).click();
  await expect(page).toHaveURL(/\/builder#shiny$/);
});

test("the builder will not let a randomizer step be skipped and picked by hand", async ({ page }) => {
  await page.goto("/randomizer");
  const generate = page.getByRole("button", { name: "Generate Pokémon" });
  await waitForHydration(generate);
  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await page.getByRole("checkbox", { name: "Move randomizer" }).check();
  await generate.click();
  const results = page.getByRole("list", { name: "Current generation" });
  await results.getByRole("button").first().click();

  await page.goto("/builder");
  await expect(page.getByText("Finish the randomizer first")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /^Ability:/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Choose move 1" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue to recap" })).toBeDisabled();

  await page.getByRole("status").filter({ hasText: "Finish the randomizer first" }).getByRole("link").click();
  await expect(page).toHaveURL(/\/randomizer$/);
});

test("moving a randomizer to the front opens it straight away", async ({ page }) => {
  await page.goto("/randomizer");
  await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
  await expect(page.getByRole("heading", { name: "Configure your roll", level: 1 })).toBeVisible();

  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  const handle = page.getByRole("button", { name: "Reorder Ability randomizer" });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");

  await expect(page.getByRole("heading", { name: "Ability randomizer", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Configure your roll", level: 1 })).toHaveCount(0);
});

test("art is still, official, and complete across a big roll", async ({ page }) => {
  await page.goto("/randomizer");
  const generate = page.getByRole("button", { name: "Generate Pokémon" });
  await waitForHydration(generate);
  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("12");
  await generate.click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(12);

  const sources = await results.locator("img").evaluateAll((images) =>
    images.map((image) => (image as HTMLImageElement).currentSrc || (image as HTMLImageElement).src),
  );
  expect(sources.length).toBeGreaterThan(0);
  for (const source of sources) {
    expect(source).not.toMatch(/\.gif(\?|$)/i);
  }
});

test("changing the randomizer order keeps the page where the user is looking", async ({ page }) => {
  // A short window guarantees the page scrolls, so the user can be partway down it.
  await page.setViewportSize({ width: 1100, height: 500 });
  await page.goto("/randomizer");
  await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();

  await page.evaluate(() => window.scrollTo(0, 250));
  const handle = page.getByRole("button", { name: "Reorder Ability randomizer" });
  await handle.focus();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(100);
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");

  // The Ability tab is now first and open, but the page must not jump to the top.
  await expect(page.getByRole("heading", { name: "Ability randomizer", level: 1 })).toBeAttached();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => window.scrollY);
  expect(after).toBeGreaterThan(before / 2);
});

test("a Basic roll cannot evolve when only Basic and Stage 2 are selected", async ({ page }) => {
  await page.goto("/randomizer");
  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("3");

  await openFilter(page, "Generations");
  await page.getByRole("button", { name: "Clear generations" }).click();
  await page.getByRole("checkbox", { name: "Gen 1" }).click();

  await openFilter(page, "Types");
  await page.getByRole("button", { name: "Clear types" }).click();
  await page.getByRole("radio", { name: "Match every selected type" }).click();
  await page.getByRole("checkbox", { name: "Grass" }).click();
  await page.getByRole("checkbox", { name: "Poison" }).click();

  await openFilter(page, "Evolution stages");
  await page.getByRole("button", { name: "Clear evolution stages" }).click();
  await page.getByRole("checkbox", { name: "Basic" }).click();
  await page.getByRole("checkbox", { name: "Stage 2" }).click();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await expect(results.getByRole("listitem")).toHaveCount(3);
  await results.getByRole("button").first().click();

  await expect(page.getByRole("heading", { name: "Evolution", level: 2 })).toBeVisible();
  await expect(page.getByRole("list", { name: "Evolution choices" })).toHaveCount(0);
});

test("moves added by hand stay editable in the builder and the recap, while the applied move stays locked", async ({
  page,
}) => {
  await page.goto("/randomizer");
  await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
  await page.getByRole("checkbox", { name: "Move randomizer" }).check();
  const handle = page.getByRole("button", { name: "Reorder Move randomizer" });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");

  await expect(page.getByRole("heading", { name: "Move randomizer", level: 1 })).toBeVisible();
  await page.getByRole("radio", { name: "1 move per Pokémon" }).check();
  await page.getByRole("button", { name: "Generate moves" }).click();
  await expect(page.getByRole("list", { name: "Generated moves" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to Pokémon" }).click();

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  const card = results.getByRole("listitem").first();
  await card.getByRole("combobox", { name: /^Move 1 for / }).selectOption({ index: 1 });
  await card.getByRole("button").first().click();
  await page.getByRole("link", { name: "Continue to builder" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Build / })).toBeVisible({ timeout: 20_000 });

  // Move 1 came from the randomizer. The other slots are the user's to fill.
  await expect(page.locator("#move-1").getByText("Set by the randomizer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose move 2" })).toBeVisible();
  await fillBuilder(page, ["Protect", "Last Resort"], 2);
  await page.getByRole("button", { name: "Continue to recap" }).click();
  await expect(page).toHaveURL(/\/recap$/);

  // The applied move has no Edit link. The hand-picked ones do.
  await expect(page.getByText("Set by randomizer", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /^Edit move 1:/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Edit move 2: Protect" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit move 3: Last Resort" })).toBeVisible();

  await page.getByRole("link", { name: "Edit move 3: Last Resort" }).click();
  await expect(page).toHaveURL(/\/builder#move-3$/);
  await expect(page.getByRole("button", { name: "Choose move 3" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#move-3").getByText("Set by the randomizer")).toHaveCount(0);
  await expect(page.locator("#move-1").getByText("Set by the randomizer")).toBeVisible();
});

test("the recap offers no edit link for an ability or item the randomizer set", async ({ page }) => {
  await page.goto("/randomizer");
  await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
  await page.getByRole("checkbox", { name: "Ability randomizer" }).check();
  await page.getByRole("checkbox", { name: "Item randomizer" }).check();
  // Items follow abilities when Move is off.
  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await results.getByRole("button").first().click();

  await page.getByRole("button", { name: /^Continue to abilities/ }).click();
  await page.getByRole("button", { name: "Generate abilities" }).click();
  await page.getByRole("list", { name: "Generated abilities" }).getByRole("listitem").first().getByRole("button").first().click();

  await page.getByRole("button", { name: /^Continue to items/ }).click();
  await page.getByRole("button", { name: "Generate items" }).click();
  await page.getByRole("list", { name: "Generated items" }).getByRole("listitem").nth(1).getByRole("button").first().click();
  await page.getByRole("link", { name: "Continue to builder" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Build / })).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Choose move 1" }).click();
  await page.getByRole("combobox", { name: "Search moves" }).fill("Protect");
  await page.getByRole("option", { name: /^Protect,/ }).click();
  for (const stat of ["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed"]) {
    await page.getByRole("spinbutton", { name: `${stat} EVs`, exact: true }).fill("0");
  }
  const nature = page.getByRole("combobox", { name: "Nature" });
  await nature.selectOption((await nature.locator("option").nth(1).getAttribute("value"))!);
  await page.getByRole("button", { name: "Continue to recap" }).click();
  await expect(page).toHaveURL(/\/recap$/);

  await expect(page.getByRole("link", { name: "Edit ability" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Edit held item" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Edit move 1: Protect" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit nickname" })).toBeVisible();
});

test("a phone shows ability, move, and item choices inside the picker", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBuilder(page);

  await page.getByRole("button", { name: /^Ability:/ }).click();
  const ability = page.getByRole("listbox", { name: "Abilities" }).getByRole("option").first();
  await expect(ability).toBeVisible();
  await expectInPhoneViewport(ability, 844);
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Choose move 1" }).click();
  const move = page.getByRole("listbox", { name: "Matching moves" }).getByRole("option").first();
  await expect(move).toBeVisible();
  await expectInPhoneViewport(move, 844);
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: /^Held item:/ }).click();
  const item = page.getByRole("option", { name: "None", exact: true });
  await expect(item).toBeVisible();
  await expectInPhoneViewport(item, 844);
});

async function expectInPhoneViewport(locator: Locator, viewportHeight: number) {
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.height).toBeGreaterThan(20);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight + 1);
}