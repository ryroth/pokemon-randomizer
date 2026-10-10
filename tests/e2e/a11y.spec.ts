import { expect, test, type Page } from "@playwright/test";
import { auditFocusRings, findContrastFailures } from "./a11y-helpers";
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
  level: 100,
  shiny: false,
  happiness: 255,
};

async function seedTeam(page: Page) {
  const box = {
    activeTeamId: "team-a",
    teams: [
      {
        id: "team-a",
        name: "Team 1",
        sets: [
          { ...SET, pokemonId: "swampert", nickname: "Mud" },
          { ...SET, pokemonId: "marshtomp" },
        ],
      },
    ],
  };
  await page.addInitScript((value) => {
    if (!window.localStorage.getItem("pokemon-randomizer.teams.v1")) {
      window.localStorage.setItem("pokemon-randomizer.teams.v1", JSON.stringify(value));
    }
  }, box);
}

const ROUTES = ["/", "/randomizer", "/builder", "/recap", "/teams"] as const;

test.describe("landmarks", () => {
  for (const route of ROUTES) {
    test(`${route} has one of each page landmark and every landmark is named once`, async ({ page }) => {
      await seedTeam(page);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(route);

      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      await expect(page.getByRole("complementary", { name: "Team" })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      // Two navigation landmarks would need different names. The phone bar is hidden at this width.
      const navigations = page.getByRole("navigation");
      const names = await navigations.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label") ?? node.getAttribute("aria-labelledby") ?? ""),
      );
      expect(names.every(Boolean)).toBe(true);
      expect(new Set(names).size).toBe(names.length);

      // The skip link is the first stop and jumps to the main region.
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Skip to content" });
      await expect(skip).toBeFocused();
      await expect(skip).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#main$/);
    });
  }

  test("the phone layout keeps one primary navigation and a named team sheet", async ({ page }) => {
    await seedTeam(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/randomizer");

    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);
    await page.getByRole("button", { name: /^Team/ }).click();
    await expect(page.getByRole("dialog", { name: "Team" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("contrast", () => {
  for (const scheme of ["light", "dark"] as const) {
    for (const route of ["/", "/randomizer", "/teams", "/recap"] as const) {
      test(`${route} text meets WCAG AA in ${scheme} mode`, async ({ page }) => {
        await seedTeam(page);
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        if (route === "/randomizer") {
          const generate = page.getByRole("button", { name: "Generate Pokémon" });
          await waitForHydration(generate);
          await generate.click();
          await expect(page.getByRole("list", { name: "Current generation" })).toBeVisible();
        }
        const dock = page.getByRole("complementary", { name: "Team" });
        await dock.locator("summary", { hasText: "Type analysis" }).click();
        await dock.locator("summary", { hasText: "Showdown text" }).click();
        // The first team lookup compiles the server function and loads the catalog on a cold dev server.
        await expect(dock.getByRole("table", { name: /^Defense/ })).toBeVisible({ timeout: 20_000 });

        expect(await findContrastFailures(page)).toEqual([]);
      });
    }
  }

  test("the Showdown dialog meets WCAG AA in both color schemes", async ({ page }) => {
    await seedTeam(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/randomizer");
      await page.getByRole("button", { name: "Showdown import / export" }).click();
      const dialog = page.getByRole("dialog", { name: "Pokémon Showdown import and export" });
      await dialog.getByLabel("Paste Pokémon Showdown text").fill("Swampert\n- Earthquake");
      await dialog.getByRole("button", { name: "Read paste" }).click();
      await expect(dialog.getByText("Needs changes")).toBeVisible();
      expect(await findContrastFailures(page, "dialog[open]"), scheme).toEqual([]);
    }
  });
});

test.describe("keyboard focus", () => {
  for (const route of ["/randomizer", "/teams", "/recap"] as const) {
    test(`${route} shows a focus indicator on every tab stop`, async ({ page }) => {
      await seedTeam(page);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const { stops, failures } = await auditFocusRings(page);
      expect(stops).toBeGreaterThan(8);
      expect(failures).toEqual([]);
    });
  }

  test("the Showdown dialog traps focus and returns it to the button", async ({ page }) => {
    await seedTeam(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/randomizer");

    const trigger = page.getByRole("button", { name: "Showdown import / export" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Pokémon Showdown import and export" });
    await expect(dialog).toBeVisible();

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      // Past the last control, Chromium hands focus to the browser's own UI, so the page body is fine.
      // Focus must never land on the page behind the dialog.
      expect(
        await dialog.evaluate((node) => document.activeElement === document.body || node.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("builder", () => {
  async function openBuilder(page: Page) {
    await seedTeam(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/randomizer");
    const generate = page.getByRole("button", { name: "Generate Pokémon" });
    await waitForHydration(generate);
    await generate.click();
    await page.getByRole("list", { name: "Current generation" }).getByRole("button").first().click();
    await page.getByRole("link", { name: "Continue to builder" }).click();
    // The dev server compiles the builder on first visit, which is slow under load.
    await expect(page.getByRole("heading", { level: 1, name: /^Build / })).toBeVisible({ timeout: 30_000 });
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`the Build Lab meets WCAG AA in ${scheme} mode, with the move palette open`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await openBuilder(page);
      expect(await findContrastFailures(page, "main")).toEqual([]);

      await page.getByRole("button", { name: "Choose move 1" }).click();
      await expect(page.getByRole("combobox", { name: "Search moves" })).toBeVisible();
      expect(await findContrastFailures(page, "dialog[open]")).toEqual([]);
    });
  }

  test("every Build Lab control shows a focus indicator", async ({ page }) => {
    await openBuilder(page);
    const { stops, failures } = await auditFocusRings(page, 200);
    expect(stops).toBeGreaterThan(20);
    expect(failures).toEqual([]);
  });
});