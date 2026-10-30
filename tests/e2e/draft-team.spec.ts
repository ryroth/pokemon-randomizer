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

test("the sixth Pokémon opens the builder on the first slot", async ({ page }) => {
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
  await page.getByRole("button", { name: "Add to the team and start building" }).click();
  await expect(page.getByRole("heading", { name: "Build Pikachu", level: 1 })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("This is slot 1 of 6.")).toBeVisible();
});
