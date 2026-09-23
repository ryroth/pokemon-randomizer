import { describe, expect, it } from "vitest";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import {
  InvalidPokemonCountError,
  randomizePokemon,
  userFacingRandomizerMessage,
} from "@/lib/randomizer/pokemon";
import { InsufficientPoolError } from "@/lib/randomizer/randomUtils";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS } from "@/lib/types/stats";

function makeForm(overrides: Partial<PokemonForm> & Pick<PokemonForm, "id">): PokemonForm {
  const evolutionStage = overrides.evolutionStage ?? "basic";

  return {
    pokeApiId: 0,
    pokeApiSlug: overrides.id,
    name: overrides.id,
    displayName: overrides.id,
    showdownName: overrides.id,
    nationalDexNumber: 0,
    generation: 1,
    types: ["normal"],
    abilityIds: [],
    speciesId: overrides.id,
    form: "",
    formType: "base",
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
    ...overrides,
    evolutionStage,
    isBasic: overrides.isBasic ?? evolutionStage === "basic",
    isStage1: overrides.isStage1 ?? evolutionStage === "stage1",
    isStage2: overrides.isStage2 ?? evolutionStage === "stage2",
  };
}

const charizard = makeForm({
  id: "charizard",
  generation: 1,
  types: ["fire", "flying"],
  formType: "base",
  evolutionStage: "stage2",
  speciesId: "charizard",
});
const charmander = makeForm({
  id: "charmander",
  generation: 1,
  types: ["fire"],
  formType: "base",
  evolutionStage: "basic",
  evolutionTargetIds: ["charizard"],
});
const megaCharizardX = makeForm({
  id: "charizardmegax",
  generation: 6,
  types: ["fire", "dragon"],
  formType: "mega",
  evolutionStage: "stage2",
  speciesId: "charizard",
});
const alolanRaichu = makeForm({
  id: "raichualola",
  generation: 7,
  types: ["electric", "psychic"],
  formType: "regional",
  evolutionStage: "stage2",
});
const squirtle = makeForm({
  id: "squirtle",
  generation: 1,
  types: ["water"],
  formType: "base",
  evolutionStage: "basic",
});
const bulbasaur = makeForm({
  id: "bulbasaur",
  generation: 1,
  types: ["grass", "poison"],
  formType: "base",
  evolutionStage: "basic",
});
const honedge = makeForm({
  id: "honedge",
  generation: 6,
  types: ["steel", "ghost"],
  evolutionStage: "basic",
  evolutionTargetIds: ["doublade", "aegislash"],
  nationalDexNumber: 679,
});
const doublade = makeForm({
  id: "doublade",
  generation: 6,
  types: ["steel", "ghost"],
  evolutionStage: "stage1",
  evolutionTargetIds: ["aegislash"],
  nationalDexNumber: 680,
});
const aegislash = makeForm({
  id: "aegislash",
  generation: 6,
  types: ["steel", "ghost"],
  evolutionStage: "stage2",
  nationalDexNumber: 681,
});
const wurmple = makeForm({
  id: "wurmple",
  generation: 3,
  types: ["bug"],
  evolutionStage: "basic",
  evolutionTargetIds: ["silcoon", "cascoon", "beautifly", "dustox"],
});
const silcoon = makeForm({
  id: "silcoon",
  generation: 3,
  types: ["bug"],
  evolutionStage: "stage1",
  evolutionTargetIds: ["beautifly"],
});
const beautifly = makeForm({
  id: "beautifly",
  generation: 3,
  types: ["bug", "flying"],
  evolutionStage: "stage2",
});
const cascoon = makeForm({
  id: "cascoon",
  generation: 3,
  types: ["bug"],
  evolutionStage: "stage1",
  evolutionTargetIds: ["dustox"],
});
const dustox = makeForm({
  id: "dustox",
  generation: 3,
  types: ["bug", "poison"],
  evolutionStage: "stage2",
});

const pool = [
  charizard,
  charmander,
  megaCharizardX,
  alolanRaichu,
  squirtle,
  bulbasaur,
];

function config(
  overrides: Partial<typeof DEFAULT_RANDOMIZER_CONFIG> = {},
): typeof DEFAULT_RANDOMIZER_CONFIG {
  return { ...DEFAULT_RANDOMIZER_CONFIG, ...overrides };
}

