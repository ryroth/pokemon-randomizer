import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evolutionConflictContext, evolutionFormsConflict } from "@/lib/data/evolution";
import { generatedCatalogPath, loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import type { PokemonForm } from "@/lib/types/pokemon";
import { ITEM_CATEGORIES } from "@/lib/types/catalog-entities";

const catalogPath = generatedCatalogPath();
const catalogAvailable = existsSync(catalogPath);

describe.skipIf(!catalogAvailable)("generated catalog integrity", () => {
  const catalog = loadGeneratedCatalog();

  function byId(id: string): PokemonForm {
    const match = catalog.pokemon.find((pokemon) => pokemon.id === id);
    if (!match) {
      throw new Error(`Expected catalog Pokémon with id ${id}`);
    }
    return match;
  }

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
      expect(["held", "berry", "mega-stone", "z-crystal", "other"]).toContain(item.kind);
      expect(ITEM_CATEGORIES).toContain(item.category);
    }
    expect(catalog.items.find((item) => item.id === "leftovers")?.category).toBe("popular");
    expect(catalog.items.find((item) => item.id === "thickclub")?.category).toBe(
      "pokemon-specific",
    );
    for (const nature of catalog.natures) {
      expect(nature.pokeApiSlug).toBeTruthy();
      expect(nature.showdownName).toBeTruthy();
    }
  });

  it("keeps Pokémon ids unique by form", () => {
    const ids = catalog.pokemon.map((pokemon) => pokemon.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps ability ids unique and excludes noability", () => {
    const ids = catalog.abilities.map((ability) => ability.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("noability");
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

  it("stores later-stage battle evolutions without Mega or Gigantamax", () => {
    expect(byPokeApiSlug("charmander").evolutionTargetIds).toEqual(["charmeleon", "charizard"]);
    expect(byPokeApiSlug("charizard").evolutionTargetIds).toEqual([]);
    expect(byPokeApiSlug("pikachu").evolutionTargetIds).toEqual(["raichu", "raichualola"]);
    expect(byPokeApiSlug("silcoon").evolutionTargetIds).toEqual(["beautifly"]);
    expect(byPokeApiSlug("magikarp").evolutionTargetIds).toEqual(["gyarados"]);
    expect(byPokeApiSlug("kadabra").evolutionTargetIds).toEqual(["alakazam"]);
  });

  it("treats Honedge, Doublade, and Aegislash as one overlapping path", () => {
    const context = evolutionConflictContext(catalog.pokemon);
    const honedge = byId("honedge");
    const doublade = byId("doublade");
    const aegislash = byId("aegislash");

    expect(evolutionFormsConflict(honedge, doublade, context)).toBe(true);
    expect(evolutionFormsConflict(honedge, aegislash, context)).toBe(true);
    expect(evolutionFormsConflict(doublade, aegislash, context)).toBe(true);
  });

  it("allows Wurmple split branches to coexist without the shared ancestor", () => {
    const context = evolutionConflictContext(catalog.pokemon);
    const wurmple = byId("wurmple");
    const silcoon = byId("silcoon");
    const cascoon = byId("cascoon");
    const beautifly = byId("beautifly");
    const dustox = byId("dustox");

    expect(evolutionFormsConflict(wurmple, cascoon, context)).toBe(true);
    expect(evolutionFormsConflict(cascoon, dustox, context)).toBe(true);
    expect(evolutionFormsConflict(cascoon, silcoon, context)).toBe(false);
    expect(evolutionFormsConflict(cascoon, beautifly, context)).toBe(false);
  });

  it("stores numeric ability, move, and item effects, and latest Pokédex flavor", () => {
    expect(catalog.abilities.find((ability) => ability.id === "blaze")?.description).toBe(
      "Strengthens Fire moves to inflict 1.5× damage at 1/3 max HP or less.",
    );
    expect(catalog.abilities.find((ability) => ability.id === "punkrock")?.description).toMatch(
      /1\.3x/i,
    );
    expect(catalog.moves.find((move) => move.id === "ember")?.description).toBe(
      "10% chance to burn the target.",
    );
    expect(catalog.items.find((item) => item.id === "metalcoat")?.description).toBe(
      "Held: Steel-Type moves from holder do 20% more damage.",
    );
    expect(catalog.items.find((item) => item.id === "leftovers")?.description).toMatch(/1\/16/);
    expect(byId("bulbasaur").dexEntries[0]?.text).toBe(
      "While it is young, it uses the nutrients that are stored in the seed on its back in order to grow.",
    );
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
