import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./helpers";

const iconHref = (page: Page) =>
  page.evaluate(() => document.querySelector('link[rel~="icon"]')?.getAttribute("href") ?? "");

async function generateOne(page: Page) {
  await page.goto("/randomizer");
  await page.getByRole("spinbutton", { name: "Pokémon count" }).fill("1");
  const generate = page.getByRole("button", { name: "Generate Pokémon" });
  await waitForHydration(generate);
  await generate.click();
  await expect(page.getByRole("list", { name: "Current generation" }).getByRole("listitem")).toHaveCount(1);
}

function selectRolledPokemon(page: Page) {
  return page.getByRole("list", { name: "Current generation" }).getByRole("button").first().click();
}

test.describe("tab icon", () => {
  test("stays Ditto when Pokémon are generated, turns into the selected Pokémon, then goes back to Ditto", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/randomizer");
    expect(await iconHref(page)).toMatch(/^\/icon\.png/);

    await generateOne(page);
    await page.waitForTimeout(2500);
    expect(await iconHref(page)).toMatch(/^\/icon\.png/);

    await selectRolledPokemon(page);
    await expect.poll(() => iconHref(page), { timeout: 15_000 }).toMatch(/^data:image\/png/);
    await expect.poll(() => iconHref(page), { timeout: 15_000 }).toMatch(/^\/icon\.png/);
  });

  test("stays a still Ditto when the visitor prefers reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await generateOne(page);
    await selectRolledPokemon(page);
    await page.waitForTimeout(2500);
    expect(await iconHref(page)).toMatch(/^\/icon\.png/);
  });
});
