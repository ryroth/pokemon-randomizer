import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./helpers";

const SET = {
  itemId: "leftovers",
  abilityId: "torrent",
  moveIds: ["earthquake", "waterfall", "icepunch", "stealthrock"],
  evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  natureId: "adamant",
  teraType: "water",
  gender: null,
  level: 50,
  shiny: false,
  happiness: 255,
};

async function seedTeam(page: Page) {
  const box = {
    activeTeamId: "team-a",
    teams: [{ id: "team-a", name: "Team 1", sets: [{ ...SET, pokemonId: "swampert", nickname: "Mud" }] }],
  };
  await page.addInitScript((value) => {
    if (!window.localStorage.getItem("pokemon-randomizer.teams.v1")) {
      window.localStorage.setItem("pokemon-randomizer.teams.v1", JSON.stringify(value));
    }
  }, box);
}

/** A valid 3D model file that has a scene but no animation clips, so it would stand in a T-pose. */
function stillGlb(): Buffer {
  const json = Buffer.from(JSON.stringify({ asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [] }] }));
  const padded = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + padded.length, 8);
  const chunk = Buffer.alloc(8);
  chunk.writeUInt32LE(padded.length, 0);
  chunk.writeUInt32LE(0x4e4f534a, 4);
  return Buffer.concat([header, chunk, padded]);
}

test.describe("loading screen", () => {
  // Without scripts the page stays on the server-rendered loading screen.
  test.use({ javaScriptEnabled: false, reducedMotion: "no-preference" });

  test("pixel sprites run across the screen while the app loads", async ({ page }) => {
    await page.goto("/randomizer");

    const track = page.locator("[data-loading-sprites]");
    await expect(page.getByRole("status").filter({ hasText: "Loading" }).first()).toBeAttached();
    await expect(track.locator("img")).toHaveCount(7);
    // The sprites are decoration, so assistive technology skips them.
    await expect(track).toHaveAttribute("aria-hidden", "true");

    const runner = track.locator(".loading-runner").first();
    const first = await runner.boundingBox();
    await expect.poll(async () => (await runner.boundingBox())?.x).not.toBe(first?.x);
  });
});

test.describe("loading screen with reduced motion", () => {
  test.use({ javaScriptEnabled: false, reducedMotion: "reduce" });

  test("the sprites stand still in a row", async ({ page }) => {
    await page.goto("/randomizer");

    const runner = page.locator("[data-loading-sprites] .loading-runner").first();
    await expect(runner).toHaveCSS("position", "static");
    await expect(runner).toHaveCSS("animation-name", "none");
  });
});

test.describe("pokeball reveal", () => {
  test.use({ reducedMotion: "no-preference" });

  test("each card comes out of a ball, then can be used", async ({ page }) => {
    await page.goto("/randomizer");
    const generate = page.getByRole("button", { name: "Generate Pokémon" });
    await waitForHydration(generate);
    await generate.click();

    const results = page.getByRole("list", { name: "Current generation" });
    await expect(results.getByRole("listitem")).toHaveCount(6);
    // While the balls play, every card is held back and cannot be clicked.
    const reveals = page.locator("[data-pokeball-reveal]");
    await expect(reveals).toHaveCount(6);
    await expect(reveals.first().locator("[inert]")).toHaveCount(1);
    await expect(reveals.first().locator(".ball-flight")).toBeVisible();

    // Then the balls open and the cards can be chosen.
    await expect(reveals).toHaveCount(0, { timeout: 10_000 });
    await expect(results.locator("[inert]")).toHaveCount(0);
    await results.getByRole("listitem").first().getByRole("button").first().click();
    await expect(page.getByText("Selected", { exact: true }).first()).toBeVisible();
  });

  test("every card names its ball and base stat total", async ({ page }) => {
    await page.goto("/randomizer");
    await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
    await page.getByRole("button", { name: "Generate Pokémon" }).click();

    const results = page.getByRole("list", { name: "Current generation" });
    await expect(results.getByRole("listitem")).toHaveCount(6);
    const cards = await results.getByRole("listitem").all();
    for (const card of cards) {
      await expect(card.getByText(/^BST \d+$/)).toBeVisible();
      await expect(card.getByText(/^(Poké|Great|Ultra|Master|Luxury) Ball$/)).toHaveCount(1);
    }
  });

  test("someone who asks for reduced motion gets the cards at once", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/randomizer");
    await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
    await page.getByRole("button", { name: "Generate Pokémon" }).click();

    await expect(page.getByRole("list", { name: "Current generation" }).getByRole("listitem")).toHaveCount(6);
    await expect(page.locator("[data-pokeball-reveal]")).toHaveCount(0);
    await expect(page.locator("[inert]")).toHaveCount(0);
    await context.close();
  });
});

