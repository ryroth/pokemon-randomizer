import { describe, expect, it } from "vitest";
import {
  genderRuleFromRate,
  generationFromPokeApi,
  parseMoveCategory,
  parsePokemonType,
  pokeApiSlugToShowdownId,
  pokeApiStatToId,
  showdownNameToPokeApiSlugs,
  toPokeApiKebab,
  toShowdownId,
} from "../../../scripts/import/mapping";
import { uniqueEnglishFlavor } from "../../../scripts/import/text";

describe("showdown / PokéAPI name mapping", () => {
  it("maps hyphenated PokéAPI slugs onto Showdown ids", () => {
    expect(toShowdownId("venusaur-mega")).toBe("venusaurmega");
    expect(toShowdownId("raichu-alola")).toBe("raichualola");
    expect(toShowdownId("walking-wake")).toBe("walkingwake");
    expect(toShowdownId("kommo-o")).toBe("kommoo");
  });

  it("kebabs Showdown teambuilder names into PokéAPI slugs", () => {
    expect(toPokeApiKebab("Raichu-Alola")).toBe("raichu-alola");
    expect(toPokeApiKebab("Mr. Mime")).toBe("mr-mime");
    expect(toPokeApiKebab("Type: Null")).toBe("type-null");
    expect(toPokeApiKebab("Walking Wake")).toBe("walking-wake");
    expect(toPokeApiKebab("Zygarde-10%")).toBe("zygarde-10");
  });

  it("uses known aliases before falling back to kebabs", () => {
    expect(
      showdownNameToPokeApiSlugs({
        id: "meowstic",
        name: "Meowstic",
        forme: "",
        baseSpecies: "Meowstic",
      })[0],
    ).toBe("meowstic-male");
    expect(
      showdownNameToPokeApiSlugs({
        id: "ogerponwellspring",
        name: "Ogerpon-Wellspring",
        forme: "Wellspring",
        baseSpecies: "Ogerpon",
      })[0],
    ).toBe("ogerpon-wellspring-mask");
    expect(
      showdownNameToPokeApiSlugs({
        id: "taurospaldeacombat",
        name: "Tauros-Paldea-Combat",
        forme: "Paldea-Combat",
        baseSpecies: "Tauros",
      })[0],
    ).toBe("tauros-paldea-combat-breed");
  });

  it("normalizes gendered PokéAPI slugs for unmatched reports", () => {
    expect(pokeApiSlugToShowdownId("meowstic-female")).toBe("meowsticf");
    expect(pokeApiSlugToShowdownId("ogerpon-wellspring-mask")).toBe("ogerponwellspring");
  });
});

describe("pokeapi field parsing", () => {
  it("maps gender rates onto catalog rules", () => {
    expect(genderRuleFromRate(-1)).toBe("genderless");
    expect(genderRuleFromRate(0)).toBe("male");
    expect(genderRuleFromRate(8)).toBe("female");
    expect(genderRuleFromRate(4)).toBe("mixed");
  });

  it("maps generation slugs, stats, types, and move categories", () => {
    expect(generationFromPokeApi("generation-vii")).toBe(7);
    expect(pokeApiStatToId("special-attack")).toBe("spa");
    expect(parsePokemonType("Fairy")).toBe("fairy");
    expect(parsePokemonType("stellar")).toBeNull();
    expect(parseMoveCategory("Physical")).toBe("physical");
  });

  it("dedupes English flavor text and strips control characters", () => {
    expect(
      uniqueEnglishFlavor([
        {
          flavor_text: "Line one.\fLine two.",
          language: { name: "en" },
          version: { name: "red" },
        },
        {
          flavor_text: "Line one. Line two.",
          language: { name: "en" },
          version: { name: "blue" },
        },
        {
          flavor_text: "Otra línea.",
          language: { name: "es" },
          version: { name: "red" },
        },
      ]),
    ).toEqual([{ version: "red", text: "Line one. Line two." }]);
  });
});
