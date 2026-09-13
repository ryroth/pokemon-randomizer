import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatedCatalogPath, loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import type { PokemonForm } from "@/lib/types/pokemon";

const catalogPath = generatedCatalogPath();
const catalogAvailable = existsSync(catalogPath);

describe.skipIf(!catalogAvailable)("generated catalog integrity", () => {
  const catalog = loadGeneratedCatalog();

  function byPokeApiSlug(slug: string): PokemonForm {
    const match = catalog.pokemon.find((pokemon) => pokemon.pokeApiSlug === slug);
    if (!match) {
      throw new Error(`Expected catalog Pokémon with pokeApiSlug ${slug}`);
    }
    return match;
  }

  it("contains the required collections and dual ids", () => {
    expect(catalog.pokemon.length).toBeGreaterThan(1000);
    expect(catalog.species.length).toBeGreaterThan(900);
    expect(catalog.abilities.length).toBeGreaterThan(200);
    expect(catalog.moves.length).toBeGreaterThan(700);
    expect(catalog.items.length).toBeGreaterThan(200);
    expect(catalog.natures).toHaveLength(25);

    for (const pokemon of catalog.pokemon) {
      expect(pokemon.id).toBeTruthy();
      expect(pokemon.pokeApiSlug).toBeTruthy();
      expect(pokemon.showdownName).toBeTruthy();
      expect(pokemon.speciesId).toBeTruthy();
      expect(pokemon.types.length).toBeGreaterThan(0);
    }
    for (const species of catalog.species) {
      expect(species.pokeApiSlug).toBeTruthy();
      expect(species.showdownName).toBeTruthy();
    }
    for (const ability of catalog.abilities) {
      expect(ability.pokeApiSlug).toBeTruthy();
      expect(ability.showdownName).toBeTruthy();
    }
    for (const move of catalog.moves) {
      expect(move.pokeApiSlug).toBeTruthy();
      expect(move.showdownName).toBeTruthy();
    }
    for (const item of catalog.items) {
      expect(item.pokeApiSlug).toBeTruthy();
      expect(item.showdownName).toBeTruthy();
    }
    for (const nature of catalog.natures) {
      expect(nature.pokeApiSlug).toBeTruthy();
      expect(nature.showdownName).toBeTruthy();
    }
  });

  it("keeps Pokémon ids unique by form", () => {
    const ids = catalog.pokemon.map((pokemon) => pokemon.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("classifies fixture species", () => {
    const mewtwo = byPokeApiSlug("mewtwo");
    expect(mewtwo.showdownName).toBe("Mewtwo");
    expect(mewtwo.isLegendary).toBe(true);
    expect(mewtwo.isSubLegendary).toBe(false);
    expect(mewtwo.formType).toBe("base");
    expect(mewtwo.sprites.artwork).toBeTruthy();

    const articuno = byPokeApiSlug("articuno");
    expect(articuno.isSubLegendary).toBe(true);
    expect(articuno.isLegendary).toBe(false);

    const nihilego = byPokeApiSlug("nihilego");
    expect(nihilego.isUltraBeast).toBe(true);

    const walkingWake = byPokeApiSlug("walking-wake");
    expect(walkingWake.showdownName).toBe("Walking Wake");
    expect(walkingWake.isParadox).toBe(true);
    expect(walkingWake.generation).toBe(9);

    const dragonite = byPokeApiSlug("dragonite");
    expect(dragonite.isPseudoLegendary).toBe(true);
    expect(dragonite.evolutionStage).toBe("stage2");
    expect(dragonite.isStage2).toBe(true);

    const pichu = byPokeApiSlug("pichu");
    expect(pichu.isBaby).toBe(true);
    expect(pichu.evolutionStage).toBe("basic");

    const alolanRaichu = byPokeApiSlug("raichu-alola");
    expect(alolanRaichu.showdownName).toBe("Raichu-Alola");
    expect(alolanRaichu.formType).toBe("regional");
    expect(alolanRaichu.generation).toBe(7);
    expect(alolanRaichu.evolutionStage).toBe("stage2");
    expect(alolanRaichu.speciesId).toBe("raichu");
    expect(alolanRaichu.sprites.artwork).toBeTruthy();

    const megaVenusaur = byPokeApiSlug("venusaur-mega");
    expect(megaVenusaur.showdownName).toBe("Venusaur-Mega");
    expect(megaVenusaur.formType).toBe("mega");
    expect(megaVenusaur.speciesId).toBe("venusaur");
    expect(megaVenusaur.generation).toBe(6);
  });
});

describe("generated catalog presence", () => {
  it("reminds contributors to run the importer", () => {
    if (!catalogAvailable) {
      throw new Error("data/generated/catalog.json is missing. Run npm run import:data.");
    }
    expect(catalogAvailable).toBe(true);
  });
});
