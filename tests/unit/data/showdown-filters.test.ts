import { Dex } from "@pkmn/dex";
import { describe, expect, it } from "vitest";
import {
  isCatalogItem,
  isCatalogMove,
  isCatalogSpecies,
  itemKind,
  itemTeambuilderCategory,
} from "../../../scripts/import/showdown";

describe("Showdown catalog filters", () => {
  it("keeps mega, regional, and gigantamax formes and drops CAP", () => {
    expect(isCatalogSpecies(Dex.species.get("Venusaur-Mega"))).toBe(true);
    expect(isCatalogSpecies(Dex.species.get("Raichu-Alola"))).toBe(true);
    expect(isCatalogSpecies(Dex.species.get("Charizard-Gmax"))).toBe(true);
    expect(isCatalogSpecies(Dex.species.get("Syclant"))).toBe(false);
  });

  it("excludes Z-Moves, Max moves, and Poké Balls", () => {
    expect(isCatalogMove(Dex.moves.get("Catastropika"))).toBe(false);
    expect(isCatalogMove(Dex.moves.get("Max Strike"))).toBe(false);
    expect(isCatalogMove(Dex.moves.get("Thunderbolt"))).toBe(true);
    expect(isCatalogItem(Dex.items.get("Poke Ball"))).toBe(false);
    expect(isCatalogItem(Dex.items.get("Leftovers"))).toBe(true);
  });

  it("classifies holdable item kinds", () => {
    expect(itemKind(Dex.items.get("Leftovers"))).toBe("held");
    expect(itemKind(Dex.items.get("Sitrus Berry"))).toBe("berry");
    expect(itemKind(Dex.items.get("Venusaurite"))).toBe("mega-stone");
    expect(itemKind(Dex.items.get("Firium Z"))).toBe("z-crystal");
  });

  it("classifies Showdown teambuilder item categories", () => {
    expect(itemTeambuilderCategory(Dex.items.get("Leftovers"))).toBe("popular");
    expect(itemTeambuilderCategory(Dex.items.get("Sitrus Berry"))).toBe("items");
    expect(itemTeambuilderCategory(Dex.items.get("Thick Club"))).toBe("pokemon-specific");
    expect(itemTeambuilderCategory(Dex.items.get("Venusaurite"))).toBe("pokemon-specific");
    expect(itemTeambuilderCategory(Dex.items.get("Oran Berry"))).toBe("usually-useless");
    expect(itemTeambuilderCategory(Dex.items.get("Rare Bone"))).toBe("useless");
  });
});
