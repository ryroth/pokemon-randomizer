import { describe, expect, it } from "vitest";
import {
  finalizeBuilderSet,
  openBuilder,
  setDraftAbility,
  setDraftEv,
  setDraftItem,
  setDraftMove,
  setDraftShiny,
} from "@/lib/builder";
import { moveSlotLockedByRandomizer, pendingRandomizerSteps, recapEditAccess } from "@/lib/builder/locks";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { rollGender } from "@/lib/randomizer/gender";
import { createInitialSession } from "@/lib/randomizer/session";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { RandomizerSession } from "@/lib/types/session";
import { EMPTY_EVS } from "@/lib/types/stats";
import { defaultTeraType } from "@/lib/validation/set";

function makeForm(overrides: Partial<PokemonForm> = {}): PokemonForm {
  return {
    id: "mudkip",
    pokeApiId: 258,
    pokeApiSlug: "mudkip",
    name: "mudkip",
    displayName: "Mudkip",
    showdownName: "Mudkip",
    nationalDexNumber: 258,
    generation: 3,
    types: ["ground", "water"],
    abilityIds: ["torrent"],
    speciesId: "mudkip",
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
    sprites: { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null },
    baseStats: EMPTY_EVS,
    genderRule: "mixed",
    evolutionTargetIds: [],
    ...overrides,
  };
}

/** A session that has everything except Tera type, gender, and all but one move. */
function sessionWithOneMove(): RandomizerSession {
  let session = openBuilder({
    ...createInitialSession(),
    selectedPokemonId: "mudkip",
    evolvedPokemonId: "mudkip",
  });
  session = setDraftAbility(session, "torrent", ["torrent"]);
  session = setDraftMove(session, 0, "protect", ["protect", "lastresort"]);
  session = setDraftItem(session, null, [null]);
  for (const stat of ["hp", "atk", "def", "spa", "spd", "spe"] as const) {
    session = setDraftEv(session, stat, 0);
  }
  session = { ...session, draft: { ...session.draft, natureId: "hardy" } };
  return setDraftShiny(session, false);
}

describe("finishing a set with blank fields", () => {
  it("accepts a single move, such as Protect on its own", () => {
    const finalized = finalizeBuilderSet(sessionWithOneMove(), makeForm());
    expect(finalized.step).toBe("recap");
    expect(finalized.finalizedSet?.moveIds).toEqual(["protect"]);
  });

  it("still needs at least one move", () => {
    const session = setDraftMove(sessionWithOneMove(), 0, undefined, ["protect"]);
    expect(finalizeBuilderSet(session, makeForm()).finalizedSet).toBeUndefined();
  });

  it("uses the primary type when Tera type is blank", () => {
    const finalized = finalizeBuilderSet(sessionWithOneMove(), makeForm());
    expect(finalized.finalizedSet?.teraType).toBe("ground");
    expect(defaultTeraType(makeForm({ types: ["fire"] }))).toBe("fire");
  });

  it("keeps a Tera type the user chose", () => {
    const session = sessionWithOneMove();
    const finalized = finalizeBuilderSet(
      { ...session, draft: { ...session.draft, teraType: "water" } },
      makeForm(),
    );
    expect(finalized.finalizedSet?.teraType).toBe("water");
  });

  it("rolls a gender for a species with both genders when it is blank, the same way for the same seed", () => {
    const first = finalizeBuilderSet(sessionWithOneMove(), makeForm(), "seed-a");
    const second = finalizeBuilderSet(sessionWithOneMove(), makeForm(), "seed-a");
    expect(["M", "F"]).toContain(first.finalizedSet?.gender);
    expect(first.finalizedSet?.gender).toBe(rollGender("seed-a"));
    expect(second.finalizedSet?.gender).toBe(first.finalizedSet?.gender);
  });

  it("remembers the rolled gender so finishing again does not change it", () => {
    const first = finalizeBuilderSet(sessionWithOneMove(), makeForm(), "seed-a");
    const again = finalizeBuilderSet({ ...first, finalizedSet: undefined }, makeForm(), "different-seed");
    expect(again.finalizedSet?.gender).toBe(first.finalizedSet?.gender);
  });

  it("keeps a gender the user chose", () => {
    const session = sessionWithOneMove();
    const finalized = finalizeBuilderSet({ ...session, draft: { ...session.draft, gender: "F" } }, makeForm(), "seed-a");
    expect(finalized.finalizedSet?.gender).toBe("F");
  });

  it("leaves gender empty for a genderless species", () => {
    const finalized = finalizeBuilderSet(sessionWithOneMove(), makeForm({ genderRule: "genderless" }));
    expect(finalized.finalizedSet?.gender ?? null).toBeNull();
  });

  it("rolls both genders across many seeds", () => {
    const rolled = new Set(Array.from({ length: 40 }, (_, index) => rollGender(`seed-${index}`)));
    expect(rolled).toEqual(new Set(["M", "F"]));
  });
});

