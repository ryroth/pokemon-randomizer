import { describe, expect, it } from "vitest";
import { isStabMove, natureChoiceLabel, natureEffect, searchAbilitiesByName } from "@/lib/builder";
import type { Nature } from "@/lib/types/catalog-entities";

describe("isStabMove", () => {
  it("is true for a damaging move of the Pokémon's own type", () => {
    expect(isStabMove({ type: "water", category: "physical" }, ["water", "ground"])).toBe(true);
    expect(isStabMove({ type: "ground", category: "special" }, ["water", "ground"])).toBe(true);
  });

  it("is false for other types and for status moves", () => {
    expect(isStabMove({ type: "fire", category: "special" }, ["water", "ground"])).toBe(false);
    expect(isStabMove({ type: "water", category: "status" }, ["water"])).toBe(false);
  });
});

describe("searchAbilitiesByName", () => {
  const abilities = [
    { name: "Intimidate" },
    { name: "Torrent" },
    { name: "Swift Swim" },
    { name: "Sheer Force" },
  ];

  it("keeps the given order for an empty search", () => {
    expect(searchAbilitiesByName(abilities, "").map((ability) => ability.name)).toEqual([
      "Intimidate",
      "Torrent",
      "Swift Swim",
      "Sheer Force",
    ]);
  });

  it("ignores spaces and case, and ranks earlier matches first", () => {
    expect(searchAbilitiesByName(abilities, "swiftsw").map((ability) => ability.name)).toEqual(["Swift Swim"]);
    expect(searchAbilitiesByName(abilities, "TOR").map((ability) => ability.name)).toEqual(["Torrent"]);
    expect(searchAbilitiesByName(abilities, "e").map((ability) => ability.name)).toEqual([
      "Sheer Force",
      "Torrent",
      "Intimidate",
    ]);
  });

  it("returns nothing when no ability matches", () => {
    expect(searchAbilitiesByName(abilities, "zzz")).toEqual([]);
  });
});

describe("Nature labels", () => {
  const jolly: Nature = {
    id: "jolly",
    pokeApiSlug: "jolly",
    name: "Jolly",
    showdownName: "Jolly",
    plusStat: "spe",
    minusStat: "spa",
  };

  it("uses Showdown stat names", () => {
    expect(natureChoiceLabel(jolly)).toBe("Jolly (+Spe, −SpA)");
    expect(natureEffect(jolly)).toEqual({ plus: "Spe", minus: "SpA" });
  });

  it("leaves a neutral Nature as just its name", () => {
    const hardy: Nature = { ...jolly, id: "hardy", name: "Hardy", plusStat: null, minusStat: null };
    expect(natureChoiceLabel(hardy)).toBe("Hardy");
    expect(natureEffect(hardy)).toBeNull();
  });
});