test.describe("Pokédex entries from every generation", () => {
  test("a generated card steps through older and newer entries", async ({ page }) => {
    await page.goto("/randomizer");
    await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
    await page.getByRole("button", { name: "Generate Pokémon" }).click();

    const results = page.getByRole("list", { name: "Current generation" });
    await expect(results.getByRole("listitem")).toHaveCount(6);
    // Species that first appeared in the newest games may have only one entry, so look for a card that has several.
    const cycler = results.getByRole("group", { name: /^Pokédex entries for / }).first();
    await expect(cycler).toBeVisible({ timeout: 15_000 });

    const label = cycler.locator("p").first();
    const before = await label.textContent();
    await cycler.getByRole("button", { name: /^Older Pokédex entry for / }).click();
    await expect(label).not.toHaveText(before ?? "");
    await cycler.getByRole("button", { name: /^Newer Pokédex entry for / }).click();
    await expect(label).toHaveText(before ?? "");

    // Jump straight to the oldest generation this species has.
    const oldest = cycler.getByRole("group", { name: "Jump to a generation" }).getByRole("button").first();
    const generation = (await oldest.textContent())?.trim() ?? "";
    await oldest.click();
    await expect(label).toContainText(`Gen ${generation} ·`);
    await expect(oldest).toHaveAttribute("aria-pressed", "true");
  });

  test("the recap has the same widget", async ({ page }) => {
    await seedTeam(page);
    await page.goto("/teams");
    await page.getByRole("button", { name: "View recap, slot 1" }).click();

    const cycler = page.getByRole("group", { name: "Pokédex entries for Swampert" });
    await expect(cycler).toBeVisible({ timeout: 15_000 });
    await cycler.getByRole("button", { name: "Generation 3 entry" }).click();
    await expect(cycler).toContainText("Gen 3");
    await expect(cycler).toContainText("Ruby");
  });
});

test.describe("recap artwork fallback", () => {
  test("a model with no idle animation falls back to the artwork", async ({ page }) => {
    await page.route("**/Pokemon-3D-api/assets/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "model/gltf-binary",
        headers: { "access-control-allow-origin": "*" },
        body: stillGlb(),
      }),
    );
    await seedTeam(page);
    await page.goto("/teams");
    await page.getByRole("button", { name: "View recap, slot 1" }).click();

    // The viewer only starts loading once it scrolls into view.
    await page.getByRole("region", { name: "3D idle animation of Swampert" }).scrollIntoViewIfNeeded();
    const artwork = page.getByRole("img", { name: "Artwork of Swampert" });
    await expect(artwork).toBeVisible({ timeout: 20_000 });
    await expect(artwork).toHaveAttribute("src", /official-artwork/);
  });
});

test.describe("Teams page", () => {
  test("has a Next Randomizer button like the recap page", async ({ page }) => {
    await seedTeam(page);
    await page.goto("/teams");

    await page.getByRole("button", { name: "Next Randomizer" }).click();
    await expect(page).toHaveURL(/\/randomizer$/);
    await expect(page.getByRole("heading", { level: 1, name: "Configure your roll" })).toBeVisible();

    // Saved teams are kept.
    await page.goto("/teams");
    await expect(page.getByRole("list", { name: "Team 1 slots" })).toContainText("Mud");
  });
});

test.describe("shiny chance", () => {
  test("defaults to 1% and a certain roll marks every card and starts the builder on Yes", async ({ page }) => {
    await page.goto("/randomizer");
    const chance = page.getByRole("spinbutton", { name: "Shiny chance in percent" });
    await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
    await expect(chance).toHaveValue("1");

    await chance.fill("100");
    await page.getByRole("button", { name: "Generate Pokémon" }).click();
    const results = page.getByRole("list", { name: "Current generation" });
    await expect(results.getByRole("listitem")).toHaveCount(6);
    await expect(results.getByText("Shiny", { exact: true })).toHaveCount(6);

    const name = (await results.getByRole("heading", { level: 3 }).first().textContent())?.trim();
    await results.getByRole("listitem").first().getByRole("button").first().click();
    await page.getByRole("link", { name: "Continue to builder" }).click();
    await expect(page.getByRole("heading", { name: `Build ${name}`, level: 1 })).toBeVisible({ timeout: 20_000 });
    const shiny = page.getByRole("group", { name: "Shiny" });
    await expect(shiny.getByRole("radio", { name: "Yes" })).toBeChecked();
  });

  test("0% never rolls a shiny, and the builder starts on No", async ({ page }) => {
    await page.goto("/randomizer");
    await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
    await page.getByRole("spinbutton", { name: "Shiny chance in percent" }).fill("0");
    await page.getByRole("button", { name: "Generate Pokémon" }).click();
    const results = page.getByRole("list", { name: "Current generation" });
    await expect(results.getByRole("listitem")).toHaveCount(6);
    await expect(results.getByText("Shiny", { exact: true })).toHaveCount(0);

    await results.getByRole("listitem").first().getByRole("button").first().click();
    await page.getByRole("link", { name: "Continue to builder" }).click();
    await expect(page.getByRole("group", { name: "Shiny" }).getByRole("radio", { name: "No" })).toBeChecked({
      timeout: 20_000,
    });
  });

  test("a chance above 100 is explained and does not generate", async ({ page }) => {
    await page.goto("/randomizer");
    await waitForHydration(page.getByRole("button", { name: "Generate Pokémon" }));
    const chance = page.getByRole("spinbutton", { name: "Shiny chance in percent" });
    await chance.fill("150");
    await expect(page.getByRole("alert").filter({ hasText: "between 0% and 100%" })).toBeVisible();
    // The browser also blocks the form while the box is out of range.
    await page.getByRole("button", { name: "Generate Pokémon" }).click();
    await expect(page.getByRole("list", { name: "Current generation" })).toHaveCount(0);

    // Fixing the number clears the warning and generating works again.
    await chance.fill("5");
    await expect(page.getByRole("alert").filter({ hasText: "between 0% and 100%" })).toHaveCount(0);
    await page.getByRole("button", { name: "Generate Pokémon" }).click();
    await expect(page.getByRole("list", { name: "Current generation" }).getByRole("listitem")).toHaveCount(6);
  });
});