describe("pendingRandomizerSteps", () => {
  const randomizeAll = {
    ...DEFAULT_RANDOMIZER_CONFIG,
    randomizeAbilities: true,
    randomizeMoves: true,
    randomizeItems: true,
  };

  it("lists nothing when no extra randomizer is on", () => {
    expect(pendingRandomizerSteps(createInitialSession())).toEqual([]);
  });

  it("lists every enabled randomizer that has not given this Pokémon its part yet", () => {
    const pending = pendingRandomizerSteps(createInitialSession(randomizeAll));
    expect(pending).toEqual(expect.arrayContaining(["ability", "move", "item"]));
    expect(pending).not.toContain("pokemon");
  });

  it("drops a step once its randomizer has applied", () => {
    const base = createInitialSession(randomizeAll);
    const session: RandomizerSession = {
      ...base,
      draft: { ...base.draft, abilityId: "torrent", itemId: null },
    };
    const pending = pendingRandomizerSteps(session);
    expect(pending).toContain("move");
    expect(pending).not.toContain("ability");
    expect(pending).not.toContain("item");
  });
});

describe("move locks and Recap edit access", () => {
  const moveFirst = {
    ...DEFAULT_RANDOMIZER_CONFIG,
    randomizeMoves: true,
    movesPerPokemon: 1,
    randomizerOrder: ["move", "pokemon", "ability", "item"] as typeof DEFAULT_RANDOMIZER_CONFIG.randomizerOrder,
  };

  function sessionWithAppliedAndHandPicked(): RandomizerSession {
    const base = createInitialSession(moveFirst);
    return {
      ...base,
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
      pokemonRolls: [
        {
          seed: "seed",
          pokemonIds: ["mudkip"],
          appliedMoveIds: [["behemothblade", undefined, undefined, undefined]],
        },
      ],
      draft: {
        ...base.draft,
        pokemonId: "mudkip",
        abilityId: "torrent",
        itemId: null,
        moveIds: ["behemothblade", "burnup", undefined, "eruption"],
      },
    };
  }

  it("locks only the move the randomizer applied, not the ones added by hand", () => {
    const session = sessionWithAppliedAndHandPicked();
    expect(moveSlotLockedByRandomizer(session, 0)).toBe(true);
    expect(moveSlotLockedByRandomizer(session, 1)).toBe(false);
    expect(moveSlotLockedByRandomizer(session, 2)).toBe(false);
    expect(moveSlotLockedByRandomizer(session, 3)).toBe(false);
  });

  it("lets the Recap edit hand-picked moves, and maps each to its Builder slot", () => {
    const access = recapEditAccess(sessionWithAppliedAndHandPicked());
    // Three moves in the set: slot 1 locked, then slots 2 and 4 open.
    expect(access.moves).toEqual([null, 1, 3]);
    expect(access.ability).toBe(true);
    expect(access.item).toBe(true);
  });

  it("locks every filled move when the move randomizer ran after Pokémon", () => {
    const base = createInitialSession({ ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true });
    const session: RandomizerSession = {
      ...base,
      draft: { ...base.draft, moveIds: ["a", "b", "c", "d"] },
    };
    expect(recapEditAccess(session).moves).toEqual([null, null, null, null]);
  });

  it("locks the ability and item the randomizers chose, in the Recap too", () => {
    const base = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeAbilities: true,
      randomizeItems: true,
    });
    const session: RandomizerSession = {
      ...base,
      draft: { ...base.draft, abilityId: "torrent", itemId: "leftovers" },
    };
    expect(recapEditAccess(session)).toMatchObject({ ability: false, item: false });
    expect(recapEditAccess(createInitialSession())).toMatchObject({ ability: true, item: true });
  });
});
