import { describe, expect, it } from "vitest";
import { filterPokemonForms, matchesPokemonFilters } from "@/lib/filters/pokemon";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonFilterConfig } from "@/lib/filters/pokemon";
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

function filterConfig(
  overrides: Partial<PokemonFilterConfig> = {},
): PokemonFilterConfig {
  return {
    ...DEFAULT_RANDOMIZER_CONFIG,
    ...overrides,
  };
}

function ids(forms: readonly PokemonForm[]): string[] {
  return forms.map((form) => form.id);
}

const charizard = makeForm({
  id: "charizard",
  generation: 1,
  types: ["fire", "flying"],
  formType: "base",
  evolutionStage: "stage2",
});
const charmander = makeForm({
  id: "charmander",
  generation: 1,
  types: ["fire"],
  formType: "base",
  evolutionStage: "basic",
});
const megaCharizardX = makeForm({
  id: "charizardmegax",
  generation: 6,
  types: ["fire", "dragon"],
  formType: "mega",
  evolutionStage: "stage2",
});
const alolanRaichu = makeForm({
  id: "raichualola",
  generation: 7,
  types: ["electric", "psychic"],
  formType: "regional",
  evolutionStage: "stage2",
});
const mewtwo = makeForm({
  id: "mewtwo",
  generation: 1,
  types: ["psychic"],
  formType: "base",
  evolutionStage: "basic",
  isLegendary: true,
});
const dragonite = makeForm({
  id: "dragonite",
  generation: 1,
  types: ["dragon", "flying"],
  formType: "base",
  evolutionStage: "stage2",
  isPseudoLegendary: true,
});
const walkingWake = makeForm({
  id: "walkingwake",
  generation: 9,
  types: ["water", "dragon"],
  formType: "base",
  evolutionStage: "basic",
  isParadox: true,
});
const rotomWash = makeForm({
  id: "rotomwash",
  generation: 4,
  types: ["electric", "water"],
  formType: "other",
  evolutionStage: "basic",
});

const pool = [
  charizard,
  charmander,
  megaCharizardX,
  alolanRaichu,
  mewtwo,
  dragonite,
  walkingWake,
  rotomWash,
];

describe("filterPokemonForms", () => {
  it("uses default config: base formes only, all specials allowed", () => {
    const result = filterPokemonForms(pool, DEFAULT_RANDOMIZER_CONFIG);

    expect(ids(result)).toEqual(["charizard", "charmander", "mewtwo", "dragonite", "walkingwake"]);
    expect(result.every((form) => form.formType === "base")).toBe(true);
  });

  it("filters by generation", () => {
    const result = filterPokemonForms(
      pool,
      filterConfig({ generations: [7, 9], formTypes: ["base", "regional"] }),
    );

    expect(ids(result)).toEqual(["raichualola", "walkingwake"]);
  });

  it("matches types with OR by default", () => {
    const result = filterPokemonForms(
      pool,
      filterConfig({
        types: ["fire", "flying"],
        typeMatchMode: "or",
        formTypes: ["base", "mega"],
      }),
    );

    expect(ids(result)).toEqual(["charizard", "charmander", "charizardmegax", "dragonite"]);
  });

  it("matches types with AND so every selected type must be present", () => {
    const result = filterPokemonForms(
      pool,
      filterConfig({
        types: ["fire", "flying"],
        typeMatchMode: "and",
        formTypes: ["base", "mega"],
      }),
    );

    expect(ids(result)).toEqual(["charizard"]);
  });

  it("filters by form type", () => {
    const result = filterPokemonForms(pool, filterConfig({ formTypes: ["mega", "regional"] }));

    expect(ids(result)).toEqual(["charizardmegax", "raichualola"]);
  });

  it("filters by evolution stage", () => {
    const result = filterPokemonForms(pool, filterConfig({ evolutionStages: ["stage2"] }));

    expect(ids(result)).toEqual(["charizard", "dragonite"]);
  });

  it("excludes special classifications independently", () => {
    const result = filterPokemonForms(
      pool,
      filterConfig({
        allowLegendary: false,
        allowPseudoLegendary: false,
        allowParadox: false,
      }),
    );

    expect(ids(result)).toEqual(["charizard", "charmander"]);
    expect(ids(result)).not.toContain("mewtwo");
    expect(ids(result)).not.toContain("dragonite");
    expect(ids(result)).not.toContain("walkingwake");
  });

  it("combines generation, form type, type, and stage", () => {
    const result = filterPokemonForms(
      pool,
      filterConfig({
        generations: [7],
        formTypes: ["regional"],
        types: ["electric"],
        typeMatchMode: "or",
        evolutionStages: ["stage2"],
      }),
    );

    expect(ids(result)).toEqual(["raichualola"]);
  });

  it("returns an empty pool when a multi-select list is empty", () => {
    expect(filterPokemonForms(pool, filterConfig({ generations: [] }))).toEqual([]);
    expect(filterPokemonForms(pool, filterConfig({ types: [] }))).toEqual([]);
    expect(filterPokemonForms(pool, filterConfig({ formTypes: [] }))).toEqual([]);
    expect(filterPokemonForms(pool, filterConfig({ evolutionStages: [] }))).toEqual([]);
  });

  it("preserves catalog order", () => {
    const result = filterPokemonForms(pool, DEFAULT_RANDOMIZER_CONFIG);
    expect(ids(result)).toEqual(["charizard", "charmander", "mewtwo", "dragonite", "walkingwake"]);
  });
});

describe("matchesPokemonFilters", () => {
  it("rejects a mega forme under default form types", () => {
    expect(matchesPokemonFilters(megaCharizardX, DEFAULT_RANDOMIZER_CONFIG)).toBe(false);
    expect(matchesPokemonFilters(charizard, DEFAULT_RANDOMIZER_CONFIG)).toBe(true);
  });
});
