import { describe, expect, it } from "vitest";
import {
  applyBuilderDefaults,
  applySuggestedEvs,
  builderItemPool,
  builderMovePool,
  finalizeBuilderSet,
  openBuilder,
  setDraftAbility,
  setDraftEv,
  setDraftGender,
  setDraftItem,
  setDraftMove,
  setDraftNickname,
  setDraftShiny,
} from "@/lib/builder";
import type { Nature } from "@/lib/types/catalog-entities";
import { natureChoiceLabel } from "@/lib/builder/labels";
import { applyPokemonRoll, createInitialSession, selectRolledPokemon } from "@/lib/randomizer/session";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { parseStoredSession } from "@/lib/session/storage";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS, PERFECT_IVS } from "@/lib/types/stats";

const TIMID: Nature = {
  id: "timid",
  pokeApiSlug: "timid",
  name: "Timid",
  showdownName: "Timid",
  plusStat: "spe",
  minusStat: "atk",
};

const HARDY: Nature = {
  id: "hardy",
  pokeApiSlug: "hardy",
  name: "Hardy",
  showdownName: "Hardy",
  plusStat: null,
  minusStat: null,
};

function makeForm(id: string, genderRule: PokemonForm["genderRule"] = "mixed"): PokemonForm {
  return {
    id,
    pokeApiId: 1,
    pokeApiSlug: id,
    name: id,
    displayName: id,
    showdownName: id,
    nationalDexNumber: 1,
    generation: 1,
    types: ["water"],
    abilityIds: ["torrent", "damp"],
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
    sprites: { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null },
    baseStats: EMPTY_EVS,
    genderRule,
    evolutionTargetIds: [],
  };
}

describe("builder pools", () => {
  it("keeps applied randomizer moves and fills empty slots from the standard list", () => {
    const session = openBuilder({
      ...createInitialSession({ ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true }),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
      moveOptions: ["tackle", "growl", "ember"],
      draft: {
        ...createInitialSession().draft,
        pokemonId: "mudkip",
        moveIds: ["tackle", "growl", undefined, undefined],
      },
    });
    expect(session.draft.moveIds).toEqual(["tackle", "growl", undefined, undefined]);
    expect(builderMovePool(session, [{ id: "ember" }, { id: "watergun" }])).toEqual(["ember", "watergun"]);
  });

  it("uses the standard catalog when moves were not randomized", () => {
    const session = createInitialSession();
    expect(builderMovePool(session, [{ id: "tackle" }, { id: "hiddenpower" }, { id: "hiddenpower" }])).toEqual([
      "tackle",
      "hiddenpower",
    ]);
  });

  it("limits the catalog list to the Pokémon's learnset", () => {
    const session = createInitialSession();
    expect(
      builderMovePool(session, [{ id: "tackle" }, { id: "flamethrower" }, { id: "growl" }], {
        list: "learnset",
        learnsetIds: ["tackle", "growl"],
      }),
    ).toEqual(["tackle", "growl"]);
  });

  it("offers None plus rolled items, or None plus the catalog", () => {
    const rolled = {
      ...createInitialSession({ ...DEFAULT_RANDOMIZER_CONFIG, randomizeItems: true }),
      itemOptions: ["leftovers"],
    };
    expect(builderItemPool(rolled, [{ id: "oranberry" }])).toEqual([null, "leftovers"]);
    expect(builderItemPool(createInitialSession(), [{ id: "oranberry" }])).toEqual([
      null,
      "oranberry",
    ]);
  });
});

