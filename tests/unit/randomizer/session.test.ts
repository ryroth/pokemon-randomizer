import { describe, expect, it } from "vitest";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import {
  applyAbilityRoll,
  applyAbilityToRolledPokemon,
  applyItemRoll,
  applyItemToRolledPokemon,
  applyMoveRoll,
  applyMoveToRolledPokemon,
  applyPokemonRoll,
  applySessionConfig,
  abilityChoicesForPokemon,
  chooseEvolvedPokemon,
  clearPokemonRolls,
  createInitialSession,
  itemChoicesForPokemon,
  moveChoicesForPokemon,
  openRandomizerTab,
  replaceRolledAbility,
  replaceRolledItem,
  replaceRolledMove,
  replaceRolledPokemon,
  rolledPokemonIds,
  selectRolledAbility,
  selectRolledItem,
  selectRolledMove,
  selectRolledPokemon,
  showNextPokemonRoll,
  showPreviousPokemonRoll,
  syncRandomizerTab,
  unassignedAbilityIds,
  unassignedItemIds,
  unassignedMoveIds,
  viewedPokemonRoll,
} from "@/lib/randomizer/session";
import { NONE_ITEM_ID } from "@/lib/randomizer/items";
import type { Ability, Item, Move } from "@/lib/types/catalog-entities";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS } from "@/lib/types/stats";

function makeForm(id: string): PokemonForm {
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
    evolutionTargetIds: [],
  };
}

