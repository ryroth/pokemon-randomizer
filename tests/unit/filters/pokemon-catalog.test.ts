import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { filterPokemonForms } from "@/lib/filters/pokemon";
import { generatedCatalogPath, loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import type { PokemonFilterConfig } from "@/lib/filters/pokemon";
import type { PokemonForm } from "@/lib/types/pokemon";

const catalogPath = generatedCatalogPath();
const catalogAvailable = existsSync(catalogPath);

describe.skipIf(!catalogAvailable)("catalog Pokémon filters", () => {
  const catalog = loadGeneratedCatalog();

  function bySlug(slug: string): PokemonForm {
    const match = catalog.pokemon.find((pokemon) => pokemon.pokeApiSlug === slug);
    if (!match) {
      throw new Error(`Expected catalog Pokémon with pokeApiSlug ${slug}`);
    }
    return match;
  }

  function filter(overrides: Partial<PokemonFilterConfig> = {}): PokemonForm[] {
    return filterPokemonForms(catalog.pokemon, {
      ...DEFAULT_RANDOMIZER_CONFIG,
      ...overrides,
    });
  }

  function idsOf(forms: readonly PokemonForm[]): Set<string> {
    return new Set(forms.map((form) => form.id));
  }

  it("respects locked defaults on the generated catalog", () => {
    const result = filter();
    const ids = idsOf(result);

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(catalog.pokemon.length);
    expect(result.every((form) => form.formType === "base")).toBe(true);

    expect(ids.has(bySlug("mewtwo").id)).toBe(true);
    expect(ids.has(bySlug("articuno").id)).toBe(true);
    expect(ids.has(bySlug("dragonite").id)).toBe(true);
    expect(ids.has(bySlug("pichu").id)).toBe(true);
    expect(ids.has(bySlug("walking-wake").id)).toBe(true);
    expect(ids.has(bySlug("nihilego").id)).toBe(true);
    expect(ids.has(bySlug("charizard").id)).toBe(true);
    expect(ids.has(bySlug("kyogre").id)).toBe(true);
    expect(ids.has(bySlug("mew").id)).toBe(true);

    expect(ids.has(bySlug("raichu-alola").id)).toBe(false);
    expect(ids.has(bySlug("venusaur-mega").id)).toBe(false);
    expect(ids.has(bySlug("charizard-mega-x").id)).toBe(false);
    expect(ids.has(bySlug("charizard-gmax").id)).toBe(false);
    expect(ids.has(bySlug("kyogre-primal").id)).toBe(false);
    expect(ids.has(bySlug("articuno-galar").id)).toBe(false);
    expect(ids.has(bySlug("rotom-wash").id)).toBe(false);
  });

  it("includes Alolan Raichu only when regional formes and gen 7 are enabled", () => {
    const withoutRegional = idsOf(filter({ generations: [7] }));
    expect(withoutRegional.has(bySlug("raichu-alola").id)).toBe(false);
    expect(withoutRegional.has(bySlug("nihilego").id)).toBe(true);

    const withRegional = idsOf(
      filter({
        generations: [7],
        formTypes: ["regional"],
        types: ["electric"],
        typeMatchMode: "or",
        evolutionStages: ["stage2"],
      }),
    );

    expect(withRegional.has(bySlug("raichu-alola").id)).toBe(true);
    expect(withRegional.has(bySlug("raichu").id)).toBe(false);
    expect(withRegional.has(bySlug("nihilego").id)).toBe(false);
  });

  it("includes Mega Venusaur for gen 6 mega grass, not Mega Charizard X", () => {
    const result = idsOf(
      filter({
        generations: [6],
        formTypes: ["mega"],
        types: ["grass"],
        typeMatchMode: "or",
      }),
    );

    expect(result.has(bySlug("venusaur-mega").id)).toBe(true);
    expect(result.has(bySlug("venusaur").id)).toBe(false);
    expect(result.has(bySlug("charizard-mega-x").id)).toBe(false);
  });

  it("distinguishes type OR from type AND on Charizard's line", () => {
    const orMatch = idsOf(
      filter({
        types: ["fire", "flying"],
        typeMatchMode: "or",
      }),
    );
    const andMatch = idsOf(
      filter({
        types: ["fire", "flying"],
        typeMatchMode: "and",
        formTypes: ["base", "mega"],
      }),
    );

    expect(orMatch.has(bySlug("charizard").id)).toBe(true);
    expect(orMatch.has(bySlug("charmander").id)).toBe(true);
    expect(orMatch.has(bySlug("dragonite").id)).toBe(true);
    expect(orMatch.has(bySlug("swampert").id)).toBe(false);

    expect(andMatch.has(bySlug("charizard").id)).toBe(true);
    expect(andMatch.has(bySlug("charmander").id)).toBe(false);
    expect(andMatch.has(bySlug("charizard-mega-x").id)).toBe(false);
    expect(andMatch.has(bySlug("charizard-mega-y").id)).toBe(true);
  });

  it("combines evolution stage with a special exclusion", () => {
    const result = idsOf(
      filter({
        evolutionStages: ["stage2"],
        allowPseudoLegendary: false,
      }),
    );

    expect(result.has(bySlug("charizard").id)).toBe(true);
    expect(result.has(bySlug("swampert").id)).toBe(true);
    expect(result.has(bySlug("dragonite").id)).toBe(false);
    expect(result.has(bySlug("pichu").id)).toBe(false);
  });

  it("combines regional formes with a sub-legendary exclusion", () => {
    const allowed = idsOf(filter({ formTypes: ["regional"] }));
    const excluded = idsOf(
      filter({
        formTypes: ["regional"],
        allowSubLegendary: false,
      }),
    );

    expect(allowed.has(bySlug("raichu-alola").id)).toBe(true);
    expect(allowed.has(bySlug("articuno-galar").id)).toBe(true);
    expect(excluded.has(bySlug("raichu-alola").id)).toBe(true);
    expect(excluded.has(bySlug("articuno-galar").id)).toBe(false);
  });

  it("excludes each special classification when its allow flag is off", () => {
    const result = idsOf(
      filter({
        allowLegendary: false,
        allowSubLegendary: false,
        allowMythical: false,
        allowPseudoLegendary: false,
        allowParadox: false,
        allowUltraBeast: false,
      }),
    );

    expect(result.has(bySlug("charizard").id)).toBe(true);
    expect(result.has(bySlug("mewtwo").id)).toBe(false);
    expect(result.has(bySlug("articuno").id)).toBe(false);
    expect(result.has(bySlug("mew").id)).toBe(false);
    expect(result.has(bySlug("dragonite").id)).toBe(false);
    expect(result.has(bySlug("walking-wake").id)).toBe(false);
    expect(result.has(bySlug("nihilego").id)).toBe(false);
  });

  it("keeps Primal Kyogre out of the default pool and in when primal is enabled", () => {
    const defaults = idsOf(filter());
    const primals = idsOf(
      filter({
        formTypes: ["primal"],
        generations: [6],
      }),
    );

    expect(defaults.has(bySlug("kyogre").id)).toBe(true);
    expect(defaults.has(bySlug("kyogre-primal").id)).toBe(false);
    expect(primals.has(bySlug("kyogre-primal").id)).toBe(true);
    expect(primals.has(bySlug("kyogre").id)).toBe(false);
  });
});