describe("builder draft", () => {
  it("does not invent EVs, IVs, Nature, Tera, gender, level, or shiny when opening", () => {
    const session = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
      draft: { ...createInitialSession().draft, pokemonId: "mudkip" },
    });

    expect(session.step).toBe("builder");
    expect(session.draft.evs).toBeUndefined();
    expect(session.draft.ivs).toEqual(PERFECT_IVS);
    expect(session.draft.happiness).toBe(255);
    expect(session.draft.nickname).toBeUndefined();
    expect(setDraftNickname(session, "Big Ace").draft.nickname).toBe("Big Ace");
    expect(setDraftNickname(session, "12345678901234567 ").draft.nickname).toBe("12345678901234567 ");
    expect(setDraftNickname(session, "123456789012345678 ").draft.nickname).toBeUndefined();
    expect(setDraftNickname(session, "").draft.nickname).toBeUndefined();
    expect(session.draft.natureId).toBeUndefined();
    expect(session.draft.teraType).toBeUndefined();
    expect(session.draft.gender).toBeUndefined();
    expect(session.draft.level).toBe(50);
    // Shiny starts at No. Nothing in the randomizer rolls shiny, so this is always the start.
    expect(session.draft.shiny).toBe(false);
  });

  it("starts the next Pokémon's build at the defaults, not the last build's choices", () => {
    const first = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
      draft: { ...createInitialSession().draft, pokemonId: "mudkip" },
    });
    const customized = {
      ...first,
      draft: { ...first.draft, teraType: "water" as const, gender: "M" as const, shiny: true },
    };
    expect(applyBuilderDefaults(customized).draft.shiny).toBe(true);

    const second = openBuilder(
      selectRolledPokemon(
        applyPokemonRoll(customized, {
          seed: "next",
          poolSize: 2,
          pokemon: [makeForm("treecko"), makeForm("torchic")],
        }),
        "treecko",
      ),
    );
    expect(second.draft.teraType).toBeUndefined();
    expect(second.draft.gender).toBeUndefined();
    expect(second.draft.shiny).toBe(false);
  });

  it("keeps a level the user already chose instead of resetting it to 50", () => {
    const opened = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
      draft: { ...createInitialSession().draft, level: 100 },
    });
    expect(opened.draft.level).toBe(100);
  });

  it("keeps ability and move choices inside their pools and caps EV edits", () => {
    let session = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
    });
    session = setDraftAbility(session, "swift-swim", ["torrent", "damp"]);
    expect(session.draft.abilityId).toBeUndefined();
    session = setDraftAbility(session, "torrent", ["torrent", "damp"]);
    session = setDraftMove(session, 0, "tackle", ["tackle", "growl"]);
    session = setDraftMove(session, 1, "tackle", ["tackle", "growl"]);
    expect(session.draft.moveIds).toEqual(["tackle", undefined, undefined, undefined]);
    session = setDraftItem(session, null, [null, "leftovers"]);
    expect(session.draft.itemId).toBeNull();

    session = setDraftEv(session, "hp", 252);
    session = setDraftEv(session, "atk", 252);
    session = setDraftEv(session, "spe", 8);
    expect(session.draft.evs?.spe).toBe(4);
    session = setDraftEv(session, "def", 20);
    expect(session.draft.evs?.def).toBe(0);
    session = setDraftEv(session, "spe", 0);
    session = setDraftEv(session, "def", 4);
    expect(session.draft.evs?.def).toBe(4);
  });

  it("applies a guessed EV spread and its nature", () => {
    const session = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
    });
    const next = applySuggestedEvs(session, { spa: 252, spd: 4, spe: 252 }, "Timid", [TIMID, HARDY]);

    expect(next.draft.evs).toEqual({ spa: 252, spd: 4, spe: 252 });
    expect(next.draft.natureId).toBe("timid");
  });

  it("keeps the current nature when the guessed name is not in the catalog", () => {
    const opened = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
    });
    const session = {
      ...opened,
      draft: { ...opened.draft, natureId: "hardy" },
    };
    const next = applySuggestedEvs(session, { hp: 252 }, "Not a Nature", [TIMID]);

    expect(next.draft.evs).toEqual({ hp: 252 });
    expect(next.draft.natureId).toBe("hardy");
  });

  it("keeps a custom IV and happiness instead of resetting them", () => {
    const opened = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
      draft: {
        ...createInitialSession().draft,
        ivs: { ...PERFECT_IVS, spe: 0 },
        happiness: 0,
        nickname: "Mud",
      },
    });
    expect(opened.draft.ivs?.spe).toBe(0);
    expect(opened.draft.happiness).toBe(0);
    expect(opened.draft.nickname).toBe("Mud");
  });

  it("leaves gender unset for gender-locked species", () => {
    const opened = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "latios",
      evolvedPokemonId: "latios",
    });
    const session = setDraftGender(opened, "F", "male");
    expect(session.draft.gender).toBeUndefined();
  });

  it("finalizes only a complete set and records an explicit shiny choice", () => {
    const form = makeForm("mudkip");
    let session = openBuilder({
      ...createInitialSession(),
      selectedPokemonId: "mudkip",
      evolvedPokemonId: "mudkip",
    });
    expect(finalizeBuilderSet(session, form).finalizedSet).toBeUndefined();

    session = setDraftAbility(session, "torrent", ["torrent"]);
    session = setDraftMove(session, 0, "tackle", ["tackle", "growl", "watergun", "protect"]);
    session = setDraftMove(session, 1, "growl", ["tackle", "growl", "watergun", "protect"]);
    session = setDraftMove(session, 2, "watergun", ["tackle", "growl", "watergun", "protect"]);
    session = setDraftMove(session, 3, "protect", ["tackle", "growl", "watergun", "protect"]);
    session = setDraftItem(session, null, [null]);
    for (const stat of ["hp", "atk", "def", "spa", "spd", "spe"] as const) {
      session = setDraftEv(session, stat, 0);
    }
    session = {
      ...session,
      draft: { ...session.draft, natureId: "hardy", teraType: "water", gender: "M" },
    };
    session = setDraftShiny(session, false);
    const finalized = finalizeBuilderSet(session, form);
    expect(finalized.step).toBe("recap");
    expect(finalized.finalizedSet?.shiny).toBe(false);
    expect(finalized.finalizedSet?.itemId).toBeNull();
  });
});

