import { expect, test } from "@playwright/test";

test("a selected Pokémon can join a team before it is built", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/randomizer");
  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  const results = page.getByRole("list", { name: "Current generation" });
  await results.getByRole("button").first().click();

  const add = page.getByRole("button", { name: "Add to the team and roll the next" });
  await expect(add).toBeEnabled();
  await add.click();

  await expect(page.getByRole("button", { name: "Generate Pokémon" })).toBeVisible();
  const dock = page.getByRole("complementary", { name: "Team" });
  await expect(dock.getByRole("list", { name: /roster$/ })).toContainText("Not built yet");
  await expect(dock).toContainText("1/6");
});

test("a full team does not block a second team", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    if (!window.localStorage.getItem("pokemon-randomizer.teams.v1")) {
      window.localStorage.setItem(
        "pokemon-randomizer.teams.v1",
        JSON.stringify({
          activeTeamId: null,
          teams: [],
          draftRoster: {
            id: "draft-1",
            name: "Team 1",
            slots: Array.from({ length: 5 }, () => ({
              status: "draft",
              pokemon: {
                draft: { pokemonId: "pikachu", moveIds: [] },
                locks: { ability: false, item: false, moveSlots: [] },
              },
            })),
          },
        }),
      );
    }
  });
  await page.goto("/randomizer");
  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  await page.getByRole("list", { name: "Current generation" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "Add to the team and roll the next" }).click();
  await expect(page.getByRole("button", { name: "Generate Pokémon" })).toBeVisible();
  const dock = page.getByRole("complementary", { name: "Team" });
  await expect(dock).toContainText("6/6");
  await expect(page.getByRole("heading", { name: /^Build /, level: 1 })).toHaveCount(0);

  await page.getByRole("button", { name: "Generate Pokémon" }).click();
  await page.getByRole("list", { name: "Current generation" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "Add to a new team and roll the next" }).click();
  await expect(dock).toContainText("1/6");
  await expect(dock.getByRole("combobox", { name: "Active team" })).toContainText("Team 1");
  await expect(dock.getByRole("combobox", { name: "Active team" })).toContainText("Team 2");
});

test("an unbuilt Pokémon can be viewed and built before the earlier slots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    if (!window.localStorage.getItem("pokemon-randomizer.teams.v1")) {
      const draft = (pokemonId: string, abilityId?: string) => ({
        status: "draft",
        pokemon: {
          draft: { pokemonId, abilityId, moveIds: [] },
          locks: { ability: Boolean(abilityId), item: false, moveSlots: [] },
        },
      });
      window.localStorage.setItem(
        "pokemon-randomizer.teams.v1",
        JSON.stringify({
          activeTeamId: null,
          teams: [],
          draftRosters: [
            {
              id: "draft-1",
              name: "Team 1",
              slots: [
                draft("pikachu", "static"),
                draft("charmander", "blaze"),
                draft("squirtle", "torrent"),
                draft("bulbasaur", "overgrow"),
                draft("eevee", "runaway"),
                draft("sandshrew", "sandveil"),
              ],
            },
          ],
        }),
      );
    }
  });
  await page.goto("/teams");
  const team = page.getByRole("region", { name: "Team 1" });
  await expect(team).toBeVisible();
  await team.getByRole("button", { name: "View Charmander" }).click();
  await expect(team).toContainText("Blaze");
  await expect(team).toContainText("Atk 52");
  await team.getByRole("button", { name: "Build Charmander" }).click();
  await expect(page.getByRole("heading", { name: "Build Charmander", level: 1 })).toBeVisible();
  await expect(page.getByText("This is slot 2 of 6.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Other Pokémon on this team" })).toContainText("Pikachu");
  await expect(page.getByRole("region", { name: "Other Pokémon on this team" })).toContainText("Static");
});
