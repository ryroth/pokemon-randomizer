import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatedCatalogPath, loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { randomizeItems } from "@/lib/randomizer/items";
import { ITEM_CATEGORIES } from "@/lib/types/catalog-entities";

const catalogPath = generatedCatalogPath();
const catalogAvailable = existsSync(catalogPath);

describe.skipIf(!catalogAvailable)("catalog item randomizer", () => {
  const catalog = loadGeneratedCatalog();

  it("rolls unique holdable items for a fixed seed", () => {
    const result = randomizeItems(
      catalog.items,
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeItems: true, itemCount: 3 },
      "catalog-item-seed",
    );
    const ids = result.items.map((item) => item.id);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(result.poolSize).toBe(catalog.items.length);
    expect(catalog.items.length).toBe(507);
    expect(ids.includes("none")).toBe(false);
    expect(catalog.items.some((item) => item.id === "pokeball")).toBe(false);
    expect(catalog.items.some((item) => item.id === "leftovers")).toBe(true);

    const again = randomizeItems(
      catalog.items,
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeItems: true, itemCount: 3 },
      "catalog-item-seed",
    );
    expect(again.items.map((item) => item.id)).toEqual(ids);
  });

  it("rolls only popular items when that Showdown category is selected", () => {
    const result = randomizeItems(
      catalog.items,
      {
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeItems: true,
        itemCount: 3,
        itemCategories: ["popular"],
      },
      "catalog-popular-item-seed",
    );

    expect(result.items).toHaveLength(3);
    expect(result.items.every((item) => item.category === "popular")).toBe(true);
    expect(result.poolSize).toBe(
      catalog.items.filter((item) => item.category === "popular").length,
    );
    expect(result.poolSize).toBeLessThan(catalog.items.length);
    expect(result.poolSize).toBeGreaterThan(3);
    expect(ITEM_CATEGORIES).toContain("popular");
  });
});
