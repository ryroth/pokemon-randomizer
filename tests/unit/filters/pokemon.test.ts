import { describe, expect, it } from "vitest";
import {
  BASE_STAT_RANGE_ERROR,
  filterPokemonForms,
  matchesPokemonFilters,
} from "@/lib/filters/pokemon";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { InvalidPokemonFilterError, randomizePokemon } from "@/lib/randomizer/pokemon";
import { baseStatTotal } from "@/lib/randomizer/ball";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonFilterConfig } from "@/lib/filters/pokemon";
import type { RandomizerConfig } from "@/lib/types/randomizer";
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
    sprites: { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null },
    baseStats: EMPTY_EVS,
    genderRule: "genderless",
    pokedexColor: null,
    shape: null,
    heightM: null,
    weightKg: null,
    eggGroups: [],
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
): RandomizerConfig {
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
  it("uses default config: base, regional, and other forms, all specials allowed", () => {
    const result = filterPokemonForms(pool, DEFAULT_RANDOMIZER_CONFIG);

    expect(ids(result)).toEqual([
      "charizard",
      "charmander",
      "raichualola",
      "mewtwo",
      "dragonite",
      "walkingwake",
      "rotomwash",
    ]);
    expect(result.some((form) => form.formType === "mega")).toBe(false);
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

    expect(ids(result)).toEqual(["charizard", "raichualola", "dragonite"]);
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

    expect(ids(result)).toEqual(["charizard", "charmander", "raichualola", "rotomwash"]);
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
    expect(ids(result)).toEqual([
      "charizard",
      "charmander",
      "raichualola",
      "mewtwo",
      "dragonite",
      "walkingwake",
      "rotomwash",
    ]);
  });
});

describe("matchesPokemonFilters", () => {
  it("rejects a mega forme under default form types", () => {
    expect(matchesPokemonFilters(megaCharizardX, DEFAULT_RANDOMIZER_CONFIG)).toBe(false);
    expect(matchesPokemonFilters(charizard, DEFAULT_RANDOMIZER_CONFIG)).toBe(true);
  });

  it("rejects a mid-battle form even when every filter would allow it", () => {
    const zen = makeForm({
      id: "darmanitanzen",
      formType: "other",
      generation: 5,
      types: ["fire", "psychic"],
    });
    const darmanitan = makeForm({
      id: "darmanitan",
      formType: "base",
      generation: 5,
      types: ["fire"],
    });

    expect(matchesPokemonFilters(zen, DEFAULT_RANDOMIZER_CONFIG)).toBe(false);
    expect(matchesPokemonFilters(darmanitan, DEFAULT_RANDOMIZER_CONFIG)).toBe(true);
  });
});

