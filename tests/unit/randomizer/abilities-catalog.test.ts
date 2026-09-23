import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatedCatalogPath, loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { randomizeAbilities } from "@/lib/randomizer/abilities";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";

const catalogPath = generatedCatalogPath();
const catalogAvailable = existsSync(catalogPath);

describe.skipIf(!catalogAvailable)("catalog ability randomizer", () => {
  const catalog = loadGeneratedCatalog();

  it("rolls unique standard abilities for a fixed seed", () => {
    const result = randomizeAbilities(
      catalog.abilities,
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true, abilityCount: 3 },
      "catalog-ability-seed",
    );
    const ids = result.abilities.map((ability) => ability.id);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(result.poolSize).toBe(catalog.abilities.length);
    expect(catalog.abilities.length).toBeGreaterThan(300);
    expect(ids.includes("noability")).toBe(false);

    const again = randomizeAbilities(
      catalog.abilities,
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true, abilityCount: 3 },
      "catalog-ability-seed",
    );
    expect(again.abilities.map((ability) => ability.id)).toEqual(ids);
  });

  it("does not limit the pool to a Pokémon's usual abilityIds", () => {
    const swampert = catalog.pokemon.find((form) => form.id === "swampert");
    if (!swampert) {
      throw new Error("Expected catalog Pokémon with id swampert");
    }

    const result = randomizeAbilities(
      catalog.abilities,
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true, abilityCount: 12 },
      "not-legal-only",
    );
    const rolledOutsideUsual = result.abilities.some(
      (ability) => !swampert.abilityIds.includes(ability.id),
    );

    expect(swampert.abilityIds.length).toBeGreaterThan(0);
    expect(rolledOutsideUsual).toBe(true);
  });
});