describe("randomizer locks", () => {
  it("keeps the ability, filled moves, and item chosen by their randomizers", () => {
    const session = {
      ...createInitialSession({
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeAbilities: true,
        randomizeMoves: true,
        randomizeItems: true,
      }),
      abilityOptions: ["torrent", "intimidate"],
      moveOptions: ["tackle", "growl"],
      itemOptions: ["leftovers"],
      draft: {
        ...createInitialSession().draft,
        abilityId: "torrent",
        moveIds: ["tackle", "growl", undefined, undefined] as Array<string | undefined>,
        itemId: "leftovers" as string | null,
      },
    };

    expect(setDraftAbility(session, "intimidate", session.abilityOptions).draft.abilityId).toBe("torrent");
    expect(setDraftMove(session, 0, "ember", ["ember", "tackle"]).draft.moveIds[0]).toBe("tackle");
    expect(setDraftMove(session, 2, "ember", ["ember"]).draft.moveIds[2]).toBe("ember");
    expect(setDraftItem(session, null, [null, "leftovers"]).draft.itemId).toBe("leftovers");
  });

  it("still lets the builder change abilities, moves, and items that were not randomized", () => {
    const session = {
      ...createInitialSession(),
      draft: {
        ...createInitialSession().draft,
        abilityId: "torrent",
        moveIds: ["tackle", undefined, undefined, undefined] as Array<string | undefined>,
        itemId: "leftovers" as string | null,
      },
    };

    expect(setDraftAbility(session, "damp", ["torrent", "damp"]).draft.abilityId).toBe("damp");
    expect(setDraftMove(session, 0, undefined, ["tackle"]).draft.moveIds[0]).toBeUndefined();
    expect(setDraftItem(session, null, [null, "leftovers"]).draft.itemId).toBeNull();
  });
});

describe("natureChoiceLabel", () => {
  it("includes the raised and lowered stats", () => {
    expect(
      natureChoiceLabel({
        id: "adamant",
        pokeApiSlug: "adamant",
        name: "Adamant",
        showdownName: "Adamant",
        plusStat: "atk",
        minusStat: "spa",
      }),
    ).toBe("Adamant (+Atk, −SpA)");
  });
});

describe("parseStoredSession", () => {
  it("rejects junk and accepts a stored session", () => {
    expect(parseStoredSession("nope")).toBeNull();
    const session = createInitialSession();
    expect(parseStoredSession(JSON.stringify(session))?.step).toBe("configure");
  });
});
