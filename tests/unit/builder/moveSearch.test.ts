import { describe, expect, it } from "vitest";
import { moveNameMatchSpan, searchMovesByName } from "@/lib/builder/moveSearch";
import type { Move } from "@/lib/types/catalog-entities";

function move(name: string): Move {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    pokeApiSlug: name,
    name,
    showdownName: name,
    type: "normal",
    category: "physical",
    power: 40,
    accuracy: 100,
    pp: 20,
    description: "",
  };
}

describe("searchMovesByName", () => {
  const moves = [move("Earthquake"), move("Ice Beam"), move("Acrobatics"), move("Acid Armor"), move("Brave Bird")];

  it("returns the whole alphabetical list when the search is empty", () => {
    expect(searchMovesByName(moves, "").matches.map((entry) => entry.name)).toEqual([
      "Acid Armor",
      "Acrobatics",
      "Brave Bird",
      "Earthquake",
      "Ice Beam",
    ]);
  });

  it("does not cap a long list", () => {
    const longList = Array.from({ length: 80 }, (_, index) => move(`Move ${index}`));
    expect(searchMovesByName(longList, "").matches).toHaveLength(80);
  });

  it("puts names that start with the typed letters ahead of later matches", () => {
    expect(searchMovesByName(moves, "ac").matches.map((entry) => entry.name)).toEqual([
      "Acid Armor",
      "Acrobatics",
    ]);
  });

  it("matches letters across spaces the way a move id does", () => {
    expect(searchMovesByName(moves, "iceb").matches.map((entry) => entry.name)).toEqual(["Ice Beam"]);
    expect(moveNameMatchSpan("Ice Beam", "iceb")).toEqual({ start: 0, end: 5 });
  });

  it("returns nothing when those letters are not in the name", () => {
    expect(searchMovesByName(moves, "eq").matches).toEqual([]);
  });
});
