import { expect, test } from "@playwright/test";

const SCENES = [
  { route: "/", scene: "home" },
  { route: "/randomizer", scene: "randomizer" },
  { route: "/builder", scene: "builder" },
  { route: "/recap", scene: "recap" },
  { route: "/teams", scene: "teams" },
] as const;

test.describe("world backdrops", () => {
  for (const { route, scene } of SCENES) {
    test(`${route} shows the ${scene} scene, hidden from assistive tech`, async ({ page }) => {
      await page.goto(route);
      const layers = page.locator(`[data-scene="${scene}"]`);
      await expect(layers).toHaveCount(2);
      for (const layer of await layers.all()) {
        await expect(layer).toHaveAttribute("aria-hidden", "true");
      }
      // Decoration only: nothing inside a layer is focusable or exposed as content.
      await expect(page.locator(".scene-world, .scene-banner").locator("*")).toHaveCount(0);
    });
  }

  test("an unknown URL shows the lost scene", async ({ page }) => {
    await page.goto("/not-a-real-page");
    await expect(page.locator('[data-scene="lost"]').first()).toBeAttached();
  });

  test("light and dark themes load different images, both from this site", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));

    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const light = await page
      .locator(".scene-banner")
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(light).toContain("/world/home-light.webp");

    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    const dark = await page
      .locator(".scene-banner")
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(dark).toContain("/world/home-dark.webp");

    const art = requests.filter((url) => url.includes("/world/"));
    expect(art.length).toBeGreaterThan(0);
    for (const url of art) {
      expect(new URL(url).origin).toBe("http://localhost:3000");
    }
  });

  test("page titles and the brand use the logo lettering, with a yellow fill and a blue outline", async ({ page }) => {
    await page.goto("/randomizer");
    const title = page.getByRole("heading", { level: 1 });
    const brand = page.getByRole("link", { name: "Pokémon Randomizer" }).first();
    for (const element of [title, brand]) {
      const style = await element.evaluate((node) => {
        const computed = getComputedStyle(node);
        return {
          family: computed.fontFamily,
          weight: computed.fontWeight,
          fill: computed.color,
          outline: computed.getPropertyValue("-webkit-text-stroke-width"),
        };
      });
      expect(style.family).toMatch(/^logo\b/);
      expect(style.weight).toBe("400");
      expect(style.fill).toBe("rgb(255, 203, 5)");
      expect(Number.parseFloat(style.outline)).toBeGreaterThan(0);
    }
  });

  test("a page title never covers the link above it", async ({ page }) => {
    // The logo font's glyph box is tall. Unless it is corrected, the title's click area sits on top of the
    // "Back to the randomizer" link that comes right before it in the builder.
    await page.goto("/randomizer");
    await page.getByRole("button", { name: "Generate Pokémon" }).click();
    const results = page.getByRole("list", { name: "Current generation" });
    await results.getByRole("button").first().click();
    await page.getByRole("link", { name: "Continue to builder" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /^Build / })).toBeVisible({ timeout: 20_000 });

    const back = page.getByRole("link", { name: "Back to the randomizer" }).first();
    const topmost = await back.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return hit === element || element.contains(hit);
    });
    expect(topmost).toBe(true);
    await back.click();
    await expect(page).toHaveURL(/\/randomizer$/);
  });

  test("smaller headings, tabs, and navigation use the game-menu typeface and body text keeps the reading font", async ({
    page,
  }) => {
    await page.goto("/randomizer");
    const heading = await page
      .getByRole("heading", { level: 2 })
      .first()
      .evaluate((element) => getComputedStyle(element).fontFamily);
    const nav = await page
      .getByRole("navigation", { name: "Primary" })
      .first()
      .getByRole("link", { name: "Randomizer" })
      .evaluate((element) => getComputedStyle(element).fontFamily);
    const body = await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily);

    expect(heading).toMatch(/kanit/i);
    expect(nav).toMatch(/kanit/i);
    expect(body).not.toMatch(/kanit/i);
  });
});
