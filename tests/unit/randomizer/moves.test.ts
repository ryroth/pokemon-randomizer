import { describe, expect, it } from "vitest";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { InvalidMoveCountError, randomizeMoves } from "@/lib/randomizer/moves";
import { userFacingRandomizerMessage } from "@/lib/randomizer/pokemon";
import { InsufficientPoolError } from "@/lib/randomizer/randomUtils";
import type { Move } from "@/lib/types/catalog-entities";

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
const flamethrower = makeMove("flamethrower", { type: "fire", category: "special" });
const surf = makeMove("surf", { type: "water", category: "special" });
const pool = [earthquake, thunderbolt, swordsDance, flamethrower, surf];

function config(
  overrides: Partial<typeof DEFAULT_RANDOMIZER_CONFIG> = {},
): typeof DEFAULT_RANDOMIZER_CONFIG {
  return { ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true, moveCount: 4, ...overrides };
}

describe("randomizeMoves", () => {
  it("returns unique moves by id", () => {
    const result = randomizeMoves(pool, config({ moveCount: 4 }), "move-unique");
    const ids = result.moves.map((move) => move.id);

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(result.poolSize).toBe(5);
    expect(result.seed).toBe("move-unique");
  });

  it("only rolls moves from the selected categories", () => {
    const result = randomizeMoves(
      pool,
      config({ moveCount: 4, moveCategories: ["physical", "special"] }),
      "category-filter",
    );

    expect(result.poolSize).toBe(4);
    expect(result.moves.map((move) => move.category).sort()).toEqual([
      "physical",
      "special",
      "special",
      "special",
    ]);
    expect(result.moves.some((move) => move.category === "status")).toBe(false);
  });

  it("only rolls moves from the selected types", () => {
    const result = randomizeMoves(
      pool,
      config({ moveCount: 4, moveTypes: ["ground", "electric", "fire", "water"] }),
      "type-filter",
    );

    expect(result.poolSize).toBe(4);
    expect(result.moves.map((move) => move.type).sort()).toEqual([
      "electric",
      "fire",
      "ground",
      "water",
    ]);
    expect(result.moves.some((move) => move.type === "normal")).toBe(false);
  });

  it("throws when selected categories or types cannot fill the requested count", () => {
    expect(() =>
      randomizeMoves(pool, config({ moveCount: 4, moveCategories: ["status"] }), "status-only"),
    ).toThrow(InsufficientPoolError);
    expect(() =>
      randomizeMoves(pool, config({ moveCount: 4, moveCategories: [] }), "no-categories"),
    ).toThrow(InsufficientPoolError);
    expect(() =>
      randomizeMoves(pool, config({ moveCount: 4, moveTypes: ["dragon"] }), "dragon-only"),
    ).toThrow(InsufficientPoolError);
    expect(() =>
      randomizeMoves(pool, config({ moveCount: 4, moveTypes: [] }), "no-types"),
    ).toThrow(InsufficientPoolError);
  });

  it("reproduces the same roll for the same seed and count", () => {
    const first = randomizeMoves(pool, config({ moveCount: 4 }), "repeat-move");
    const second = randomizeMoves(pool, config({ moveCount: 4 }), "repeat-move");

    expect(first.moves.map((move) => move.id)).toEqual(second.moves.map((move) => move.id));
  });

  it("uses the full catalog even when movePoolMode is learnset", () => {
    const result = randomizeMoves(
      pool,
      config({ moveCount: 5, movePoolMode: "learnset" }),
      "all-moves",
    );

    expect(result.moves.map((move) => move.id).sort()).toEqual(
      ["earthquake", "flamethrower", "surf", "swordsdance", "thunderbolt"].sort(),
    );
  });

  it("throws when the pool is smaller than the requested count", () => {
    expect(() => randomizeMoves(pool, config({ moveCount: 8 }), "short-move-pool")).toThrow(
      InsufficientPoolError,
    );
  });

  it("throws a user-facing error for an out-of-range count", () => {
    expect(() => randomizeMoves(pool, config({ moveCount: 3 }), "bad-count")).toThrow(
      InvalidMoveCountError,
    );
    expect(() => randomizeMoves(pool, config({ moveCount: 13 }), "bad-count")).toThrow(
      InvalidMoveCountError,
    );
  });
});

describe("userFacingRandomizerMessage for moves", () => {
  it("returns the insufficient-pool and invalid-count messages", () => {
    const poolError = new InsufficientPoolError("moves", 2, 8);
    expect(userFacingRandomizerMessage(poolError)).toBe(poolError.message);
    expect(userFacingRandomizerMessage(new InvalidMoveCountError(3))).toBe(
      "Choose between 4 and 12 moves. You asked for 3.",
    );
  });
});
