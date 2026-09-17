import { Dex } from "@pkmn/dex";
import { describe, expect, it } from "vitest";
import {
  isCatalogItem,
  isCatalogMove,
  isCatalogSpecies,
  itemCategory,
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

  it("classifies holdable item categories", () => {
    expect(itemCategory(Dex.items.get("Leftovers"))).toBe("held");
    expect(itemCategory(Dex.items.get("Sitrus Berry"))).toBe("berry");
    expect(itemCategory(Dex.items.get("Venusaurite"))).toBe("mega-stone");
    expect(itemCategory(Dex.items.get("Firium Z"))).toBe("z-crystal");
  });
});
