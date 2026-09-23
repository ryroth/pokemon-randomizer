import { describe, expect, it } from "vitest";
import { rerollAbility } from "@/lib/randomizer/abilities";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { rerollItem } from "@/lib/randomizer/items";
import { rerollMove } from "@/lib/randomizer/moves";
import { rerollPokemon } from "@/lib/randomizer/pokemon";
import {
  InsufficientPoolError,
  rerollEmptyMessage,
  rerollUnique,
} from "@/lib/randomizer/randomUtils";
import type { Item, Move } from "@/lib/types/catalog-entities";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS } from "@/lib/types/stats";

function makeForm(id: string, evolutionTargetIds: string[] = []): PokemonForm {
  return {
    id,
    pokeApiId: 0,
    pokeApiSlug: id,
    name: id,
    displayName: id,
    showdownName: id,
    nationalDexNumber: 0,
    generation: 1,
    types: ["normal"],
    abilityIds: [],
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
    evolutionTargetIds,
  };
}

function makeMove(id: string): Move {
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
  };
}

function makeItem(id: string): Item {
  return {
    id,
    pokeApiSlug: id,
    name: id,
    showdownName: id,
    description: `${id} description`,
    kind: "held",
    category: "items",
  };
}

describe("rerollUnique", () => {
  it("replaces one id with a different unused id", () => {
    const pool = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const picked = rerollUnique(pool, ["a", "b"], "a", "reroll-unique", "options");

    expect(picked.id).not.toBe("a");
    expect(picked.id).not.toBe("b");
    expect(["c", "d"]).toContain(picked.id);
  });

  it("reproduces the same replacement for the same seed", () => {
    const pool = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const first = rerollUnique(pool, ["a", "b"], "a", "same-reroll", "options");
    const second = rerollUnique(pool, ["a", "b"], "a", "same-reroll", "options");
    expect(first.id).toBe(second.id);
  });

  it("throws when no other unique option remains", () => {
    expect(() =>
      rerollUnique([{ id: "a" }, { id: "b" }], ["a", "b"], "a", "empty-reroll", "abilities"),
    ).toThrow(InsufficientPoolError);
    expect(() =>
      rerollUnique([{ id: "a" }, { id: "b" }], ["a", "b"], "a", "empty-reroll", "abilities"),
    ).toThrow(rerollEmptyMessage("abilities"));
  });
});

describe("rerollPokemon", () => {
  it("does not pick a form that conflicts with the rest of the batch", () => {
    const charmander = makeForm("charmander", ["charizard"]);
    const charizard = makeForm("charizard");
    const squirtle = makeForm("squirtle");
    const bulbasaur = makeForm("bulbasaur");
    const result = rerollPokemon(
      [charmander, charizard, squirtle, bulbasaur],
      { ...DEFAULT_RANDOMIZER_CONFIG, pokemonCount: 2 },
      ["charizard", "squirtle"],
      "squirtle",
      "pokemon-reroll",
    );

    expect(result.pokemon).toHaveLength(1);
    expect(result.pokemon[0]?.id).toBe("bulbasaur");
  });

  it("throws when every leftover form conflicts with the rest of the batch", () => {
    const charmander = makeForm("charmander", ["charizard"]);
    const charizard = makeForm("charizard");
    const squirtle = makeForm("squirtle");

    expect(() =>
      rerollPokemon(
        [charmander, charizard, squirtle],
        { ...DEFAULT_RANDOMIZER_CONFIG, pokemonCount: 2 },
        ["charizard", "squirtle"],
        "squirtle",
        "pokemon-reroll-empty",
      ),
    ).toThrow(rerollEmptyMessage("Pokémon"));
  });
});

describe("rerollAbility, rerollMove, and rerollItem", () => {
  it("keeps other rolled ids unique", () => {
    const ability = rerollAbility(
      [
        { id: "intimidate", pokeApiSlug: "intimidate", name: "Intimidate", showdownName: "Intimidate", description: "" },
        { id: "levitate", pokeApiSlug: "levitate", name: "Levitate", showdownName: "Levitate", description: "" },
        { id: "blaze", pokeApiSlug: "blaze", name: "Blaze", showdownName: "Blaze", description: "" },
      ],
      ["intimidate", "levitate"],
      "intimidate",
      "ability-reroll",
    );
    expect(ability.abilities[0]?.id).toBe("blaze");

    const move = rerollMove(
      [makeMove("ember"), makeMove("tackle"), makeMove("scratch")],
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true, moveCount: 4 },
      ["ember", "tackle"],
      "ember",
      "move-reroll",
    );
    expect(move.moves[0]?.id).toBe("scratch");

    const item = rerollItem(
      [makeItem("leftovers"), makeItem("lifeorb"), makeItem("choiceband")],
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeItems: true, itemCount: 3 },
      ["leftovers", "lifeorb"],
      "leftovers",
      "item-reroll",
    );
    expect(item.items[0]?.id).toBe("choiceband");
  });

  it("can replace the same option more than once", () => {
    const pool = [makeMove("ember"), makeMove("tackle"), makeMove("scratch"), makeMove("growl")];
    const config = { ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true, moveCount: 4 };
    const first = rerollMove(pool, config, ["ember", "tackle"], "ember", "move-reroll-1");
    const firstId = first.moves[0]?.id;
    expect(firstId).toBeDefined();

    const second = rerollMove(pool, config, [firstId ?? "", "tackle"], firstId ?? "", "move-reroll-2");
    expect(second.moves[0]?.id).not.toBe(firstId);
    expect(second.moves[0]?.id).not.toBe("tackle");
  });

  it("does not pick a move or item outside the current filters", () => {
    const ember = { ...makeMove("ember"), type: "fire" as const };
    const flamethrower = { ...makeMove("flamethrower"), type: "fire" as const };
    const surf = { ...makeMove("surf"), type: "water" as const };
    const move = rerollMove(
      [ember, flamethrower, surf],
      {
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeMoves: true,
        moveCount: 4,
        moveTypes: ["fire"],
      },
      ["ember"],
      "ember",
      "move-reroll-filter",
    );
    expect(move.moves[0]?.id).toBe("flamethrower");

    const leftovers = { ...makeItem("leftovers"), category: "popular" as const };
    const lifeOrb = { ...makeItem("lifeorb"), category: "popular" as const };
    const choiceBand = { ...makeItem("choiceband"), category: "items" as const };
    const item = rerollItem(
      [leftovers, lifeOrb, choiceBand],
      {
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeItems: true,
        itemCount: 2,
        itemCategories: ["popular"],
      },
      ["leftovers"],
      "leftovers",
      "item-reroll-filter",
    );
    expect(item.items[0]?.id).toBe("lifeorb");
  });
});
