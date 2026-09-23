import { describe, expect, it } from "vitest";
import { DEFAULT_RANDOMIZER_CONFIG, TYPICAL_RANDOMIZER_ORDER } from "@/lib/randomizer/defaults";
import {
  builderAbilityPool,
  canOpenRandomizerTab,
  extraSlotsNeeded,
  firstOpenRandomizerTab,
  isExtraBeforePokemon,
  moveRandomizerStep,
  nextOpenDestination,
  nextRandomizerDestination,
  normalizeRandomizerOrder,
  previousOpenDestination,
  reorderRandomizerSteps,
  visibleRandomizerTabs,
} from "@/lib/randomizer";
import { createInitialSession } from "@/lib/randomizer/session";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS } from "@/lib/types/stats";

function makeForm(id: string, abilityIds: string[] = ["torrent", "raindish"]): PokemonForm {
  return {
    id,
    pokeApiId: 0,
    pokeApiSlug: id,
    name: id,
    displayName: id,
    showdownName: id,
    nationalDexNumber: 0,
    generation: 1,
    types: ["water"],
    abilityIds,
    speciesId: id,
    form: "",
    formType: "base",
    evolutionStage: "basic",
    isBasic: true,
    isStage1: false,
    isStage2: false,
    isPseudoLegendary: false,
    isSubLegendary: false,
    isLegendary: false,
    isMythical: false,
    isParadox: false,
    isUltraBeast: false,
    isBaby: false,
    dexEntries: [],
    sprites: { sprite: null, spriteShiny: null, artwork: null },
    baseStats: EMPTY_EVS,
    genderRule: "genderless",
    evolutionTargetIds: [],
  };
}

describe("nextRandomizerDestination", () => {
  it("skips the Ability tab when randomization is off", () => {
    expect(nextRandomizerDestination(DEFAULT_RANDOMIZER_CONFIG, "pokemon")).toBe("builder");
    expect(nextOpenDestination(DEFAULT_RANDOMIZER_CONFIG, "pokemon")).toBe("builder");
  });

  it("opens the Ability tab after Pokémon when randomization is on", () => {
    const config = { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true };
    expect(nextRandomizerDestination(config, "pokemon")).toBe("ability");
    expect(nextOpenDestination(config, "pokemon")).toBe("ability");
    expect(nextOpenDestination(config, "ability")).toBe("builder");
  });

  it("opens the Move tab after Pokémon when randomization is on", () => {
    const config = { ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true };
    expect(nextRandomizerDestination(config, "pokemon")).toBe("move");
    expect(nextOpenDestination(config, "pokemon")).toBe("move");
    expect(nextOpenDestination(config, "move")).toBe("builder");
  });

  it("opens the Item tab after Pokémon when randomization is on", () => {
    const config = { ...DEFAULT_RANDOMIZER_CONFIG, randomizeItems: true };
    expect(nextRandomizerDestination(config, "pokemon")).toBe("item");
    expect(nextOpenDestination(config, "pokemon")).toBe("item");
    expect(nextOpenDestination(config, "item")).toBe("builder");
  });

  it("walks Pokémon to Ability to Move to Item when extras are on", () => {
    const config = {
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizeMoves: true,
      randomizeItems: true,
    };
    expect(nextOpenDestination(config, "pokemon")).toBe("ability");
    expect(nextOpenDestination(config, "ability")).toBe("move");
    expect(nextOpenDestination(config, "move")).toBe("item");
    expect(nextOpenDestination(config, "item")).toBe("builder");
  });

  it("opens Item after Move when both extras are on", () => {
    const config = {
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: false,
      randomizeMoves: true,
      randomizeItems: true,
    };
    expect(nextRandomizerDestination(config, "pokemon")).toBe("move");
    expect(nextOpenDestination(config, "pokemon")).toBe("move");
    expect(nextOpenDestination(config, "move")).toBe("item");
  });

  it("walks a custom order with Ability before Pokémon", () => {
    const config: RandomizerConfig = {
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizerOrder: ["ability", "pokemon", "move", "item"],
    };
    expect(nextOpenDestination(config, "ability")).toBe("pokemon");
    expect(nextOpenDestination(config, "pokemon")).toBe("builder");
    expect(firstOpenRandomizerTab(config)).toBe("ability");
    expect(previousOpenDestination(config, "pokemon")).toBe("ability");
  });
});

describe("visibleRandomizerTabs", () => {
  it("shows Abilities and Moves only when those randomizers are on", () => {
    expect(visibleRandomizerTabs(DEFAULT_RANDOMIZER_CONFIG)).toEqual(["pokemon"]);
    expect(
      visibleRandomizerTabs({ ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true }),
    ).toEqual(["pokemon", "ability"]);
    expect(
      visibleRandomizerTabs({ ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true }),
    ).toEqual(["pokemon", "move"]);
    expect(
      visibleRandomizerTabs({
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeAbilities: true,
        randomizeMoves: true,
      }),
    ).toEqual(["pokemon", "ability", "move"]);
    expect(
      visibleRandomizerTabs({
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeItems: true,
      }),
    ).toEqual(["pokemon", "item"]);
    expect(
      visibleRandomizerTabs({
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeAbilities: true,
        randomizeMoves: true,
        randomizeItems: true,
      }),
    ).toEqual(["pokemon", "ability", "move", "item"]);
  });

  it("follows custom order", () => {
    expect(
      visibleRandomizerTabs({
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeAbilities: true,
        randomizeMoves: true,
        randomizeItems: true,
        randomizerOrder: ["ability", "item", "pokemon", "move"],
      }),
    ).toEqual(["ability", "item", "pokemon", "move"]);
  });
});