function makeAbility(id: string): Ability {
  return {
    id,
    pokeApiSlug: id,
    name: id,
    showdownName: id,
    description: `${id} description`,
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

function moveResult(ids: string[], seed = "move-seed") {
  return {
    seed,
    poolSize: ids.length,
    moves: ids.map((id) => makeMove(id)),
  };
}

function makeItem(id: string): Item {
  return {
    id,
    pokeApiSlug: id,
    name: id,
    showdownName: id,
    description: `${id} description`,
    category: "items",
    kind: "held",
  };
}

function itemResult(ids: string[], seed = "item-seed") {
  return {
    seed,
    poolSize: ids.length,
    items: ids.map((id) => makeItem(id)),
  };
}

describe("randomizer session helpers", () => {
  it("starts on configure with empty results and later randomizers off", () => {
    const session = createInitialSession();

    expect(session.step).toBe("configure");
    expect(session.tab).toBe("pokemon");
    expect(session.resultPokemonIds).toEqual([]);
    expect(session.pokemonRolls).toEqual([]);
    expect(session.viewedRollIndex).toBe(0);
    expect(session.config.formTypes).toEqual(["base"]);
    expect(session.config.randomizeAbilities).toBe(false);
    expect(session.abilityOptions).toEqual([]);
    expect(session.draft.moveIds).toHaveLength(4);
  });

  it("keeps earlier rolls and a previous selection when generating again", () => {
    const session = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 10,
        pokemon: [makeForm("a"), makeForm("b")],
      }),
      "a",
    );

    const rerolled = applyPokemonRoll(session, {
      seed: "def",
      poolSize: 10,
      pokemon: [makeForm("c"), makeForm("d")],
    });

    expect(session.selectedPokemonId).toBe("a");
    expect(session.evolvedPokemonId).toBe("a");
    expect(rerolled.resultPokemonIds).toEqual(["c", "d"]);
    expect(rerolled.pokemonRolls.map((roll) => roll.pokemonIds)).toEqual([
      ["c", "d"],
      ["a", "b"],
    ]);
    expect(rerolled.selectedPokemonId).toBe("a");
    expect(rerolled.viewedRollIndex).toBe(0);
    expect(rerolled.config.seed).toBe("def");
    expect(rerolled.step).toBe("results");
    expect(rolledPokemonIds(rerolled)).toEqual(["c", "d", "a", "b"]);
  });

  it("allows selecting a Pokémon from an earlier roll", () => {
    const session = applyPokemonRoll(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [makeForm("a"), makeForm("b")],
      }),
      {
        seed: "def",
        poolSize: 2,
        pokemon: [makeForm("c"), makeForm("d")],
      },
    );

    expect(selectRolledPokemon(session, "b").selectedPokemonId).toBe("b");
  });

  it("ignores selecting a Pokémon that was not in any roll", () => {
    const session = applyPokemonRoll(createInitialSession(), {
      seed: "abc",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });

    expect(selectRolledPokemon(session, "missing")).toBe(session);
  });

  it("lets the user evolve the selected Pokémon to a later stage", () => {
    const charmander = makeForm("charmander");
    const evolvedCharmander = { ...charmander, evolutionTargetIds: ["charmeleon", "charizard"] };
    const session = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [evolvedCharmander, makeForm("mewtwo")],
      }),
      "charmander",
    );

    const evolved = chooseEvolvedPokemon(session, evolvedCharmander, "charizard");
    expect(evolved.selectedPokemonId).toBe("charmander");
    expect(evolved.evolvedPokemonId).toBe("charizard");
    expect(evolved.draft.pokemonId).toBe("charizard");
    expect(chooseEvolvedPokemon(session, evolvedCharmander, "gyarados")).toBe(session);
  });

  it("resets the evolution choice when a different rolled Pokémon is selected", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const selected = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [charmander, makeForm("mewtwo")],
      }),
      "charmander",
    );
    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    const switched = selectRolledPokemon(evolved, "mewtwo");

    expect(switched.selectedPokemonId).toBe("mewtwo");
    expect(switched.evolvedPokemonId).toBe("mewtwo");
    expect(switched.draft.pokemonId).toBe("mewtwo");
  });

  it("clears generated rolls without changing filters", () => {
    const rolled = applyPokemonRoll(createInitialSession(), {
      seed: "abc",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const cleared = clearPokemonRolls({
      ...rolled,
      config: { ...rolled.config, pokemonCount: 3 },
    });

    expect(cleared.pokemonRolls).toEqual([]);
    expect(cleared.resultPokemonIds).toEqual([]);
    expect(cleared.config.pokemonCount).toBe(3);
    expect(cleared.viewedRollIndex).toBe(0);
  });

  it("moves back through older rolls and forward to the current generation", () => {
    const first = applyPokemonRoll(createInitialSession(), {
      seed: "one",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const second = applyPokemonRoll(first, {
      seed: "two",
      poolSize: 2,
      pokemon: [makeForm("c"), makeForm("d")],
    });
    const third = applyPokemonRoll(second, {
      seed: "three",
      poolSize: 2,
      pokemon: [makeForm("e"), makeForm("f")],
    });

    expect(viewedPokemonRoll(third)?.pokemonIds).toEqual(["e", "f"]);

    const older = showPreviousPokemonRoll(third);
    expect(viewedPokemonRoll(older)?.pokemonIds).toEqual(["c", "d"]);

    const oldest = showPreviousPokemonRoll(older);
    expect(viewedPokemonRoll(oldest)?.pokemonIds).toEqual(["a", "b"]);
    expect(showPreviousPokemonRoll(oldest)).toBe(oldest);

    const backToCurrent = showNextPokemonRoll(showNextPokemonRoll(oldest));
    expect(viewedPokemonRoll(backToCurrent)?.pokemonIds).toEqual(["e", "f"]);
    expect(showNextPokemonRoll(backToCurrent)).toBe(backToCurrent);
  });

  it("does not mutate the default config arrays", () => {
    const session = createInitialSession();
    session.config.formTypes.push("mega");
    expect(DEFAULT_RANDOMIZER_CONFIG.formTypes).toEqual(["base"]);
  });

  it("stores an ability roll only for the current battle Pokémon", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const selected = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [charmander, makeForm("mewtwo")],
      }),
      "charmander",
    );
    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    const result = {
      seed: "ability-seed",
      poolSize: 3,
      abilities: [makeAbility("intimidate"), makeAbility("levitate"), makeAbility("torrent")],
    };

    expect(applyAbilityRoll(evolved, result, "charmander")).toBe(evolved);

    const rolled = applyAbilityRoll(evolved, result, "charizard");
    expect(rolled.abilityOptions).toEqual(["intimidate", "levitate", "torrent"]);
    expect(selectRolledAbility(rolled, "levitate").draft.abilityId).toBe("levitate");
    expect(selectRolledAbility(rolled, "flashfire")).toBe(rolled);
  });

  it("clears abilities when the battle Pokémon changes and keeps them when it does not", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const selected = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [charmander, makeForm("mewtwo")],
      }),
      "charmander",
    );
    const withAbilities = selectRolledAbility(
      applyAbilityRoll(
        selected,
        {
          seed: "ability-seed",
          poolSize: 2,
          abilities: [makeAbility("intimidate"), makeAbility("levitate")],
        },
        "charmander",
      ),
      "intimidate",
    );

    const rerolledSame = applyPokemonRoll(withAbilities, {
      seed: "def",
      poolSize: 2,
      pokemon: [makeForm("squirtle"), makeForm("bulbasaur")],
    });
    expect(rerolledSame.selectedPokemonId).toBe("charmander");
    expect(rerolledSame.abilityOptions).toEqual(["intimidate", "levitate"]);
    expect(rerolledSame.draft.abilityId).toBe("intimidate");

    const evolved = chooseEvolvedPokemon(withAbilities, charmander, "charizard");
    expect(evolved.abilityOptions).toEqual([]);
    expect(evolved.draft.abilityId).toBeUndefined();

    const switched = selectRolledPokemon(withAbilities, "mewtwo");
    expect(switched.abilityOptions).toEqual([]);
    expect(switched.draft.abilityId).toBeUndefined();

    const cleared = clearPokemonRolls(withAbilities);
    expect(cleared.abilityOptions).toEqual([]);
    expect(cleared.draft.abilityId).toBeUndefined();
    expect(cleared.tab).toBe("pokemon");
  });

  it("opens the Ability tab only after a Pokémon is selected and randomization is on", () => {
    const rolled = applyPokemonRoll(createInitialSession(), {
      seed: "abc",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const withAbilitiesOn = {
      ...rolled,
      config: { ...rolled.config, randomizeAbilities: true },
    };
    const selected = selectRolledPokemon(withAbilitiesOn, "a");

    expect(openRandomizerTab(withAbilitiesOn, "ability")).toBe(withAbilitiesOn);
    expect(openRandomizerTab(selected, "ability").tab).toBe("ability");
    expect(
      syncRandomizerTab({
        ...selected,
        tab: "ability",
        config: { ...selected.config, randomizeAbilities: false },
      }).tab,
    ).toBe("pokemon");
  });

  it("lets the user apply unique abilities from a pool generated before Pokémon", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      pokemonCount: 3,
      randomizerOrder: ["ability", "pokemon", "move", "item"],
    });
    const withPool = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 5,
      abilities: [
        makeAbility("intimidate"),
        makeAbility("levitate"),
        makeAbility("torrent"),
        makeAbility("protean"),
        makeAbility("moxie"),
      ],
    });
    expect(withPool.abilityOptions).toHaveLength(5);
    expect(withPool.draft.abilityId).toBeUndefined();

    const rolled = applyPokemonRoll(withPool, {
      seed: "pokemon-seed",
      poolSize: 3,
      pokemon: [makeForm("a"), makeForm("b"), makeForm("c")],
    });

    expect(rolled.pokemonRolls[0]?.appliedAbilityIds).toBeUndefined();
    expect(selectRolledPokemon(rolled, "b")).toBe(rolled);

    const assignedB = applyAbilityToRolledPokemon(rolled, "b", "protean");
    expect(assignedB.pokemonRolls[0]?.appliedAbilityIds?.[1]).toBe("protean");
    expect(abilityChoicesForPokemon(assignedB, "a")).not.toContain("protean");
    expect(unassignedAbilityIds(assignedB)).toEqual([
      "intimidate",
      "levitate",
      "torrent",
      "moxie",
    ]);

    const selected = selectRolledPokemon(assignedB, "b");
    expect(selected.draft.abilityId).toBe("protean");

    const moved = applyAbilityToRolledPokemon(selected, "a", "protean");
    expect(moved.selectedPokemonId).toBeUndefined();
    expect(moved.draft.abilityId).toBeUndefined();
    expect(moved.pokemonRolls[0]?.appliedAbilityIds?.[0]).toBe("protean");
    expect(moved.pokemonRolls[0]?.appliedAbilityIds?.[1]).toBeUndefined();
  });

  it("keeps a pre-Pokémon ability assignment when the pick evolves", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      pokemonCount: 2,
      randomizerOrder: ["ability", "pokemon", "move", "item"],
    });
    const withPool = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 2,
      abilities: [makeAbility("blaze"), makeAbility("solar-power")],
    });
    const rolled = applyPokemonRoll(withPool, {
      seed: "evo-seed",
      poolSize: 2,
      pokemon: [charmander, makeForm("mewtwo")],
    });
    const assigned = applyAbilityToRolledPokemon(rolled, "charmander", "blaze");
    const selected = selectRolledPokemon(assigned, "charmander");
    expect(selected.draft.abilityId).toBe("blaze");

    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    expect(evolved.abilityOptions).toEqual(withPool.abilityOptions);
    expect(evolved.draft.abilityId).toBe("blaze");
  });

  it("does not auto-assign when there are fewer abilities than Pokémon", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      pokemonCount: 3,
      randomizerOrder: ["ability", "pokemon", "move", "item"],
    });
    const withPool = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 2,
      abilities: [makeAbility("intimidate"), makeAbility("levitate")],
    });

    const rolled = applyPokemonRoll(withPool, {
      seed: "too-many-pokemon",
      poolSize: 3,
      pokemon: [makeForm("a"), makeForm("b"), makeForm("c")],
    });
    expect(rolled.pokemonRolls[0]?.pokemonIds).toEqual(["a", "b", "c"]);
    expect(rolled.pokemonRolls[0]?.appliedAbilityIds).toBeUndefined();
  });

  it("keeps the ability pool when clearing Pokémon rolls if Ability ran first", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizerOrder: ["ability", "pokemon", "move", "item"],
    });
    const withPool = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 3,
      abilities: [makeAbility("a"), makeAbility("b"), makeAbility("c")],
    });
    const rolled = applyPokemonRoll(withPool, {
      seed: "abc",
      poolSize: 2,
      pokemon: [makeForm("x"), makeForm("y")],
    });
    const cleared = clearPokemonRolls(rolled);

    expect(cleared.pokemonRolls).toEqual([]);
    expect(cleared.abilityOptions).toEqual(["a", "b", "c"]);
    expect(cleared.draft.abilityId).toBeUndefined();
    expect(cleared.tab).toBe("pokemon");
  });

  it("stores a move roll only for the current battle Pokémon", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const selected = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [charmander, makeForm("mewtwo")],
      }),
      "charmander",
    );
    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    const result = moveResult(["earthquake", "thunderbolt", "swordsdance", "flamethrower"]);

    expect(applyMoveRoll(evolved, result, "charmander")).toBe(evolved);

    const rolled = applyMoveRoll(evolved, result, "charizard");
    expect(rolled.moveOptions).toEqual([
      "earthquake",
      "thunderbolt",
      "swordsdance",
      "flamethrower",
    ]);

    const picked = selectRolledMove(rolled, "earthquake");
    expect(picked.draft.moveIds[0]).toBe("earthquake");
    expect(selectRolledMove(rolled, "missing")).toBe(rolled);

    const four = ["earthquake", "thunderbolt", "swordsdance", "flamethrower"].reduce(
      (session, id) => selectRolledMove(session, id),
      rolled,
    );
    expect(four.draft.moveIds).toEqual([
      "earthquake",
      "thunderbolt",
      "swordsdance",
      "flamethrower",
    ]);
    expect(selectRolledMove(four, "surf")).toBe(four);

    const toggled = selectRolledMove(four, "thunderbolt");
    expect(toggled.draft.moveIds).toEqual(["earthquake", undefined, "swordsdance", "flamethrower"]);
  });

  it("clears moves when the battle Pokémon changes after Pokémon", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const selected = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [charmander, makeForm("mewtwo")],
      }),
      "charmander",
    );
    const withMoves = selectRolledMove(
      applyMoveRoll(
        selected,
        moveResult(["earthquake", "thunderbolt", "swordsdance", "flamethrower"]),
        "charmander",
      ),
      "earthquake",
    );

    const evolved = chooseEvolvedPokemon(withMoves, charmander, "charizard");
    expect(evolved.moveOptions).toEqual([]);
    expect(evolved.draft.moveIds).toEqual([undefined, undefined, undefined, undefined]);

    const switched = selectRolledPokemon(withMoves, "mewtwo");
    expect(switched.moveOptions).toEqual([]);
    expect(switched.draft.moveIds).toEqual([undefined, undefined, undefined, undefined]);
  });

  it("lets the user apply a chosen number of unique moves from a pool generated before Pokémon", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
      pokemonCount: 3,
      movesPerPokemon: 2,
      randomizerOrder: ["move", "pokemon", "ability", "item"],
    });
    const withPool = applyMoveRoll(
      before,
      moveResult(["earthquake", "thunderbolt", "swordsdance", "flamethrower", "surf", "icebeam"]),
    );
    expect(withPool.moveOptions).toHaveLength(6);
    expect(withPool.draft.moveIds).toEqual([undefined, undefined, undefined, undefined]);

    const rolled = applyPokemonRoll(withPool, {
      seed: "pokemon-seed",
      poolSize: 3,
      pokemon: [makeForm("a"), makeForm("b"), makeForm("c")],
    });

    expect(rolled.pokemonRolls[0]?.appliedMoveIds).toBeUndefined();
    expect(selectRolledPokemon(rolled, "b")).toBe(rolled);

    const assignedB = applyMoveToRolledPokemon(rolled, "b", 0, "earthquake");
    expect(assignedB.pokemonRolls[0]?.appliedMoveIds?.[1]?.[0]).toBe("earthquake");
    expect(moveChoicesForPokemon(assignedB, "a", 0)).not.toContain("earthquake");
    expect(unassignedMoveIds(assignedB)).toEqual([
      "thunderbolt",
      "swordsdance",
      "flamethrower",
      "surf",
      "icebeam",
    ]);
    expect(selectRolledPokemon(assignedB, "b")).toBe(assignedB);
    expect(applyMoveToRolledPokemon(assignedB, "b", 2, "surf")).toBe(assignedB);

    const partial = applyMoveToRolledPokemon(assignedB, "b", 1, "surf");
    const selected = selectRolledPokemon(partial, "b");
    expect(selected.selectedPokemonId).toBe("b");
    expect(selected.draft.moveIds).toEqual(["earthquake", "surf", undefined, undefined]);

    const stolen = applyMoveToRolledPokemon(selected, "a", 0, "earthquake");
    expect(stolen.selectedPokemonId).toBeUndefined();
    expect(stolen.draft.moveIds).toEqual([undefined, undefined, undefined, undefined]);
    expect(stolen.pokemonRolls[0]?.appliedMoveIds?.[0]?.[0]).toBe("earthquake");
    expect(stolen.pokemonRolls[0]?.appliedMoveIds?.[1]?.[0]).toBeUndefined();
    expect(stolen.pokemonRolls[0]?.appliedMoveIds?.[1]?.[1]).toBe("surf");
  });

  it("requires a full four-move apply before select when movesPerPokemon is 4", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
      pokemonCount: 2,
      randomizerOrder: ["move", "pokemon", "ability", "item"],
    });
    const withPool = applyMoveRoll(
      before,
      moveResult(["earthquake", "thunderbolt", "swordsdance", "flamethrower", "surf"]),
    );
    const rolled = applyPokemonRoll(withPool, {
      seed: "full-set",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const withThree = ["earthquake", "thunderbolt", "swordsdance"].reduce(
      (session, id, slotIndex) => applyMoveToRolledPokemon(session, "a", slotIndex, id),
      rolled,
    );
    expect(selectRolledPokemon(withThree, "a")).toBe(withThree);

    const withFour = applyMoveToRolledPokemon(withThree, "a", 3, "flamethrower");
    const selected = selectRolledPokemon(withFour, "a");
    expect(selected.selectedPokemonId).toBe("a");
    expect(selected.draft.moveIds).toEqual([
      "earthquake",
      "thunderbolt",
      "swordsdance",
      "flamethrower",
    ]);
  });

  it("trims extra applied moves when movesPerPokemon is lowered", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
      pokemonCount: 2,
      movesPerPokemon: 3,
      randomizerOrder: ["move", "pokemon", "ability", "item"],
    });
    const withPool = applyMoveRoll(
      before,
      moveResult(["earthquake", "thunderbolt", "swordsdance", "flamethrower"]),
    );
    const rolled = applyPokemonRoll(withPool, {
      seed: "trim-slots",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const filled = ["earthquake", "thunderbolt", "swordsdance"].reduce(
      (session, id, slotIndex) => applyMoveToRolledPokemon(session, "a", slotIndex, id),
      rolled,
    );
    const selected = selectRolledPokemon(filled, "a");
    expect(selected.draft.moveIds).toEqual([
      "earthquake",
      "thunderbolt",
      "swordsdance",
      undefined,
    ]);

    const lowered = applySessionConfig(selected, {
      ...selected.config,
      movesPerPokemon: 2,
    });
    expect(lowered.selectedPokemonId).toBe("a");
    expect(lowered.draft.moveIds).toEqual(["earthquake", "thunderbolt", undefined, undefined]);
    expect(lowered.pokemonRolls[0]?.appliedMoveIds?.[0]).toEqual([
      "earthquake",
      "thunderbolt",
      undefined,
      undefined,
    ]);

    const raised = applySessionConfig(lowered, {
      ...lowered.config,
      movesPerPokemon: 4,
    });
    expect(raised.selectedPokemonId).toBeUndefined();
    expect(raised.pokemonRolls[0]?.appliedMoveIds?.[0]).toEqual([
      "earthquake",
      "thunderbolt",
      undefined,
      undefined,
    ]);
  });

  it("keeps a pre-Pokémon move assignment when the pick evolves", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
      pokemonCount: 2,
      movesPerPokemon: 2,
      randomizerOrder: ["move", "pokemon", "ability", "item"],
    });
    const withPool = applyMoveRoll(before, moveResult(["ember", "flamethrower", "scratch", "growl"]));
    const rolled = applyPokemonRoll(withPool, {
      seed: "evo-seed",
      poolSize: 2,
      pokemon: [charmander, makeForm("mewtwo")],
    });
    const assigned = applyMoveToRolledPokemon(rolled, "charmander", 0, "ember");
    const withSecond = applyMoveToRolledPokemon(assigned, "charmander", 1, "scratch");
    const selected = selectRolledPokemon(withSecond, "charmander");
    expect(selected.draft.moveIds).toEqual(["ember", "scratch", undefined, undefined]);

    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    expect(evolved.moveOptions).toEqual(withPool.moveOptions);
    expect(evolved.draft.moveIds).toEqual(["ember", "scratch", undefined, undefined]);
  });

  it("does not auto-assign moves when generating Pokémon", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
      pokemonCount: 3,
      randomizerOrder: ["move", "pokemon", "ability", "item"],
    });
    const withPool = applyMoveRoll(before, moveResult(["earthquake", "thunderbolt"]));
    const rolled = applyPokemonRoll(withPool, {
      seed: "too-many-pokemon",
      poolSize: 3,
      pokemon: [makeForm("a"), makeForm("b"), makeForm("c")],
    });
    expect(rolled.pokemonRolls[0]?.pokemonIds).toEqual(["a", "b", "c"]);
    expect(rolled.pokemonRolls[0]?.appliedMoveIds).toBeUndefined();
  });

  it("keeps the move pool when clearing Pokémon rolls if Move ran first", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeMoves: true,
      randomizerOrder: ["move", "pokemon", "ability", "item"],
    });
    const withPool = applyMoveRoll(before, moveResult(["a", "b", "c", "d"]));
    const rolled = applyPokemonRoll(withPool, {
      seed: "abc",
      poolSize: 2,
      pokemon: [makeForm("x"), makeForm("y")],
    });
    const assigned = applyMoveToRolledPokemon(rolled, "x", 0, "a");
    const cleared = clearPokemonRolls(assigned);

    expect(cleared.pokemonRolls).toEqual([]);
    expect(cleared.moveOptions).toEqual(["a", "b", "c", "d"]);
    expect(cleared.draft.moveIds).toEqual([undefined, undefined, undefined, undefined]);
    expect(cleared.tab).toBe("pokemon");
  });

  it("still requires an applied ability when Ability and Move both run first", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizeMoves: true,
      pokemonCount: 2,
      movesPerPokemon: 1,
      randomizerOrder: ["ability", "move", "pokemon", "item"],
    });
    const withAbilities = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 2,
      abilities: [makeAbility("blaze"), makeAbility("torrent")],
    });
    const withMoves = applyMoveRoll(withAbilities, moveResult(["ember", "watergun", "scratch", "growl"]));
    const rolled = applyPokemonRoll(withMoves, {
      seed: "both-first",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const withPartialMoves = applyMoveToRolledPokemon(rolled, "a", 0, "ember");

    expect(selectRolledPokemon(withPartialMoves, "a")).toBe(withPartialMoves);

    const withAbility = applyAbilityToRolledPokemon(withPartialMoves, "a", "blaze");
    const selected = selectRolledPokemon(withAbility, "a");
    expect(selected.draft.abilityId).toBe("blaze");
    expect(selected.draft.moveIds[0]).toBe("ember");
    expect(selected.draft.moveIds[1]).toBeUndefined();
  });

  it("stores an item roll only for the current battle Pokémon", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const selected = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [charmander, makeForm("mewtwo")],
      }),
      "charmander",
    );
    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    const result = itemResult(["leftovers", "lifeorb", "choiceband"]);

    expect(applyItemRoll(evolved, result, "charmander")).toBe(evolved);

    const rolled = applyItemRoll(evolved, result, "charizard");
    expect(rolled.itemOptions).toEqual(["leftovers", "lifeorb", "choiceband"]);
    expect(selectRolledItem(rolled, "lifeorb").draft.itemId).toBe("lifeorb");
    expect(selectRolledItem(rolled, "missing")).toBe(rolled);
    expect(selectRolledItem(rolled, NONE_ITEM_ID).draft.itemId).toBe(NONE_ITEM_ID);
  });

  it("clears items when the battle Pokémon changes and keeps them when it does not", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const selected = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 2,
        pokemon: [charmander, makeForm("mewtwo")],
      }),
      "charmander",
    );
    const withItems = selectRolledItem(
      applyItemRoll(selected, itemResult(["leftovers", "lifeorb"]), "charmander"),
      "leftovers",
    );

    const rerolledSame = applyPokemonRoll(withItems, {
      seed: "def",
      poolSize: 2,
      pokemon: [makeForm("squirtle"), makeForm("bulbasaur")],
    });
    expect(rerolledSame.selectedPokemonId).toBe("charmander");
    expect(rerolledSame.itemOptions).toEqual(["leftovers", "lifeorb"]);
    expect(rerolledSame.draft.itemId).toBe("leftovers");

    const evolved = chooseEvolvedPokemon(withItems, charmander, "charizard");
    expect(evolved.itemOptions).toEqual([]);
    expect(evolved.draft.itemId).toBeUndefined();

    const switched = selectRolledPokemon(withItems, "mewtwo");
    expect(switched.itemOptions).toEqual([]);
    expect(switched.draft.itemId).toBeUndefined();

    const cleared = clearPokemonRolls(withItems);
    expect(cleared.itemOptions).toEqual([]);
    expect(cleared.draft.itemId).toBeUndefined();
    expect(cleared.tab).toBe("pokemon");
  });

  it("lets the user apply unique items from a pool generated before Pokémon", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
      pokemonCount: 3,
      randomizerOrder: ["item", "pokemon", "ability", "move"],
    });
    const withPool = applyItemRoll(before, itemResult(["leftovers", "lifeorb", "choiceband", "sitrusberry"]));
    expect(withPool.itemOptions).toHaveLength(4);
    expect(withPool.draft.itemId).toBeUndefined();

    const rolled = applyPokemonRoll(withPool, {
      seed: "pokemon-seed",
      poolSize: 3,
      pokemon: [makeForm("a"), makeForm("b"), makeForm("c")],
    });

    expect(rolled.pokemonRolls[0]?.appliedItemIds).toBeUndefined();
    expect(selectRolledPokemon(rolled, "b")).toBe(rolled);

    const assignedB = applyItemToRolledPokemon(rolled, "b", "choiceband");
    expect(assignedB.pokemonRolls[0]?.appliedItemIds?.[1]).toBe("choiceband");
    expect(itemChoicesForPokemon(assignedB, "a")).not.toContain("choiceband");
    expect(unassignedItemIds(assignedB)).toEqual(["leftovers", "lifeorb", "sitrusberry"]);

    const selected = selectRolledPokemon(assignedB, "b");
    expect(selected.draft.itemId).toBe("choiceband");

    const moved = applyItemToRolledPokemon(selected, "a", "choiceband");
    expect(moved.selectedPokemonId).toBeUndefined();
    expect(moved.draft.itemId).toBeUndefined();
    expect(moved.pokemonRolls[0]?.appliedItemIds?.[0]).toBe("choiceband");
    expect(moved.pokemonRolls[0]?.appliedItemIds?.[1]).toBeUndefined();

    const withNone = applyItemToRolledPokemon(rolled, "c", NONE_ITEM_ID);
    expect(withNone.pokemonRolls[0]?.appliedItemIds?.[2]).toBe(NONE_ITEM_ID);
    expect(selectRolledPokemon(withNone, "c").draft.itemId).toBe(NONE_ITEM_ID);
    expect(unassignedItemIds(withNone)).toEqual(["leftovers", "lifeorb", "choiceband", "sitrusberry"]);
  });

  it("keeps a pre-Pokémon item assignment when the pick evolves", () => {
    const charmander = { ...makeForm("charmander"), evolutionTargetIds: ["charizard"] };
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
      pokemonCount: 2,
      randomizerOrder: ["item", "pokemon", "ability", "move"],
    });
    const withPool = applyItemRoll(before, itemResult(["leftovers", "lifeorb"]));
    const rolled = applyPokemonRoll(withPool, {
      seed: "evo-seed",
      poolSize: 2,
      pokemon: [charmander, makeForm("mewtwo")],
    });
    const assigned = applyItemToRolledPokemon(rolled, "charmander", "leftovers");
    const selected = selectRolledPokemon(assigned, "charmander");
    expect(selected.draft.itemId).toBe("leftovers");

    const evolved = chooseEvolvedPokemon(selected, charmander, "charizard");
    expect(evolved.itemOptions).toEqual(withPool.itemOptions);
    expect(evolved.draft.itemId).toBe("leftovers");
  });

  it("does not auto-assign items when generating Pokémon", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
      pokemonCount: 3,
      randomizerOrder: ["item", "pokemon", "ability", "move"],
    });
    const withPool = applyItemRoll(before, itemResult(["leftovers", "lifeorb"]));
    const rolled = applyPokemonRoll(withPool, {
      seed: "too-many-pokemon",
      poolSize: 3,
      pokemon: [makeForm("a"), makeForm("b"), makeForm("c")],
    });
    expect(rolled.pokemonRolls[0]?.pokemonIds).toEqual(["a", "b", "c"]);
    expect(rolled.pokemonRolls[0]?.appliedItemIds).toBeUndefined();
  });

  it("keeps the item pool when clearing Pokémon rolls if Item ran first", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
      randomizerOrder: ["item", "pokemon", "ability", "move"],
    });
    const withPool = applyItemRoll(before, itemResult(["a", "b", "c"]));
    const rolled = applyPokemonRoll(withPool, {
      seed: "abc",
      poolSize: 2,
      pokemon: [makeForm("x"), makeForm("y")],
    });
    const assigned = applyItemToRolledPokemon(rolled, "x", "a");
    const cleared = clearPokemonRolls(assigned);

    expect(cleared.pokemonRolls).toEqual([]);
    expect(cleared.itemOptions).toEqual(["a", "b", "c"]);
    expect(cleared.draft.itemId).toBeUndefined();
    expect(cleared.tab).toBe("pokemon");
  });

  it("still requires an applied item when Ability, Move, and Item all run first", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizeMoves: true,
      randomizeItems: true,
      pokemonCount: 2,
      movesPerPokemon: 1,
      randomizerOrder: ["ability", "move", "item", "pokemon"],
    });
    const withAbilities = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 2,
      abilities: [makeAbility("blaze"), makeAbility("torrent")],
    });
    const withMoves = applyMoveRoll(withAbilities, moveResult(["ember", "watergun", "scratch", "growl"]));
    const withItems = applyItemRoll(withMoves, itemResult(["leftovers", "lifeorb"]));
    const rolled = applyPokemonRoll(withItems, {
      seed: "all-first",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const withPartial = applyAbilityToRolledPokemon(rolled, "a", "blaze");
    const withPartialMoves = applyMoveToRolledPokemon(withPartial, "a", 0, "ember");

    expect(selectRolledPokemon(withPartialMoves, "a")).toBe(withPartialMoves);

    const withItem = applyItemToRolledPokemon(withPartialMoves, "a", "leftovers");
    const selected = selectRolledPokemon(withItem, "a");
    expect(selected.draft.abilityId).toBe("blaze");
    expect(selected.draft.moveIds[0]).toBe("ember");
    expect(selected.draft.itemId).toBe("leftovers");
  });

  it("replaces one Pokémon in the viewed generation without adding history", () => {
    const rolled = selectRolledPokemon(
      applyPokemonRoll(createInitialSession(), {
        seed: "abc",
        poolSize: 3,
        pokemon: [makeForm("a"), makeForm("b"), makeForm("c")],
      }),
      "a",
    );

    const replaced = replaceRolledPokemon(rolled, "a", "d");

    expect(replaced.pokemonRolls).toHaveLength(1);
    expect(replaced.pokemonRolls[0]?.pokemonIds).toEqual(["d", "b", "c"]);
    expect(replaced.resultPokemonIds).toEqual(["d", "b", "c"]);
    expect(replaced.selectedPokemonId).toBe("d");
    expect(replaced.evolvedPokemonId).toBe("d");
    expect(replaced.draft.pokemonId).toBe("d");
    expect(replaceRolledPokemon(rolled, "a", "b")).toBe(rolled);
  });

  it("keeps the latest result ids when re-rolling an older generation", () => {
    const first = applyPokemonRoll(createInitialSession(), {
      seed: "one",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const second = applyPokemonRoll(first, {
      seed: "two",
      poolSize: 2,
      pokemon: [makeForm("c"), makeForm("d")],
    });
    const viewingFirst = showPreviousPokemonRoll(second);
    const replaced = replaceRolledPokemon(viewingFirst, "a", "z");

    expect(replaced.resultPokemonIds).toEqual(["c", "d"]);
    expect(replaced.pokemonRolls[0]?.pokemonIds).toEqual(["c", "d"]);
    expect(replaced.pokemonRolls[1]?.pokemonIds).toEqual(["z", "b"]);
    expect(replaced.selectedPokemonId).toBeUndefined();
  });

  it("clears extras rolled after Pokémon when the selected pick is replaced", () => {
    const selected = selectRolledPokemon(
      applyPokemonRoll(
        createInitialSession({ ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true }),
        {
          seed: "abc",
          poolSize: 2,
          pokemon: [makeForm("a"), makeForm("b")],
        },
      ),
      "a",
    );
    const withAbilities = applyAbilityRoll(
      selected,
      {
        seed: "ability-seed",
        poolSize: 1,
        abilities: [makeAbility("blaze")],
      },
      "a",
    );
    const replaced = replaceRolledPokemon(withAbilities, "a", "c");

    expect(replaced.selectedPokemonId).toBe("c");
    expect(replaced.abilityOptions).toEqual([]);
    expect(replaced.draft.abilityId).toBeUndefined();
  });

  it("keeps extras applied before Pokémon on the same slot after a re-roll", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizerOrder: ["ability", "pokemon", "move", "item"],
    });
    const withPool = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 2,
      abilities: [makeAbility("blaze"), makeAbility("torrent")],
    });
    const rolled = applyPokemonRoll(withPool, {
      seed: "pokemon-seed",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const assigned = applyAbilityToRolledPokemon(rolled, "a", "blaze");
    const selected = selectRolledPokemon(assigned, "a");
    const replaced = replaceRolledPokemon(selected, "a", "c");

    expect(replaced.pokemonRolls[0]?.appliedAbilityIds?.[0]).toBe("blaze");
    expect(replaced.selectedPokemonId).toBe("c");
    expect(replaced.draft.abilityId).toBe("blaze");
    expect(replaced.abilityOptions).toEqual(["blaze", "torrent"]);
  });

  it("remaps a re-rolled ability, move, and item onto options, applied slots, and the draft", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizeMoves: true,
      randomizeItems: true,
      movesPerPokemon: 1,
      randomizerOrder: ["ability", "move", "item", "pokemon"],
    });
    const withAbilities = applyAbilityRoll(before, {
      seed: "ability-pool",
      poolSize: 2,
      abilities: [makeAbility("blaze"), makeAbility("torrent")],
    });
    const withMoves = applyMoveRoll(withAbilities, moveResult(["ember", "scratch", "growl", "tackle"]));
    const withItems = applyItemRoll(withMoves, itemResult(["leftovers", "lifeorb"]));
    const rolled = applyPokemonRoll(withItems, {
      seed: "all-first",
      poolSize: 2,
      pokemon: [makeForm("a"), makeForm("b")],
    });
    const assigned = applyItemToRolledPokemon(
      applyMoveToRolledPokemon(
        applyAbilityToRolledPokemon(rolled, "a", "blaze"),
        "a",
        0,
        "ember",
      ),
      "a",
      "leftovers",
    );
    const selected = selectRolledPokemon(assigned, "a");

    const nextAbility = replaceRolledAbility(selected, "blaze", "flashfire");
    expect(nextAbility.abilityOptions).toEqual(["flashfire", "torrent"]);
    expect(nextAbility.pokemonRolls[0]?.appliedAbilityIds?.[0]).toBe("flashfire");
    expect(nextAbility.draft.abilityId).toBe("flashfire");

    const nextMove = replaceRolledMove(nextAbility, "ember", "watergun");
    expect(nextMove.moveOptions).toEqual(["watergun", "scratch", "growl", "tackle"]);
    expect(nextMove.pokemonRolls[0]?.appliedMoveIds?.[0]?.[0]).toBe("watergun");
    expect(nextMove.draft.moveIds[0]).toBe("watergun");

    const nextItem = replaceRolledItem(nextMove, "leftovers", "choiceband");
    expect(nextItem.itemOptions).toEqual(["choiceband", "lifeorb"]);
    expect(nextItem.pokemonRolls[0]?.appliedItemIds?.[0]).toBe("choiceband");
    expect(nextItem.draft.itemId).toBe("choiceband");
    expect(replaceRolledAbility(selected, "blaze", "torrent")).toBe(selected);
  });
});
