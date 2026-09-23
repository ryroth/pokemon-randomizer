import { describe, expect, it } from "vitest";
import { filterMoves } from "@/lib/filters/moves";
import type { Move } from "@/lib/types/catalog-entities";
import { POKEMON_TYPES } from "@/lib/types/pokemon-type";

function makeMove(id: string, overrides: Partial<Move> = {}): Move {
  return {
    id,
    pokeApiSlug: id,
    name: id,
    showdownName: id,
    type: "normal",
    category: "physical",
    power: 80,
    accuracy: 100,
    pp: 15,
    description: `${id} description`,
    ...overrides,
  };
}

const earthquake = makeMove("earthquake", { type: "ground" });
const thunderbolt = makeMove("thunderbolt", { type: "electric", category: "special" });
const swordsDance = makeMove("swordsdance", { category: "status", power: null });
const pool = [earthquake, thunderbolt, swordsDance];
const allTypes = [...POKEMON_TYPES];

describe("filterMoves", () => {
  it("keeps every category when all three are selected", () => {
    expect(
      filterMoves(pool, {
        moveCategories: ["physical", "special", "status"],
        moveTypes: allTypes,
      }).map((move) => move.id),
    ).toEqual(["earthquake", "thunderbolt", "swordsdance"]);
  });

  it("keeps only the selected categories", () => {
    expect(
      filterMoves(pool, {
        moveCategories: ["physical", "special"],
        moveTypes: allTypes,
      }).map((move) => move.id),
    ).toEqual(["earthquake", "thunderbolt"]);
    expect(
      filterMoves(pool, { moveCategories: ["status"], moveTypes: allTypes }).map(
        (move) => move.id,
      ),
    ).toEqual(["swordsdance"]);
  });

  it("keeps only the selected types", () => {
    expect(
      filterMoves(pool, {
        moveCategories: ["physical", "special", "status"],
        moveTypes: ["ground", "electric"],
      }).map((move) => move.id),
    ).toEqual(["earthquake", "thunderbolt"]);
    expect(
      filterMoves(pool, {
        moveCategories: ["physical", "special", "status"],
        moveTypes: ["normal"],
      }).map((move) => move.id),
    ).toEqual(["swordsdance"]);
  });

  it("applies category and type filters together", () => {
    expect(
      filterMoves(pool, {
        moveCategories: ["special"],
        moveTypes: ["electric", "normal"],
      }).map((move) => move.id),
    ).toEqual(["thunderbolt"]);
  });

  it("matches nothing when no categories or no types are selected", () => {
    expect(
      filterMoves(pool, { moveCategories: [], moveTypes: allTypes }),
    ).toEqual([]);
    expect(
      filterMoves(pool, {
        moveCategories: ["physical", "special", "status"],
        moveTypes: [],
      }),
    ).toEqual([]);
  });
});
