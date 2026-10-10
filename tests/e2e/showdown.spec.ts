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
    if (!window.localStorage.getItem("pokemon-randomizer.teams.v1")) {
      window.localStorage.setItem("pokemon-randomizer.teams.v1", JSON.stringify(value));
    }
  }, box);
}

const GARCHOMP = [
  "Garchomp (F) @ Life Orb",
  "Ability: Rough Skin",
  "Tera Type: Dragon",
  "EVs: 252 Atk / 4 SpD / 252 Spe",
  "Jolly Nature",
  "- Earthquake",
  "- Outrage",
  "- Swords Dance",
  "- Stealth Rock",
].join("\n");

test("the rail shows live type analysis and Showdown text for the active team", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/randomizer");

  const dock = page.getByRole("complementary", { name: "Team" });
  await expect(dock.getByRole("list", { name: "Team 1 roster" })).toBeVisible();

  await dock.locator("summary", { hasText: "Type analysis" }).click();
  const defense = dock.getByRole("table", { name: /^Defense/ });
  // The first team lookup compiles the server function and loads the catalog on a cold dev server.
  await expect(defense).toBeVisible({ timeout: 20_000 });
  // Two members: two numbered columns after Attacker, then Weak and Resist.
  await expect(defense.getByRole("columnheader")).toHaveCount(5);
  // Grass hits Swampert for 4x, and Marshtomp (water/ground) the same way.
  const grass = defense.getByRole("row").filter({ has: dock.page().getByRole("rowheader", { name: /Grass/ }) });
  await expect(grass.getByRole("cell").first()).toContainText("4×");
  // Ground makes Swampert and Marshtomp immune to Electric.
  const electric = defense.getByRole("row").filter({ has: dock.page().getByRole("rowheader", { name: /Electric/ }) });
  await expect(electric.getByRole("cell").first()).toContainText("0×");

  await expect(dock.locator("p", { hasText: "Shared weaknesses:" })).toBeVisible();
  await expect(dock.locator("p", { hasText: "Coverage gaps:" })).toContainText("Ghost");

  const offense = dock.getByRole("table", { name: /^Offense/ });
  const ghost = offense.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /Ghost/ }) });
  await expect(ghost).toContainText("Gap: no coverage");
  const fire = offense.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /Fire/ }) });
  await expect(fire).not.toContainText("Gap");

  await dock.locator("summary", { hasText: "Showdown text" }).click();
  await expect(dock.getByLabel("Showdown text for Team 1")).toContainText("Mud (Swampert) @ Leftovers");
});

test("Showdown dialog exports live text and imports a pasted Pokémon into the team", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/randomizer");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  const dock = page.getByRole("complementary", { name: "Team" });
  const trigger = dock.getByRole("button", { name: "Showdown import / export" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Pokémon Showdown import and export" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Paste Pokémon Showdown text")).toBeFocused();

  const exported = dialog.getByLabel("Showdown text for Team 1");
  await expect(exported).toHaveValue(/Mud \(Swampert\) @ Leftovers/);
  await dialog.getByRole("button", { name: "Copy team text" }).click();
  await expect(dialog.getByText("Copied. Paste it into a Pokémon Showdown teambuilder.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Marshtomp");

  await dialog.getByLabel("Paste Pokémon Showdown text").fill(GARCHOMP);
  await dialog.getByRole("button", { name: "Read paste" }).click();
  await expect(dialog.getByRole("list", { name: "Pasted Pokémon" })).toContainText("Garchomp");
  await expect(dialog.getByText("1 of 1 Pokémon is ready.")).toBeVisible();

  await dialog.getByRole("button", { name: "Add 1 to Team 1" }).click();
  await expect(dialog.getByText("Added 1 Pokémon to Team 1.")).toBeVisible();
  // The export side is live: the new Pokémon is already in the text.
  await expect(exported).toHaveValue(/Garchomp \(F\) @ Life Orb/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(dock.getByRole("list", { name: "Team 1 roster" }).getByRole("listitem").nth(2)).toContainText("Garchomp");

  // Type analysis follows the roster: Garchomp adds a third member column.
  await dock.locator("summary", { hasText: "Type analysis" }).click();
  await expect(dock.getByRole("table", { name: /^Defense/ }).getByRole("columnheader")).toHaveCount(6);
});

test("an import explains what is missing and adds nothing", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/randomizer");

  await page.getByRole("complementary", { name: "Team" }).getByRole("button", { name: "Showdown import / export" }).click();
  const dialog = page.getByRole("dialog", { name: "Pokémon Showdown import and export" });
  await dialog.getByLabel("Paste Pokémon Showdown text").fill("Swampert\n- Earthquake\n\nNotamon");
  await dialog.getByRole("button", { name: "Read paste" }).click();

  await expect(dialog.getByText("0 of 2 Pokémon are ready.")).toBeVisible();
  await expect(dialog.getByText("Add an Ability line.").first()).toBeVisible();
  await expect(dialog.getByText("Add a Nature line", { exact: false }).first()).toBeVisible();
  await expect(dialog.getByText('I do not know a Pokémon called "Notamon".')).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Add 0 to/ })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: /^Save 0 as a new team/ })).toBeDisabled();

  await dialog.getByLabel("Paste Pokémon Showdown text").fill("   ");
  await expect(dialog.getByRole("button", { name: "Read paste" })).toHaveAttribute("aria-disabled", "true");
});

test("a paste too big for the open slots can be saved as a new team", async ({ page }) => {
  await seedTeam(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/randomizer");

  await page.getByRole("complementary", { name: "Team" }).getByRole("button", { name: "Showdown import / export" }).click();
  const dialog = page.getByRole("dialog", { name: "Pokémon Showdown import and export" });
  const five = Array.from({ length: 5 }, () => GARCHOMP).join("\n\n");
  await dialog.getByLabel("Paste Pokémon Showdown text").fill(five);
  await dialog.getByRole("button", { name: "Read paste" }).click();
  await expect(dialog.getByText("5 of 5 Pokémon are ready.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Add 5 to Team 1" })).toBeDisabled();

  await dialog.getByRole("button", { name: "Save 5 as a new team" }).click();
  await expect(dialog.getByText("Added 5 Pokémon to Team 2.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary", { name: "Team" }).getByRole("list", { name: "Team 2 roster" })).toBeVisible();
});
