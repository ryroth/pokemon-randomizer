import { describe, expect, it } from "vitest";
import { formatGuessedSpread, suggestEvSpread } from "@/lib/builder/suggestEvs";
import type { Nature } from "@/lib/types/catalog-entities";

describe("suggestEvSpread", () => {
  it("picks the Smogon analysis whose moves overlap this set", () => {
    const suggestion = suggestEvSpread("Venusaur", [
      "Growth",
      "Giga Drain",
      "Weather Ball",
      "Sludge Bomb",
    ]);

    expect(suggestion?.matchedMoves).toBe(4);
    expect(suggestion?.evs).toMatchObject({ spa: 252, spe: 252 });
    expect(suggestion?.format).toBe("ou");
    expect(suggestion?.nature).toBe("Timid");
  });

  it("formats the guess like a Showdown spread line", () => {
    const nature: Nature = {
      id: "jolly",
      pokeApiSlug: "jolly",
      name: "Jolly",
      showdownName: "Jolly",
      plusStat: "spe",
      minusStat: "spa",
    };
    expect(
      formatGuessedSpread(
        {
          pokemonName: "Garchomp",
          format: "ou",
          name: "Fast Physical Sweeper",
          evs: { hp: 4, atk: 252, spe: 252 },
          matchedMoves: 4,
        },
        nature,
      ),
    ).toBe("Fast Physical Sweeper: 4 HP / 252 Atk / 252 Spe / (+Spe, −SpA)");
  });

  it("returns nothing when the Pokémon has no matching analysis", () => {
    expect(suggestEvSpread("Venusaur", ["Tackle", "Growl", "Pound", "Scratch"])).toBeUndefined();
  });
});