import { describe, expect, it } from "vitest";
import { validateIvs } from "@/lib/validation/iv";
import { validateMoves } from "@/lib/validation/moves";
import { validateNature } from "@/lib/validation/identity";
import { validateLevel, validateNickname, validateShiny, validateTeraType } from "@/lib/validation/details";
import { defaultTeraType, validateSet } from "@/lib/validation/set";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS, PERFECT_IVS } from "@/lib/types/stats";

const swampert: PokemonForm = {
  id: "swampert",
  pokeApiId: 260,
  pokeApiSlug: "swampert",
  name: "swampert",
  displayName: "Swampert",
  showdownName: "Swampert",
  nationalDexNumber: 260,
  generation: 3,
  types: ["water", "ground"],
  abilityIds: ["torrent", "damp"],
  speciesId: "swampert",
  form: "",
  formType: "base",
  evolutionStage: "stage2",
  isBasic: false,
  isStage1: false,
  isStage2: true,
  isPseudoLegendary: false,
  isSubLegendary: false,
  isLegendary: false,
  isMythical: false,
  isParadox: false,
  isUltraBeast: false,
  isBaby: false,
  dexEntries: [],
  sprites: { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null },
  baseStats: { hp: 100, atk: 110, def: 90, spa: 85, spd: 90, spe: 60 },
  genderRule: "mixed",
  evolutionTargetIds: [],
};

describe("set field validators", () => {
  it("rejects IVs outside 0-31", () => {
    const result = validateIvs({ ...PERFECT_IVS, atk: 32 });
    expect(result.ok).toBe(false);
  });

  it("rejects missing nature", () => {
    const result = validateNature(undefined);
    expect(result.ok).toBe(false);
  });

  it("accepts one to four moves", () => {
    expect(validateMoves(["protect"]).ok).toBe(true);
    expect(validateMoves(["protect", "lastresort"]).ok).toBe(true);
    expect(validateMoves(["a", "b", "c", "d"]).ok).toBe(true);
  });

  it("rejects an empty move list", () => {
    const result = validateMoves([]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("moves.too-few");
    }
  });

  it("rejects Struggle", () => {
    const result = validateMoves(["protect", "struggle"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("moves.struggle");
    }
  });

  it("rejects more than four moves", () => {
    const result = validateMoves(["a", "b", "c", "d", "e"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("moves.too-many");
    }
  });

  it("keeps spaces inside a nickname and counts them toward 18 characters", () => {
    expect(validateNickname("Big Ace")).toEqual({ ok: true, value: "Big Ace" });
    expect(validateNickname("  Big Ace  ")).toEqual({ ok: true, value: "Big Ace" });
    expect(validateNickname(" ".repeat(18))).toEqual({ ok: true, value: undefined });
    const tooLong = validateNickname(`${"a".repeat(9)} ${"a".repeat(9)}`);
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) {
      expect(tooLong.errors[0]?.code).toBe("nickname.length");
    }
  });

  it("requires level and shiny", () => {
    expect(validateLevel(undefined).ok).toBe(false);
    expect(validateShiny(undefined).ok).toBe(false);
    expect(validateTeraType("water").ok).toBe(true);
    expect(validateLevel(50).ok).toBe(true);
    expect(validateShiny(false).ok).toBe(true);
  });
});

describe("validateSet", () => {
  it("accepts a complete Swampert draft", () => {
    const result = validateSet(
      {
        pokemonId: "swampert",
        itemId: "leftovers",
        abilityId: "damp",
        moveIds: ["stealthrock", "flipturn", "earthquake", "knockoff"],
        evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
        ivs: PERFECT_IVS,
        natureId: "adamant",
        teraType: "water",
        gender: "M",
        level: 100,
        shiny: false,
        happiness: 255,
      },
      swampert,
    );

    expect(result.ok).toBe(true);
  });

  it("accepts an all-zero EV spread without a separate confirmation", () => {
    const result = validateSet(
      {
        pokemonId: "swampert",
        itemId: null,
        abilityId: "torrent",
        moveIds: ["a", "b", "c", "d"],
        evs: EMPTY_EVS,
        ivs: PERFECT_IVS,
        natureId: "adamant",
        teraType: "ground",
        gender: "F",
        level: 50,
        shiny: true,
        happiness: 255,
      },
      swampert,
    );

    expect(result.ok).toBe(true);
  });

  it("treats blank EV slots as 0", () => {
    const result = validateSet(
      {
        pokemonId: "swampert",
        itemId: null,
        abilityId: "torrent",
        moveIds: ["a", "b", "c", "d"],
        evs: { hp: 0 },
        ivs: PERFECT_IVS,
        natureId: "adamant",
        teraType: "water",
        gender: "M",
        level: 50,
        shiny: false,
        happiness: 255,
      },
      swampert,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.evs).toEqual({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
    }
  });

  const blankDraft = {
    pokemonId: "swampert",
    itemId: null,
    abilityId: "torrent",
    moveIds: ["protect", "lastresort"],
    evs: EMPTY_EVS,
    ivs: PERFECT_IVS,
    natureId: "adamant",
    level: 50,
    shiny: false,
    happiness: 255,
  };

  it("accepts two moves and a blank Tera type, using the primary type", () => {
    const result = validateSet(blankDraft, swampert, { fallbackGender: "F" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.moveIds).toEqual(["protect", "lastresort"]);
      expect(result.value.teraType).toBe("water");
      expect(result.value.gender).toBe("F");
    }
  });

  it("needs a gender or a fallback for a species with both genders", () => {
    expect(validateSet(blankDraft, swampert).ok).toBe(false);
    expect(validateSet(blankDraft, { ...swampert, genderRule: "genderless" }).ok).toBe(true);
  });

  it("names the primary type as the Tera default", () => {
    expect(defaultTeraType(swampert)).toBe("water");
    expect(defaultTeraType(undefined)).toBeUndefined();
  });
});
