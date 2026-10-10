import { describe, expect, it } from "vitest";
import {
  ballForPokemon,
  baseStatTotal,
  GREAT_BALL_MIN_BST,
  ULTRA_BALL_MIN_BST,
  type BallInput,
  type BallKind,
} from "@/lib/randomizer/ball";
import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";

function input(total: number, flags: Partial<BallInput> = {}): BallInput {
  // Spread the total over six stats; only the sum matters.
  const each = Math.floor(total / 6);
  const rest = total - each * 5;
  return {
    baseStats: { hp: rest, atk: each, def: each, spa: each, spd: each, spe: each },
    isLegendary: false,
    isSubLegendary: false,
    isMythical: false,
    isParadox: false,
    isUltraBeast: false,
    isPseudoLegendary: false,
    ...flags,
  };
}

describe("baseStatTotal", () => {
  it("adds the six base stats", () => {
    expect(baseStatTotal({ hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 })).toBe(318);
  });
});

describe("ballForPokemon", () => {
  it("uses a Poké Ball below 400, a Great Ball from 400, and an Ultra Ball from 500", () => {
    expect(ballForPokemon(input(GREAT_BALL_MIN_BST - 1))).toBe("poke");
    expect(ballForPokemon(input(GREAT_BALL_MIN_BST))).toBe("great");
    expect(ballForPokemon(input(ULTRA_BALL_MIN_BST - 1))).toBe("great");
    expect(ballForPokemon(input(ULTRA_BALL_MIN_BST))).toBe("ultra");
    expect(ballForPokemon(input(680))).toBe("ultra");
  });

  it("reserves the Master Ball for every special classification except pseudo-legendary", () => {
    for (const flag of [
      "isLegendary",
      "isSubLegendary",
      "isMythical",
      "isParadox",
      "isUltraBeast",
    ] as const) {
      expect(ballForPokemon(input(300, { [flag]: true })), flag).toBe("master");
    }
  });

  it("gives pseudo-legendary Pokémon a Luxury Ball whatever their total", () => {
    expect(ballForPokemon(input(600, { isPseudoLegendary: true }))).toBe("luxury");
  });

  it("keeps a Master Ball when a Pokémon is both special and pseudo-legendary", () => {
    expect(ballForPokemon(input(600, { isPseudoLegendary: true, isMythical: true }))).toBe("master");
  });
});

describe("ballForPokemon on the real catalog", () => {
  const catalog = loadGeneratedCatalog();
  const byId = new Map(catalog.pokemon.map((form) => [form.id, form]));

  it.each<[string, BallKind]>([
    ["caterpie", "poke"],
    ["pidgeotto", "poke"],
    ["pidgeot", "great"],
    ["arcanine", "ultra"],
    ["gyarados", "ultra"],
    ["dragonite", "luxury"],
    ["garchomp", "luxury"],
    ["mewtwo", "master"],
    ["mew", "master"],
    ["tapukoko", "master"],
    ["nihilego", "master"],
    ["greattusk", "master"],
  ])("%s comes out of a %s ball", (id, expected) => {
    const form = byId.get(id);
    expect(form, id).toBeDefined();
    if (form) {
      expect(ballForPokemon(form)).toBe(expected);
    }
  });
});
