import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evolutionConflictContext, evolutionFormsConflict } from "@/lib/data/evolution";
import { generatedCatalogPath, loadGeneratedCatalog, slimPokemonForClient } from "@/lib/data/loadCatalog";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { randomizePokemon } from "@/lib/randomizer/pokemon";
import { InsufficientPoolError } from "@/lib/randomizer/randomUtils";

const catalogPath = generatedCatalogPath();
const catalogAvailable = existsSync(catalogPath);

describe.skipIf(!catalogAvailable)("catalog Pokémon randomizer", () => {
  const catalog = loadGeneratedCatalog();

  it("rolls unique default-filter Pokémon for a fixed seed", () => {
    const result = randomizePokemon(catalog.pokemon, DEFAULT_RANDOMIZER_CONFIG, "catalog-seed");
    const ids = result.pokemon.map((form) => form.id);

    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    expect(result.pokemon.every((form) => form.formType === "base")).toBe(true);
    expect(result.poolSize).toBeGreaterThanOrEqual(6);

    const again = randomizePokemon(catalog.pokemon, DEFAULT_RANDOMIZER_CONFIG, "catalog-seed");
    expect(again.pokemon.map((form) => form.id)).toEqual(ids);
  });

  it("never rolls two Pokémon that share an overlapping evolution path", () => {
    const context = evolutionConflictContext(catalog.pokemon);

    for (const seed of ["catalog-seed", "line-a", "line-b", "line-c"]) {
      const result = randomizePokemon(catalog.pokemon, DEFAULT_RANDOMIZER_CONFIG, seed);
      for (let left = 0; left < result.pokemon.length; left += 1) {
        for (let right = left + 1; right < result.pokemon.length; right += 1) {
          const first = result.pokemon[left];
          const second = result.pokemon[right];
          if (!first || !second) {
            throw new Error("Expected rolled Pokémon");
          }
          expect(evolutionFormsConflict(first, second, context)).toBe(false);
        }
      }
    }
  });

  it("throws instead of returning a short list when the catalog pool is too small", () => {
    expect(() =>
      randomizePokemon(
        catalog.pokemon,
        {
          ...DEFAULT_RANDOMIZER_CONFIG,
          pokemonCount: 6,
          generations: [1],
          formTypes: ["mega"],
        },
        "empty-mega-pool",
      ),
    ).toThrow(InsufficientPoolError);
  });

  it("sends at most one Pokédex entry to the client payload", () => {
    const bulky = catalog.pokemon.find((form) => form.dexEntries.length > 1);
    if (!bulky) {
      throw new Error("Expected a catalog Pokémon with more than one Pokédex entry");
    }

    const slim = slimPokemonForClient([bulky]);
    expect(slim[0]?.dexEntries).toHaveLength(1);
    expect(slim[0]?.evolutionTargetIds).toEqual(bulky.evolutionTargetIds);
  });
});