describe("canOpenRandomizerTab", () => {
  it("requires a selected Pokémon before opening Abilities after Pokémon", () => {
    const empty = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
    });
    expect(canOpenRandomizerTab(empty, "ability")).toBe(false);
    expect(canOpenRandomizerTab({ ...empty, selectedPokemonId: "swampert" }, "ability")).toBe(true);
  });

  it("opens Abilities before a Pokémon is selected when Ability is first", () => {
    const session = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizerOrder: ["ability", "pokemon", "move", "item"],
    });
    expect(session.tab).toBe("ability");
    expect(canOpenRandomizerTab(session, "ability")).toBe(true);
    expect(isExtraBeforePokemon(session.config, "ability")).toBe(true);
  });

  it("requires a selected Pokémon before opening Moves after Pokémon", () => {
    const empty = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
    });
    expect(canOpenRandomizerTab(empty, "move")).toBe(false);
    expect(canOpenRandomizerTab({ ...empty, selectedPokemonId: "swampert" }, "move")).toBe(true);
  });

  it("opens Moves before a Pokémon is selected when Move is first", () => {
    const session = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
      randomizerOrder: ["move", "pokemon", "ability", "item"],
    });
    expect(session.tab).toBe("move");
    expect(canOpenRandomizerTab(session, "move")).toBe(true);
    expect(isExtraBeforePokemon(session.config, "move")).toBe(true);
  });

  it("requires a selected Pokémon before opening Items after Pokémon", () => {
    const empty = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
    });
    expect(canOpenRandomizerTab(empty, "item")).toBe(false);
    expect(canOpenRandomizerTab({ ...empty, selectedPokemonId: "swampert" }, "item")).toBe(true);
  });

  it("opens Items before a Pokémon is selected when Item is first", () => {
    const session = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
      randomizerOrder: ["item", "pokemon", "ability", "move"],
    });
    expect(session.tab).toBe("item");
    expect(canOpenRandomizerTab(session, "item")).toBe(true);
    expect(isExtraBeforePokemon(session.config, "item")).toBe(true);
  });
});

describe("normalizeRandomizerOrder", () => {
  it("fills missing steps and drops duplicates", () => {
    expect(normalizeRandomizerOrder(["ability", "ability", "pokemon"])).toEqual([
      "ability",
      "pokemon",
      "move",
      "item",
    ]);
  });
});

describe("reorderRandomizerSteps", () => {
  it("moves a step to a new index without wrapping", () => {
    expect(reorderRandomizerSteps(TYPICAL_RANDOMIZER_ORDER, 3, 0)).toEqual([
      "item",
      "pokemon",
      "ability",
      "move",
    ]);
    expect(reorderRandomizerSteps(TYPICAL_RANDOMIZER_ORDER, 0, 2)).toEqual([
      "ability",
      "move",
      "pokemon",
      "item",
    ]);
    expect(reorderRandomizerSteps(TYPICAL_RANDOMIZER_ORDER, 1, 1)).toEqual(
      TYPICAL_RANDOMIZER_ORDER,
    );
    expect(reorderRandomizerSteps(TYPICAL_RANDOMIZER_ORDER, -1, 0)).toEqual(
      TYPICAL_RANDOMIZER_ORDER,
    );
  });
});

describe("moveRandomizerStep", () => {
  it("swaps a step earlier without wrapping", () => {
    expect(moveRandomizerStep(TYPICAL_RANDOMIZER_ORDER, "ability", -1)).toEqual([
      "ability",
      "pokemon",
      "move",
      "item",
    ]);
    expect(moveRandomizerStep(TYPICAL_RANDOMIZER_ORDER, "pokemon", -1)).toEqual(
      TYPICAL_RANDOMIZER_ORDER,
    );
  });
});

describe("extraSlotsNeeded", () => {
  it("uses the chosen moves-per-Pokémon count when Moves run first", () => {
    expect(extraSlotsNeeded("ability", 3)).toBe(3);
    expect(extraSlotsNeeded("item", 3)).toBe(3);
    expect(extraSlotsNeeded("move", 3)).toBe(12);
    expect(extraSlotsNeeded("move", 3, 2)).toBe(6);
    expect(extraSlotsNeeded("move", 3, 1)).toBe(3);
  });
});

describe("builderAbilityPool", () => {
  it("uses the battle Pokémon's usual abilities when the randomizer was skipped", () => {
    const swampert = makeForm("swampert", ["torrent", "damp"]);
    const session = createInitialSession();
    expect(builderAbilityPool(swampert, session)).toEqual(["torrent", "damp"]);
  });

  it("uses the rolled ability options when the randomizer is on", () => {
    const swampert = makeForm("swampert", ["torrent", "damp"]);
    const session = {
      ...createInitialSession({ ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true }),
      abilityOptions: ["protean", "intimidate", "levitate"],
    };
    expect(builderAbilityPool(swampert, session)).toEqual([
      "protean",
      "intimidate",
      "levitate",
    ]);
  });
});
