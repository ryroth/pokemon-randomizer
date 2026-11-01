import { describe, expect, it } from "vitest";
import {
  cloneRandomizerConfig,
  DEFAULT_RANDOMIZER_CONFIG,
  resetPokemonFilters,
} from "@/lib/randomizer/defaults";

describe("DEFAULT_RANDOMIZER_CONFIG", () => {
  it("enables base, regional, and other forms by default", () => {
    expect(DEFAULT_RANDOMIZER_CONFIG.formTypes).toEqual(["base", "regional", "other"]);
    expect(DEFAULT_RANDOMIZER_CONFIG.pokemonCount).toBe(3);
  });
});

describe("cloneRandomizerConfig", () => {
  it("copies filter arrays so callers cannot mutate defaults", () => {
    const clone = cloneRandomizerConfig(DEFAULT_RANDOMIZER_CONFIG);
    clone.formTypes.push("mega");
    clone.generations.pop();
    clone.moveCategories.pop();
    clone.moveTypes.pop();
    clone.itemCategories.pop();
    clone.randomizerOrder.pop();
    clone.nameInitials.pop();
    clone.highestStats.pop();
    clone.lowestStats.pop();
    clone.pokedexColors.pop();
    clone.eggGroups.pop();
    clone.shownCardFacts.pop();

    expect(DEFAULT_RANDOMIZER_CONFIG.formTypes).toEqual(["base", "regional", "other"]);
    expect(DEFAULT_RANDOMIZER_CONFIG.generations).toHaveLength(9);
    expect(DEFAULT_RANDOMIZER_CONFIG.moveCategories).toEqual([
      "physical",
      "special",
      "status",
    ]);
    expect(DEFAULT_RANDOMIZER_CONFIG.moveTypes).toHaveLength(18);
    expect(DEFAULT_RANDOMIZER_CONFIG.itemCategories).toEqual([
      "popular",
      "items",
      "pokemon-specific",
      "usually-useless",
      "useless",
    ]);
    expect(DEFAULT_RANDOMIZER_CONFIG.randomizerOrder).toEqual([
      "pokemon",
      "ability",
      "move",
      "item",
    ]);
    expect(DEFAULT_RANDOMIZER_CONFIG.nameInitials).toHaveLength(26);
    expect(DEFAULT_RANDOMIZER_CONFIG.highestStats).toHaveLength(6);
    expect(DEFAULT_RANDOMIZER_CONFIG.lowestStats).toHaveLength(6);
    expect(DEFAULT_RANDOMIZER_CONFIG.measurementSystem).toBe("imperial");
    expect(DEFAULT_RANDOMIZER_CONFIG.pokedexColors).toHaveLength(10);
    expect(DEFAULT_RANDOMIZER_CONFIG.eggGroups).toHaveLength(15);
    expect(DEFAULT_RANDOMIZER_CONFIG.shownCardFacts).toHaveLength(16);
  });
});

describe("resetPokemonFilters", () => {
  it("restores Pokémon filters without enabling later randomizers", () => {
    const reset = resetPokemonFilters({
      ...DEFAULT_RANDOMIZER_CONFIG,
      pokemonCount: 12,
      generations: [1],
      types: ["fire"],
      typeMatchMode: "and",
      formTypes: ["mega"],
      evolutionStages: ["stage2"],
      allowLegendary: false,
      showPokedexEntry: false,
      shownCardFacts: ["cry"],
      nameInitials: ["S"],
      bstMin: 400,
      genusQuery: "Mouse Pokémon",
      lowestStats: ["atk"],
      measurementSystem: "metric",
      heightMinM: 0.7,
      pokedexColors: ["red"],
      randomizeAbilities: true,
      abilityCount: 5,
    });

    expect(reset.pokemonCount).toBe(3);
    expect(reset.generations).toEqual(DEFAULT_RANDOMIZER_CONFIG.generations);
    expect(reset.formTypes).toEqual(["base", "regional", "other"]);
    expect(reset.allowLegendary).toBe(true);
    expect(reset.nameInitials).toEqual(DEFAULT_RANDOMIZER_CONFIG.nameInitials);
    expect(reset.bstMin).toBeNull();
    expect(reset.genusQuery).toBe("");
    expect(reset.lowestStats).toEqual(DEFAULT_RANDOMIZER_CONFIG.lowestStats);
    expect(reset.heightMinM).toBeNull();
    expect(reset.measurementSystem).toBe("metric");
    expect(reset.shownCardFacts).toEqual(DEFAULT_RANDOMIZER_CONFIG.shownCardFacts);
    expect(reset.showPokedexEntry).toBe(true);
    expect(reset.pokedexColors).toEqual(DEFAULT_RANDOMIZER_CONFIG.pokedexColors);
    expect(reset.randomizeAbilities).toBe(true);
    expect(reset.abilityCount).toBe(5);
  });
});

describe("ability count defaults", () => {
  it("defaults ability randomization off with a count of 3", () => {
    expect(DEFAULT_RANDOMIZER_CONFIG.randomizeAbilities).toBe(false);
    expect(DEFAULT_RANDOMIZER_CONFIG.abilityCount).toBe(3);
    expect(DEFAULT_RANDOMIZER_CONFIG.abilityPoolMode).toBe("all");
    expect(DEFAULT_RANDOMIZER_CONFIG.randomizerOrder).toEqual([
      "pokemon",
      "ability",
      "move",
      "item",
    ]);
  });
});

describe("item count defaults", () => {
  it("defaults item randomization off with a count of 3", () => {
    expect(DEFAULT_RANDOMIZER_CONFIG.randomizeItems).toBe(false);
    expect(DEFAULT_RANDOMIZER_CONFIG.itemCount).toBe(3);
    expect(DEFAULT_RANDOMIZER_CONFIG.itemCategories).toEqual([
      "popular",
      "items",
      "pokemon-specific",
      "usually-useless",
      "useless",
    ]);
  });
});

describe("move count defaults", () => {
  it("defaults move randomization off with a count of 8", () => {
    expect(DEFAULT_RANDOMIZER_CONFIG.randomizeMoves).toBe(false);
    expect(DEFAULT_RANDOMIZER_CONFIG.moveCount).toBe(8);
    expect(DEFAULT_RANDOMIZER_CONFIG.movesPerPokemon).toBe(4);
    expect(DEFAULT_RANDOMIZER_CONFIG.moveCategories).toEqual([
      "physical",
      "special",
      "status",
    ]);
    expect(DEFAULT_RANDOMIZER_CONFIG.moveTypes).toHaveLength(18);
    expect(DEFAULT_RANDOMIZER_CONFIG.movePoolMode).toBe("all");
  });
});
