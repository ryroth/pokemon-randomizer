import { describe, expect, it } from "vitest";
import { createInitialSession } from "@/lib/randomizer/session";
import { parseStoredSession } from "@/lib/session/storage";
import {
  describeShownCardFacts,
  extremeStatLabels,
  pokemonNameAliases,
  redactPokemonNames,
  typesToShow,
  usesFullGeneratedCard,
} from "@/lib/randomizer/cardFacts";
import { stableIndex } from "@/lib/randomizer/randomUtils";
import { CARD_FACTS } from "@/lib/types/card-facts";
import type { StatSpread } from "@/lib/types/stats";

const tied: StatSpread = { hp: 10, atk: 80, def: 10, spa: 80, spd: 10, spe: 40 };

describe("generated card facts", () => {
  it("names each extreme stat with its number, including ties", () => {
    expect(extremeStatLabels(tied, "high")).toBe("Attack 80 and Special Attack 80");
    expect(extremeStatLabels(tied, "low")).toBe("HP 10, Defense 10, and Special Defense 10");
    expect(extremeStatLabels({ hp: 40, atk: 10, def: 20, spa: 30, spd: 20, spe: 50 }, "high")).toBe(
      "Speed 50",
    );
    expect(extremeStatLabels({ hp: 40, atk: 10, def: 20, spa: 30, spd: 20, spe: 50 }, "low")).toBe(
      "Attack 10",
    );
  });

  it("shows every type once unless only one slot is chosen", () => {
    expect(typesToShow(["water", "flying"], CARD_FACTS)).toEqual(["water", "flying"]);
    expect(typesToShow(["water", "flying"], ["primaryType", "secondaryType"])).toEqual([
      "water",
      "flying",
    ]);
    expect(typesToShow(["water", "flying"], ["bothTypes"])).toEqual(["water", "flying"]);
    expect(typesToShow(["water", "flying"], ["primaryType"])).toEqual(["water"]);
    expect(typesToShow(["water", "flying"], ["secondaryType"])).toEqual(["flying"]);
    expect(typesToShow(["normal"], ["secondaryType"])).toEqual([]);
  });

  it("keeps a partial card until that generation has a selection", () => {
    expect(usesFullGeneratedCard(CARD_FACTS, false)).toBe(true);
    expect(usesFullGeneratedCard(["dexNumber"], false)).toBe(false);
    expect(usesFullGeneratedCard(["dexNumber"], true)).toBe(true);
    expect(usesFullGeneratedCard([], true)).toBe(true);
  });

  it("describes a full card as everything and a short hide list by what is off", () => {
    expect(describeShownCardFacts(CARD_FACTS)).toBe("Everything");
    expect(describeShownCardFacts([])).toBe("Nothing");
    expect(describeShownCardFacts(CARD_FACTS.filter((fact) => fact !== "cry"))).toBe(
      "Everything except Cry",
    );
  });

  it("replaces the Pokémon's name, including a form's species name, with This Pokemon", () => {
    expect(pokemonNameAliases("Weezing-Galar")).toEqual(["Weezing-Galar", "Weezing"]);
    expect(pokemonNameAliases("Ho-Oh")).toEqual(["Ho-Oh"]);
    expect(pokemonNameAliases("Charizard-Mega-X")).toEqual([
      "Charizard-Mega-X",
      "Charizard-Mega",
      "Charizard",
    ]);
    expect(redactPokemonNames("Weezing-Galar loves Weezing.", pokemonNameAliases("Weezing-Galar"))).toBe(
      "This Pokemon loves This Pokemon.",
    );
    expect(redactPokemonNames("Machop's punch", ["Machop"])).toBe("This Pokemon's punch");
    expect(redactPokemonNames("a machop waits", ["Machop"])).toBe("a This Pokemon waits");
    expect(redactPokemonNames("Pikachutwo", ["Pikachu"])).toBe("Pikachutwo");
    expect(redactPokemonNames("Mr. Mime waves", ["Mr. Mime"])).toBe("This Pokemon waves");
    expect(redactPokemonNames("Ho-Oh soars", pokemonNameAliases("Ho-Oh"))).toBe("This Pokemon soars");
  });

  it("picks the same Pokédex entry every time for one species", () => {
    expect(stableIndex("pokedex-entry:machop", 8)).toBe(stableIndex("pokedex-entry:machop", 8));
    expect(stableIndex("pokedex-entry:machop", 0)).toBe(0);
  });

  it("fills card facts for a session saved before the list existed", () => {
    const session = createInitialSession();
    const { shownCardFacts: _removed, ...oldConfig } = session.config;
    void _removed;
    const restored = parseStoredSession(JSON.stringify({ ...session, config: oldConfig }));
    expect(restored?.config.shownCardFacts).toEqual([...CARD_FACTS]);

    const hidden = parseStoredSession(
      JSON.stringify({ ...session, config: { ...oldConfig, showPokedexEntry: false } }),
    );
    expect(hidden?.config.shownCardFacts).not.toContain("pokedexEntry");
    expect(hidden?.config.showPokedexEntry).toBe(false);
  });
});
