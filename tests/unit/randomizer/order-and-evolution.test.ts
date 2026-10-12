import { describe, expect, it } from "vitest";
import { evolutionChoiceAllowed, evolutionChoices } from "@/lib/data/evolution";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { firstOpenRandomizerTab } from "@/lib/randomizer/flow";
import {
  applySessionConfig,
  chooseEvolvedPokemon,
  createInitialSession,
  resetDisallowedEvolution,
} from "@/lib/randomizer/session";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS } from "@/lib/types/stats";
import type { EvolutionStage } from "@/lib/types/taxonomy";

function makeForm(id: string, evolutionStage: EvolutionStage, evolutionTargetIds: string[] = []): PokemonForm {
  return {
    id,
    pokeApiId: 0,
    pokeApiSlug: id,
    name: id,
    displayName: id,
    showdownName: id,
    nationalDexNumber: 0,
    generation: 1,
    types: ["fire"],
    abilityIds: [],
    speciesId: id,
    form: "",
    formType: "base",
    evolutionStage,
    isBasic: evolutionStage === "basic",
    isStage1: evolutionStage === "stage1",
    isStage2: evolutionStage === "stage2",
    isPseudoLegendary: false,
    isSubLegendary: false,
    isLegendary: false,
    isMythical: false,
    isParadox: false,
    isUltraBeast: false,
    isBaby: false,
    dexEntries: [],
    sprites: { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null },
    baseStats: EMPTY_EVS,
    genderRule: "mixed",
    evolutionTargetIds,
  };
}

const charmander = makeForm("charmander", "basic", ["charmeleon", "charizard"]);
const charmeleon = makeForm("charmeleon", "stage1", ["charizard"]);
const charizard = makeForm("charizard", "stage2");
const formById = new Map([charmander, charmeleon, charizard].map((form) => [form.id, form]));

describe("evolution choices follow the Evolution stages filter", () => {
  it("offers nothing when only Basic is selected", () => {
    expect(evolutionChoices(charmander, formById, ["basic"])).toEqual([]);
  });

  it("offers nothing unless Basic, Stage 1, and Stage 2 are all selected", () => {
    expect(evolutionChoices(charmander, formById, ["basic", "stage1"])).toEqual([]);
    expect(evolutionChoices(charmander, formById, ["basic", "stage2"])).toEqual([]);
    expect(evolutionChoices(charmander, formById, ["stage1", "stage2"])).toEqual([]);
    expect(evolutionChoiceAllowed(["basic", "stage2"])).toBe(false);
    expect(evolutionChoiceAllowed(["basic", "stage1", "stage2"])).toBe(true);
    expect(evolutionChoices(charmander, formById, ["basic", "stage1", "stage2"]).map((form) => form.id)).toEqual([
      "charmeleon",
      "charizard",
    ]);
  });

  it("offers every later stage when no filter is given", () => {
    expect(evolutionChoices(charmander, formById)).toHaveLength(2);
  });

  it("puts a Pokémon back to its rolled form when the filter drops its stage", () => {
    const selected = {
      ...createInitialSession(),
      selectedPokemonId: "charmander",
      evolvedPokemonId: "charmander",
      draft: { ...createInitialSession().draft, pokemonId: "charmander" },
    };
    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    expect(evolved.evolvedPokemonId).toBe("charizard");

    const stillAllowed = resetDisallowedEvolution(evolved, formById);
    expect(stillAllowed.evolvedPokemonId).toBe("charizard");

    const basicAndFinal = {
      ...evolved,
      config: { ...evolved.config, evolutionStages: ["basic" as const, "stage2" as const] },
    };
    const reset = resetDisallowedEvolution(basicAndFinal, formById);
    expect(reset.evolvedPokemonId).toBe("charmander");
    expect(reset.draft.pokemonId).toBe("charmander");
  });
});

describe("changing the randomizer order", () => {
  const abilityFirst = {
    ...DEFAULT_RANDOMIZER_CONFIG,
    randomizeAbilities: true,
    randomizeMoves: true,
    randomizerOrder: ["ability", "move", "pokemon", "item"] as typeof DEFAULT_RANDOMIZER_CONFIG.randomizerOrder,
  };

  it("opens whichever randomizer is first", () => {
    expect(firstOpenRandomizerTab(abilityFirst)).toBe("ability");
    const session = applySessionConfig(createInitialSession(), abilityFirst);
    expect(session.tab).toBe("ability");
  });

  it("opens Pokémon again when it is moved back to first", () => {
    const moved = applySessionConfig(createInitialSession(), abilityFirst);
    const back = applySessionConfig(moved, {
      ...abilityFirst,
      randomizerOrder: ["pokemon", "ability", "move", "item"],
    });
    expect(back.tab).toBe("pokemon");
  });

  it("does not move the tab when the first randomizer stays the same", () => {
    const moved = applySessionConfig(createInitialSession(), abilityFirst);
    const onMove = { ...moved, tab: "move" as const };
    const reordered = applySessionConfig(onMove, {
      ...abilityFirst,
      randomizerOrder: ["ability", "move", "item", "pokemon"],
    });
    expect(reordered.tab).toBe("move");
  });
});