describe("extra Pokémon filters", () => {
  const sandy = makeForm({
    id: "sandshrew",
    displayName: "Sandshrew",
    speciesId: "pikachu",
    types: ["ground"],
    baseStats: { hp: 50, atk: 75, def: 85, spa: 20, spd: 30, spe: 40 },
    genderRule: "mixed",
    pokedexColor: "yellow",
    shape: "upright",
    heightM: 0.6,
    weightKg: 12,
    eggGroups: ["Field"],
    evolutionTargetIds: ["sandslash"],
  });
  const bulky = makeForm({
    id: "snorlax",
    displayName: "Snorlax",
    types: ["normal"],
    baseStats: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 },
    genderRule: "mixed",
    pokedexColor: "black",
    shape: "humanoid",
    heightM: 2.1,
    weightKg: 460,
    eggGroups: ["Monster"],
  });
  const unknown = makeForm({
    id: "unknown",
    displayName: "???",
    speciesId: "not-a-real-species",
    pokedexColor: null,
    shape: null,
    heightM: null,
    weightKg: null,
    eggGroups: [],
  });

  it("keeps a form that is missing the new fields when every choice is selected", () => {
    expect(matchesPokemonFilters(unknown, DEFAULT_RANDOMIZER_CONFIG)).toBe(true);
  });

  it("matches the first letter, including a name that starts with a word", () => {
    const mime = makeForm({ id: "mrmime", displayName: "Mr. Mime" });
    expect(ids(filterPokemonForms([sandy, mime], filterConfig({ nameInitials: ["S"] })))).toEqual([
      "sandshrew",
    ]);
    expect(ids(filterPokemonForms([sandy, mime], filterConfig({ nameInitials: ["M"] })))).toEqual([
      "mrmime",
    ]);
    expect(filterPokemonForms([sandy], filterConfig({ nameInitials: [] }))).toEqual([]);
  });

  it("uses inclusive base stat totals and each form's own total", () => {
    expect(baseStatTotal(sandy.baseStats)).toBe(300);
    const mega = makeForm({
      id: "sandshrewmega",
      displayName: "Sandshrew-Mega",
      formType: "mega",
      baseStats: { hp: 50, atk: 150, def: 85, spa: 20, spd: 30, spe: 40 },
    });
    expect(
      ids(filterPokemonForms([sandy, mega], filterConfig({ formTypes: ["base", "mega"], bstMax: 300 }))),
    ).toEqual(["sandshrew"]);
    expect(ids(filterPokemonForms([sandy, bulky], filterConfig({ bstMin: 300, bstMax: 300 })))).toEqual([
      "sandshrew",
    ]);
  });

  it("filters typing, evolution, and a tied highest or lowest stat", () => {
    const tied = makeForm({
      id: "tied",
      displayName: "Tied",
      types: ["fire", "flying"],
      baseStats: { hp: 10, atk: 80, def: 10, spa: 80, spd: 10, spe: 10 },
    });
    expect(ids(filterPokemonForms([sandy, tied], filterConfig({ typeCount: "dual" })))).toEqual(["tied"]);
    expect(ids(filterPokemonForms([sandy, bulky], filterConfig({ typeCount: "single" })))).toEqual([
      "sandshrew",
      "snorlax",
    ]);
    expect(
      ids(filterPokemonForms([sandy, bulky], filterConfig({ evolutionProgress: "can-evolve" }))),
    ).toEqual(["sandshrew"]);
    expect(
      ids(filterPokemonForms([sandy, bulky], filterConfig({ evolutionProgress: "fully-evolved" }))),
    ).toEqual(["snorlax"]);
    expect(ids(filterPokemonForms([tied, sandy], filterConfig({ highestStats: ["atk"] })))).toEqual([
      "tied",
    ]);
    expect(ids(filterPokemonForms([tied], filterConfig({ highestStats: ["spa"] })))).toEqual(["tied"]);
    expect(filterPokemonForms([tied], filterConfig({ highestStats: [] }))).toEqual([]);
    expect(ids(filterPokemonForms([sandy, tied], filterConfig({ lowestStats: ["spa"] })))).toEqual([
      "sandshrew",
    ]);
    expect(ids(filterPokemonForms([tied], filterConfig({ lowestStats: ["hp"] })))).toEqual(["tied"]);
    expect(ids(filterPokemonForms([tied], filterConfig({ lowestStats: ["def"] })))).toEqual(["tied"]);
    expect(filterPokemonForms([tied], filterConfig({ lowestStats: [] }))).toEqual([]);
  });

  it("matches one official species line and refuses a partial word", () => {
    expect(filterPokemonForms([sandy, bulky], filterConfig({ genusQuery: "mouse" }))).toEqual([]);
    expect(ids(filterPokemonForms([sandy], filterConfig({ genusQuery: "  Mouse Pokémon " })))).toEqual([
      "sandshrew",
    ]);
    expect(filterPokemonForms([unknown], filterConfig({ genusQuery: "Mouse Pokémon" }))).toEqual([]);
    expect(matchesPokemonFilters(unknown, filterConfig({ genusQuery: "   " }))).toBe(true);
  });

  it("matches color, shape, size, and either egg group", () => {
    const both = makeForm({
      id: "both",
      displayName: "Both",
      eggGroups: ["Field", "Dragon"],
      pokedexColor: "red",
      shape: "wings",
      heightM: 1,
      weightKg: 20,
    });
    expect(ids(filterPokemonForms([sandy, both], filterConfig({ pokedexColors: ["red"] })))).toEqual([
      "both",
    ]);
    expect(filterPokemonForms([unknown], filterConfig({ pokedexColors: ["red"] }))).toEqual([]);
    expect(ids(filterPokemonForms([sandy, both], filterConfig({ shapes: ["wings"] })))).toEqual(["both"]);
    expect(ids(filterPokemonForms([sandy, both], filterConfig({ heightMinM: 0.6, heightMaxM: 0.6 })))).toEqual([
      "sandshrew",
    ]);
    expect(filterPokemonForms([unknown], filterConfig({ weightMinKg: 1 }))).toEqual([]);
    expect(ids(filterPokemonForms([sandy, both], filterConfig({ eggGroups: ["Dragon"] })))).toEqual([
      "both",
    ]);
    expect(ids(filterPokemonForms([sandy, both], filterConfig({ eggGroups: ["Field"] })))).toEqual([
      "sandshrew",
      "both",
    ]);
    expect(filterPokemonForms([both], filterConfig({ eggGroups: [] }))).toEqual([]);
  });

  it("refuses an inverted range before it generates", () => {
    const config = filterConfig({ bstMin: 500, bstMax: 100 });
    expect(filterPokemonForms([sandy], config)).toEqual([]);
    expect(() => randomizePokemon([sandy], config, "seed")).toThrow(InvalidPokemonFilterError);
    expect(() => randomizePokemon([sandy], config, "seed")).toThrow(BASE_STAT_RANGE_ERROR);
  });
});
