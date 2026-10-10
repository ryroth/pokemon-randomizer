import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEX_VERSIONS,
  dexEntryGroupFromStored,
  dexVersionOrder,
  formatDexVersions,
  type StoredDexEntryGroup,
} from "@/lib/data/dexVersions";
import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { englishFlavorByGeneration } from "../../../scripts/import/text";

function flavor(version: string, text: string, language = "en") {
  return { flavor_text: text, language: { name: language }, version: { name: version } };
}

describe("dex versions", () => {
  it("lists every game once, in release order, with generations that never go backwards", () => {
    const ids = DEX_VERSIONS.map((version) => version.id);
    expect(new Set(ids).size).toBe(ids.length);
    const generations = DEX_VERSIONS.map((version) => version.generation);
    expect(generations).toEqual([...generations].sort((a, b) => a - b));
    expect(dexVersionOrder("red")).toBeLessThan(dexVersionOrder("scarlet"));
    expect(dexVersionOrder("not-a-game")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("names games for people", () => {
    expect(formatDexVersions(["ruby", "sapphire"])).toBe("Ruby, Sapphire");
    expect(formatDexVersions(["lets-go-pikachu"])).toBe("Let's Go, Pikachu!");
    expect(formatDexVersions(["mystery"])).toBe("mystery");
  });
});

describe("englishFlavorByGeneration", () => {
  it("groups games in a generation that print the same words", () => {
    const { groups } = englishFlavorByGeneration([
      flavor("sapphire", "Same words."),
      flavor("ruby", "Same words."),
      flavor("emerald", "Different words."),
    ]);
    expect(groups).toEqual([
      { generation: 3, versions: ["ruby", "sapphire"], text: "Same words." },
      { generation: 3, versions: ["emerald"], text: "Different words." },
    ]);
  });

  it("keeps the same words from different generations as separate entries", () => {
    const { groups } = englishFlavorByGeneration([
      flavor("gold", "A familiar line."),
      flavor("red", "A familiar line."),
    ]);
    expect(groups.map((group) => [group.generation, group.versions])).toEqual([
      [1, ["red"]],
      [2, ["gold"]],
    ]);
  });

  it("orders entries from the oldest game to the newest", () => {
    const { groups } = englishFlavorByGeneration([
      flavor("scarlet", "Newest."),
      flavor("red", "Oldest."),
      flavor("x", "Middle."),
    ]);
    expect(groups.map((group) => group.text)).toEqual(["Oldest.", "Middle.", "Newest."]);
  });

  it("ignores other languages and blank text, and reports games it does not know", () => {
    const { groups, unknownVersions } = englishFlavorByGeneration([
      flavor("red", "Texto en español.", "es"),
      flavor("blue", "   "),
      flavor("future-game", "From a game that is not listed."),
      flavor("yellow", "Kept."),
    ]);
    expect(groups.map((group) => group.text)).toEqual(["Kept."]);
    expect(unknownVersions).toEqual(["future-game"]);
  });

  it("returns nothing for a species with no entries", () => {
    expect(englishFlavorByGeneration(undefined)).toEqual({ groups: [], unknownVersions: [] });
  });
});

describe("generated dex-entries.json", () => {
  const stored = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "generated", "dex-entries.json"), "utf8"),
  ) as Record<string, StoredDexEntryGroup[]>;
  const catalog = loadGeneratedCatalog();

  it("has entries for every species in the catalog", () => {
    const speciesIds = new Set(catalog.pokemon.map((form) => form.speciesId));
    for (const speciesId of speciesIds) {
      expect(stored[speciesId]?.length ?? 0, speciesId).toBeGreaterThan(0);
    }
  });

  it("keeps every text the catalog already shows", () => {
    for (const form of catalog.pokemon) {
      const texts = new Set((stored[form.speciesId] ?? []).map((entry) => entry[2]));
      for (const entry of form.dexEntries) {
        expect(texts.has(entry.text), `${form.id}: ${entry.text.slice(0, 40)}`).toBe(true);
      }
    }
  });

  it("includes Bulbasaur's Generation 1 text next to its newest text", () => {
    const entries = (stored.bulbasaur ?? []).map(dexEntryGroupFromStored);
    const generations = entries.map((entry) => entry.generation);
    expect(generations[0]).toBe(1);
    expect(Math.max(...generations)).toBeGreaterThanOrEqual(8);
    expect(entries[0]?.versions).toEqual(["red", "blue"]);
    expect(generations).toEqual([...generations].sort((a, b) => a - b));
  });
});
