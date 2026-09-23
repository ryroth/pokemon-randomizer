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
import { mechanicalDescription, officialEnglishFlavor, uniqueEnglishFlavor } from "../../../scripts/import/text";

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

  it("orders unique English flavor newest-first using PokéAPI version ids", () => {
    expect(
      uniqueEnglishFlavor([
        {
          flavor_text: "A strange seed was planted on its back at birth.",
          language: { name: "en" },
          version: { name: "red", url: "https://pokeapi.co/api/v2/version/1/" },
        },
        {
          flavor_text:
            "While it is young, it uses the nutrients that are stored in the seed on its back in order to grow.",
          language: { name: "en" },
          version: { name: "shield", url: "https://pokeapi.co/api/v2/version/34/" },
        },
      ]),
    ).toEqual([
      {
        version: "shield",
        text: "While it is young, it uses the nutrients that are stored in the seed on its back in order to grow.",
      },
      {
        version: "red",
        text: "A strange seed was planted on its back at birth.",
      },
    ]);
  });

  it("reads item flavor from PokéAPI `text` and never uses a paraphrase fallback", () => {
    const entries = [
      {
        text: "A hold item that\ngradually restores\nHP in battle.",
        language: { name: "en" },
        version_group: {
          name: "ruby-sapphire",
          url: "https://pokeapi.co/api/v2/version-group/5/",
        },
      },
      {
        text: "An item to be held by a Pokémon. The holder’s HP is slowly but steadily restored throughout every battle.",
        language: { name: "en" },
        version_group: {
          name: "sword-shield",
          url: "https://pokeapi.co/api/v2/version-group/20/",
        },
      },
    ];
    expect(officialEnglishFlavor(entries)).toBe(
      "An item to be held by a Pokémon. The holder’s HP is slowly but steadily restored throughout every battle.",
    );
    expect(officialEnglishFlavor(undefined)).toBe("");
  });

  it("prefers PokéAPI effect numbers, then Showdown mechanics, over flavor", () => {
    expect(
      mechanicalDescription({
        effectEntries: [
          {
            short_effect: "Held: Steel-Type moves from holder do 20% more damage.",
            effect: "Held: Increases the power of the holder’s Steel moves by 20%.",
            language: { name: "en" },
          },
        ],
        showdownShortDesc: "Holder's Steel-type attacks have 1.2x power.",
        flavorEntries: [
          {
            text: "An item to be held by a Pokémon. It is a special metallic film that can boost the power of Steel-type moves.",
            language: { name: "en" },
          },
        ],
      }),
    ).toBe("Held: Steel-Type moves from holder do 20% more damage.");

    expect(
      mechanicalDescription({
        effectEntries: [
          {
            short_effect: "Boosts sound-based moves and halves damage from the same moves.",
            effect: "Boosts the power of sound-based moves. The Pokémon also takes half the damage from these kinds of moves.",
            language: { name: "en" },
          },
        ],
        showdownShortDesc: "This Pokemon receives 1/2 damage from sound moves. Its own have 1.3x power.",
        flavorEntries: [
          {
            flavor_text: "Boosts the power of sound-based moves. The Pokémon also takes half the damage from these kinds of moves.",
            language: { name: "en" },
          },
        ],
      }),
    ).toBe("This Pokemon receives 1/2 damage from sound moves. Its own have 1.3x power.");

    expect(
      mechanicalDescription({
        flavorEntries: [
          {
            flavor_text: "By floating in the air, the Pokémon receives full immunity to all Ground-type moves.",
            language: { name: "en" },
          },
        ],
      }),
    ).toBe("By floating in the air, the Pokémon receives full immunity to all Ground-type moves.");
  });
});
