import { expect, test, type Page } from "@playwright/test";

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
    // Runs on every navigation. Seed once so later reorders are not overwritten.
    if (!window.localStorage.getItem("pokemon-randomizer.teams.v1")) {
      window.localStorage.setItem("pokemon-randomizer.teams.v1", JSON.stringify(value));
    }
  }, box);
}

test("desktop shows a persistent roster that reorders and copies", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/randomizer");

  const dock = page.getByRole("complementary", { name: "Team" });
  await expect(dock).toBeVisible();
  const roster = dock.getByRole("list", { name: "Team 1 roster" });
  await expect(roster.getByRole("listitem")).toHaveCount(6);
  await expect(roster.getByRole("listitem").nth(0)).toContainText("Mud (Swampert)");
  await expect(roster.getByRole("listitem").nth(1)).toContainText("Marshtomp");
  await expect(roster.getByRole("listitem").nth(2)).toContainText("Empty slot");
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);

  await dock.getByRole("button", { name: "Move Marshtomp up" }).click();
  await expect(roster.getByRole("listitem").nth(0)).toContainText("Marshtomp");
  await expect(dock.getByRole("status")).toContainText("Moved the Pokémon from slot 2 to slot 1.");

  // Same storage as the Teams page, and it survives navigation.
  await page.goto("/teams");
  await expect(page.getByRole("list", { name: "Team 1 slots" })).toContainText("Slot 1. Marshtomp");
  await expect(page.getByRole("complementary", { name: "Team" })).toBeVisible();

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("complementary", { name: "Team" }).getByRole("button", { name: "Copy team" }).click();
  await expect(page.getByRole("complementary", { name: "Team" }).getByRole("status")).toContainText("Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Mud (Swampert)");
  expect(copied).toContain("Marshtomp");
});

test("a phone gets a bottom bar and a team sheet instead of the rail", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/randomizer");

  await expect(page.getByRole("complementary", { name: "Team" })).toBeHidden();
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Randomizer", exact: true })).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: /^Team 2\/6/ }).click();
  const sheet = page.getByRole("dialog", { name: "Team" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("list", { name: "Team 1 roster" }).getByRole("listitem").first()).toContainText(
    "Mud (Swampert)",
  );
  await sheet.getByRole("button", { name: "Move Mud (Swampert) down" }).click();
  await expect(sheet.getByRole("listitem").first()).toContainText("Marshtomp");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows).toBe(false);
});

test("a tablet keeps the header links and a team button, without the rail", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 800, height: 1000 });
  await page.goto("/teams");

  await expect(page.getByRole("complementary", { name: "Team" })).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Team 2\/6/ })).toBeVisible();
});

test("an ultrawide window stays inside the 1800px container", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 3440, height: 1200 });
  await page.goto("/randomizer");

  const dock = page.getByRole("complementary", { name: "Team" });
  const box = await dock.boundingBox();
  expect(box).not.toBeNull();
  // Centered 1800px container: the rail ends at (3440 + 1800) / 2 = 2620.
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(2621);
  expect(box?.width).toBeLessThanOrEqual(360);
});
