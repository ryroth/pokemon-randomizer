import { describe, expect, it } from "vitest";
import {
  classifyEvolutionStages,
  classifyFormType,
  isPseudoLegendarySpecies,
} from "@/lib/data/classify";
import { createRng, InsufficientPoolError, pickUnique } from "@/lib/randomizer/randomUtils";

describe("classifyFormType", () => {
  it("keeps mega formes as mega", () => {
    expect(classifyFormType({ slug: "venusaur-mega", formName: "mega", isMega: true })).toBe(
      "mega",
    );
  });

  it("classifies regional formes", () => {
    expect(classifyFormType({ slug: "raichu-alola", formName: "alola" })).toBe("regional");
  });

  it("treats default species as base, including hyphenated names", () => {
    expect(classifyFormType({ slug: "kommo-o" })).toBe("base");
  });
});

describe("classifyEvolutionStages", () => {
  it("assigns depths on a branching line", () => {
    const stages = classifyEvolutionStages({
      speciesSlug: "eevee",
      evolvesTo: [
        { speciesSlug: "vaporeon", evolvesTo: [] },
        { speciesSlug: "jolteon", evolvesTo: [] },
      ],
    });

    expect(stages.eevee).toBe("basic");
    expect(stages.vaporeon).toBe("stage1");
    expect(stages.jolteon).toBe("stage1");
  });

  it("caps unusual depth at stage 2", () => {
    const stages = classifyEvolutionStages({
      speciesSlug: "pichu",
      evolvesTo: [
        {
          speciesSlug: "pikachu",
          evolvesTo: [{ speciesSlug: "raichu", evolvesTo: [] }],
        },
      ],
    });

    expect(stages.pichu).toBe("basic");
    expect(stages.pikachu).toBe("stage1");
    expect(stages.raichu).toBe("stage2");
  });
});

describe("pseudo-legendaries", () => {
  it("includes Dragonite and excludes Archaludon", () => {
    expect(isPseudoLegendarySpecies("dragonite")).toBe(true);
    expect(isPseudoLegendarySpecies("archaludon")).toBe(false);
  });
});

describe("seeded rng", () => {
  it("reproduces the same unique picks for the same seed", () => {
    const pool = ["a", "b", "c", "d", "e", "f"];
    const first = pickUnique(pool, 3, createRng("demo-seed"), "Pokémon");
    const second = pickUnique(pool, 3, createRng("demo-seed"), "Pokémon");
    expect(first).toEqual(second);
  });

  it("throws a user-facing insufficient pool error", () => {
    expect(() => pickUnique(["only"], 3, createRng("x"), "Pokémon")).toThrow(
      InsufficientPoolError,
    );
  });
});
