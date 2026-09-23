import { describe, expect, it } from "vitest";
import { validateIvs } from "@/lib/validation/iv";
import { validateMoves } from "@/lib/validation/moves";
import { validateNature } from "@/lib/validation/identity";
import { validateLevel, validateShiny, validateTeraType } from "@/lib/validation/details";
import { validateSet } from "@/lib/validation/set";
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
  sprites: { sprite: null, spriteShiny: null, artwork: null },
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

  it("rejects fewer than four moves", () => {
    const result = validateMoves(["stealthrock", "earthquake"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("moves.too-few");
    }
  });

  it("rejects more than four moves", () => {
    const result = validateMoves(["a", "b", "c", "d", "e"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("moves.too-many");
    }
  });

  it("requires tera, level, and shiny", () => {
    expect(validateTeraType(undefined).ok).toBe(false);
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
        evsConfirmed: true,
      },
      swampert,
    );

    expect(result.ok).toBe(true);
  });

  it("blocks an unconfirmed EV spread even when 0/0 is numerically legal", () => {
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
        evsConfirmed: false,
      },
      swampert,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.code === "evs.unconfirmed")).toBe(true);
    }
  });
});
