import { describe, expect, it } from "vitest";
import { filterItems } from "@/lib/filters/items";
import type { Item } from "@/lib/types/catalog-entities";

function makeItem(id: string, overrides: Partial<Item> = {}): Item {
  return {
    id,
    pokeApiSlug: id,
    name: id,
    showdownName: id,
    description: `${id} description`,
    kind: "held",
    category: "items",
    ...overrides,
  };
}

const leftovers = makeItem("leftovers", { category: "popular" });
const sitrus = makeItem("sitrusberry", { kind: "berry", category: "items" });
const thickClub = makeItem("thickclub", { category: "pokemon-specific" });
const oran = makeItem("oranberry", { kind: "berry", category: "usually-useless" });
const rareBone = makeItem("rarebone", { category: "useless" });
const pool = [leftovers, sitrus, thickClub, oran, rareBone];

describe("filterItems", () => {
  it("keeps every Showdown teambuilder category when all five are selected", () => {
    expect(
      filterItems(pool, {
        itemCategories: ["popular", "items", "pokemon-specific", "usually-useless", "useless"],
      }).map((item) => item.id),
    ).toEqual(["leftovers", "sitrusberry", "thickclub", "oranberry", "rarebone"]);
  });

  it("keeps only the selected categories", () => {
    expect(
      filterItems(pool, { itemCategories: ["popular", "items"] }).map((item) => item.id),
    ).toEqual(["leftovers", "sitrusberry"]);
    expect(
      filterItems(pool, { itemCategories: ["pokemon-specific"] }).map((item) => item.id),
    ).toEqual(["thickclub"]);
  });

  it("matches nothing when no categories are selected", () => {
    expect(filterItems(pool, { itemCategories: [] })).toEqual([]);
  });
});
