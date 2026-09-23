import { describe, expect, it } from "vitest";
import {
  assignUniqueFromPool,
  extrasInsufficientMessage,
  MOVES_ASSIGNED_PER_POKEMON,
  requiredMovesPerPokemon,
} from "@/lib/randomizer/applyExtras";
import { InsufficientPoolError } from "@/lib/randomizer/randomUtils";

describe("assignUniqueFromPool", () => {
  it("assigns unique extras and leaves leftovers unused", () => {
    const assigned = assignUniqueFromPool(
      ["a", "b", "c", "d", "e"],
      3,
      "ability-assign",
      "ability",
    );

    expect(assigned).toHaveLength(3);
    expect(new Set(assigned).size).toBe(3);
    for (const id of assigned) {
      expect(["a", "b", "c", "d", "e"]).toContain(id);
    }
  });

  it("reproduces the same assignment for the same seed", () => {
    const first = assignUniqueFromPool(["a", "b", "c", "d"], 2, "repeat-assign", "ability");
    const second = assignUniqueFromPool(["a", "b", "c", "d"], 2, "repeat-assign", "ability");
    expect(second).toEqual(first);
  });

  it("throws when the pool is smaller than the Pokémon count", () => {
    expect(() => assignUniqueFromPool(["a", "b"], 3, "short-assign", "ability")).toThrow(
      InsufficientPoolError,
    );
    expect(() => assignUniqueFromPool(["a", "b"], 3, "short-assign", "ability")).toThrow(
      extrasInsufficientMessage("ability", 2, 3),
    );
  });

  it("requires four unique moves per Pokémon by default", () => {
    expect(MOVES_ASSIGNED_PER_POKEMON).toBe(4);
    expect(() =>
      assignUniqueFromPool(["a", "b", "c", "d", "e"], 8, "short-moves", "move"),
    ).toThrow(extrasInsufficientMessage("move", 5, 8));
    expect(extrasInsufficientMessage("move", 5, 6, 2)).toBe(
      "You generated 5 moves but need 6 unique moves, 2 for each Pokémon. Generate more moves or fewer Pokémon.",
    );
  });
});

describe("requiredMovesPerPokemon", () => {
  it("clamps Move-before apply counts to 1–4", () => {
    expect(requiredMovesPerPokemon(1)).toBe(1);
    expect(requiredMovesPerPokemon(4)).toBe(4);
    expect(requiredMovesPerPokemon(0)).toBe(1);
    expect(requiredMovesPerPokemon(9)).toBe(4);
    expect(requiredMovesPerPokemon(2.5)).toBe(4);
  });
});
