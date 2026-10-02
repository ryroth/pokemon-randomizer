import { describe, expect, it } from "vitest";
import { noneMatchesItemQuery, searchItemSections } from "@/lib/builder/itemSearch";
import type { Item } from "@/lib/types/catalog-entities";

function item(partial: Pick<Item, "id" | "name" | "category">): Item {
  return {
    pokeApiSlug: partial.id,
    showdownName: partial.name,
    description: "",
    kind: "held",
    ...partial,
  };
}

const SAMPLE: Item[] = [
  item({ id: "leftovers", name: "Leftovers", category: "popular" }),
  item({ id: "airballoon", name: "Air Balloon", category: "popular" }),
  item({ id: "abilityshield", name: "Ability Shield", category: "items" }),
  item({ id: "lightball", name: "Light Ball", category: "pokemon-specific" }),
];

describe("searchItemSections", () => {
  it("groups an empty search into Showdown category order", () => {
    const sections = searchItemSections(SAMPLE, "");
    expect(sections.map((section) => section.category)).toEqual(["popular", "items", "pokemon-specific"]);
    expect(sections[0]?.items.map((entry) => entry.name)).toEqual(["Air Balloon", "Leftovers"]);
  });

  it("keeps a typed match in its category", () => {
    const sections = searchItemSections(SAMPLE, "left");
    expect(sections).toHaveLength(1);
    expect(sections[0]?.category).toBe("popular");
    expect(sections[0]?.items.map((entry) => entry.id)).toEqual(["leftovers"]);
  });
});

describe("noneMatchesItemQuery", () => {
  it("shows None until the query leaves that word", () => {
    expect(noneMatchesItemQuery("")).toBe(true);
    expect(noneMatchesItemQuery("no")).toBe(true);
    expect(noneMatchesItemQuery("left")).toBe(false);
  });
});