describe("randomizePokemon", () => {
  it("returns unique Pokémon by evolution line", () => {
    const result = randomizePokemon(pool, config({ pokemonCount: 3 }), "unique-seed");
    const ids = result.pokemon.map((form) => form.id);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids.includes("charmander") && ids.includes("charizard")).toBe(false);
  });

  it("reproduces the same roll for the same seed and filters", () => {
    const first = randomizePokemon(pool, config({ pokemonCount: 3 }), "repeat-seed");
    const second = randomizePokemon(pool, config({ pokemonCount: 3 }), "repeat-seed");

    expect(first.pokemon.map((form) => form.id)).toEqual(
      second.pokemon.map((form) => form.id),
    );
    expect(first.seed).toBe("repeat-seed");
  });

  it("uses the filtered pool, so default rolls exclude Mega formes", () => {
    const result = randomizePokemon(pool, config({ pokemonCount: 3 }), "base-only");
    const ids = result.pokemon.map((form) => form.id);

    expect(result.poolSize).toBe(3);
    expect(ids).toHaveLength(3);
    expect(result.pokemon.every((form) => form.formType === "base")).toBe(true);
    expect(ids).toContain("squirtle");
    expect(ids).toContain("bulbasaur");
    expect(ids.some((id) => id === "charmander" || id === "charizard")).toBe(true);
    expect(ids.includes("charmander") && ids.includes("charizard")).toBe(false);
  });

  it("keeps only one Pokémon from a linear evolution path in a batch", () => {
    const result = randomizePokemon(
      [honedge, doublade, aegislash, squirtle],
      config({ pokemonCount: 2, generations: [1, 6] }),
      "honedge-line",
    );
    const ids = result.pokemon.map((form) => form.id);

    expect(result.poolSize).toBe(2);
    expect(ids).toContain("squirtle");
    expect(ids.filter((id) => id === "honedge" || id === "doublade" || id === "aegislash")).toHaveLength(
      1,
    );
  });

  it("can roll both branches of a split evolution in the same batch", () => {
    const result = randomizePokemon(
      [wurmple, silcoon, cascoon, beautifly, dustox],
      config({ pokemonCount: 2, generations: [3], types: ["bug"] }),
      "wurmple-split",
    );
    const ids = new Set(result.pokemon.map((form) => form.id));

    expect(result.poolSize).toBe(2);
    expect(ids.has("wurmple")).toBe(false);
    expect(ids.has("silcoon") || ids.has("beautifly")).toBe(true);
    expect(ids.has("cascoon") || ids.has("dustox")).toBe(true);
    expect(ids.has("silcoon") && ids.has("beautifly")).toBe(false);
    expect(ids.has("cascoon") && ids.has("dustox")).toBe(false);
  });

  it("can roll a Mega when that form type is enabled", () => {
    const result = randomizePokemon(
      pool,
      config({
        pokemonCount: 1,
        generations: [6],
        formTypes: ["mega"],
        types: ["fire"],
      }),
      "mega-seed",
    );

    expect(result.pokemon).toEqual([megaCharizardX]);
  });

  it("throws when the filtered pool is smaller than the requested count", () => {
    expect(() =>
      randomizePokemon(
        pool,
        config({ pokemonCount: 2, formTypes: ["regional"] }),
        "short-pool",
      ),
    ).toThrow(InsufficientPoolError);
  });

  it("throws when one evolution path cannot fill the requested count", () => {
    expect(() =>
      randomizePokemon(
        [honedge, doublade, aegislash],
        config({ pokemonCount: 2, generations: [6], types: ["steel"] }),
        "one-line",
      ),
    ).toThrow(InsufficientPoolError);
  });

  it("throws when split branches cannot fill the requested count", () => {
    expect(() =>
      randomizePokemon(
        [wurmple, silcoon, cascoon, beautifly, dustox],
        config({ pokemonCount: 3, generations: [3], types: ["bug"] }),
        "wurmple-too-many",
      ),
    ).toThrow(InsufficientPoolError);
  });

  it("throws a user-facing error for an out-of-range count", () => {
    expect(() => randomizePokemon(pool, config({ pokemonCount: 0 }), "bad-count")).toThrow(
      InvalidPokemonCountError,
    );
    expect(() => randomizePokemon(pool, config({ pokemonCount: 13 }), "bad-count")).toThrow(
      InvalidPokemonCountError,
    );
  });
});

describe("userFacingRandomizerMessage", () => {
  it("returns the insufficient-pool message", () => {
    const error = new InsufficientPoolError("Pokémon", 1, 6);
    expect(userFacingRandomizerMessage(error)).toBe(error.message);
  });

  it("hides unexpected errors behind a plain-language fallback", () => {
    expect(userFacingRandomizerMessage(new Error("ENOENT catalog.json"))).toBe(
      "Something went wrong while generating. Please try again.",
    );
  });
});
