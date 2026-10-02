import { describe, expect, it } from "vitest";
import { nextMoveSort, sortMoves } from "@/lib/builder/moveSort";
import type { Move } from "@/lib/types/catalog-entities";

function move(partial: Pick<Move, "name"> & Partial<Move>): Move {
  return {
    id: partial.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    pokeApiSlug: partial.name,
    showdownName: partial.name,
    type: "normal",
    category: "physical",
    power: 40,
    accuracy: 100,
    pp: 20,
    description: "",
    ...partial,
  };
}

const moves = [
  move({ name: "Tackle", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 35, description: "A physical attack" }),
  move({ name: "Growl", type: "normal", category: "status", power: null, accuracy: 100, pp: 40, description: "Lowers Attack" }),
  move({ name: "Ember", type: "fire", category: "special", power: 40, accuracy: 100, pp: 25, description: "May burn" }),
  move({ name: "Swift", type: "normal", category: "special", power: 60, accuracy: null, pp: 20, description: "Never misses" }),
];

describe("sortMoves", () => {
  it("sorts power from highest to lowest and keeps dashes after numbered moves", () => {
    expect(sortMoves(moves, { column: "power", direction: "desc" }).map((entry) => entry.name)).toEqual([
      "Swift",
      "Ember",
      "Tackle",
      "Growl",
    ]);
  });

  it("sorts types A to Z and breaks ties by name", () => {
    expect(sortMoves(moves, { column: "type", direction: "asc" }).map((entry) => entry.name)).toEqual([
      "Ember",
      "Growl",
      "Swift",
      "Tackle",
    ]);
  });

  it("sorts a placeholder power of 1 with the other dashes", () => {
    const variable = move({ name: "Ruination", power: 1 });
    expect(sortMoves([...moves, variable], { column: "power", direction: "asc" }).map((entry) => entry.name)).toEqual([
      "Growl",
      "Ruination",
      "Ember",
      "Tackle",
      "Swift",
    ]);
  });

  it("sorts category labels and effects", () => {
    expect(sortMoves(moves, { column: "category", direction: "asc" }).map((entry) => entry.category)).toEqual([
      "physical",
      "special",
      "special",
      "status",
    ]);
    expect(sortMoves(moves, { column: "effect", direction: "asc" })[0]?.name).toBe("Tackle");
  });
});

describe("nextMoveSort", () => {
  it("starts numbers high to low and flips on the next click", () => {
    const first = nextMoveSort(null, "power");
    expect(first).toEqual({ column: "power", direction: "desc" });
    expect(nextMoveSort(first, "power")).toEqual({ column: "power", direction: "asc" });
  });

  it("starts text columns A to Z", () => {
    expect(nextMoveSort(null, "name")).toEqual({ column: "name", direction: "asc" });
  });
});
