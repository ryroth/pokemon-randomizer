import { describe, expect, it } from "vitest";
import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { buildRecapEntry } from "@/lib/recap/entries";
import { exportShowdownTeam } from "@/lib/showdown/exportSet";
import { previewShowdownImport, type ImportedSetResult } from "@/lib/showdown/importTeam";
import { parseShowdownText } from "@/lib/showdown/parseSet";
import type { PokemonSet } from "@/lib/types/session";

const catalog = loadGeneratedCatalog();

const SWAMPERT_PASTE = [
  "Mud (Swampert) (M) @ Leftovers",
  "Ability: Torrent",
  "Level: 50",
  "Shiny: Yes",
  "Happiness: 100",
  "Tera Type: Water",
  "EVs: 252 HP / 252 Atk / 4 SpD",
  "Adamant Nature",
  "IVs: 0 SpA",
  "- Stealth Rock",
  "- Flip Turn",
  "- Earthquake",
  "- Knock Off",
].join("\n");

function only(text: string): ImportedSetResult {
  const preview = previewShowdownImport(text, catalog);
  if (!preview.ok) {
    throw new Error(preview.message);
  }
  expect(preview.results).toHaveLength(1);
  return preview.results[0] as ImportedSetResult;
}

describe("parseShowdownText", () => {
  it("reads every line of a full set", () => {
    const [set] = parseShowdownText(SWAMPERT_PASTE);
    expect(set).toMatchObject({
      nickname: "Mud",
      species: "Swampert",
      gender: "M",
      item: "Leftovers",
      ability: "Torrent",
      level: 50,
      shiny: true,
      happiness: 100,
      teraType: "Water",
      evs: { hp: 252, atk: 252, spd: 4 },
      ivs: { spa: 0 },
      nature: "Adamant",
      moves: ["Stealth Rock", "Flip Turn", "Earthquake", "Knock Off"],
      problems: [],
    });
  });

  it("handles a bare species, gender only, and no item", () => {
    const sets = parseShowdownText("Swampert\nAbility: Damp\n\nSwampert (F)\n\nMr. Mime @ Focus Sash");
    expect(sets.map((set) => set.species)).toEqual(["Swampert", "Swampert", "Mr. Mime"]);
    expect(sets[0]?.nickname).toBeUndefined();
    expect(sets[1]?.gender).toBe("F");
    expect(sets[2]?.item).toBe("Focus Sash");
  });

  it("splits sets on blank lines, skips folder lines, and accepts Windows line breaks", () => {
    const text = "=== [gen9ou] Folder/Team ===\r\n\r\nSwampert\r\n- Earthquake\r\n\r\n\r\nGengar\r\n- Shadow Ball\r\n";
    const sets = parseShowdownText(text);
    expect(sets).toHaveLength(2);
    expect(sets.map((set) => set.position)).toEqual([1, 2]);
    expect(sets[1]?.moves).toEqual(["Shadow Ball"]);
  });

  it("accepts stat aliases and reports lines it cannot read", () => {
    const [set] = parseShowdownText("Swampert\nEVs: 100 Atk / 100 SAtk / 100 SDef / 8 Spe / 12 Bogus\nLevel: fifty\nWhat is this");
    expect(set?.evs).toEqual({ atk: 100, spa: 100, spd: 100, spe: 8 });
    expect(set?.problems).toHaveLength(3);
    expect(set?.problems.join(" ")).toContain('"12 Bogus"');
    expect(set?.problems.join(" ")).toContain("fifty");
    expect(set?.problems.join(" ")).toContain("What is this");
  });
});

describe("previewShowdownImport", () => {
  it("builds a finished set with the Showdown defaults for what is left out", () => {
    const result = only(
      ["Garchomp (F)", "Ability: Rough Skin", "Tera Type: Dragon", "Jolly Nature", "- Earthquake", "- Outrage", "- Swords Dance", "- Stealth Rock"].join("\n"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.set).toMatchObject({
      pokemonId: "garchomp",
      itemId: null,
      abilityId: "roughskin",
      natureId: "jolly",
      teraType: "dragon",
      gender: "F",
      level: 100,
      shiny: false,
      happiness: 255,
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    });
    expect(result.set.moveIds).toEqual(["earthquake", "outrage", "swordsdance", "stealthrock"]);
  });

  it("round-trips the app's own export", () => {
    const original: PokemonSet = {
      pokemonId: "swampert",
      itemId: "leftovers",
      abilityId: "torrent",
      moveIds: ["stealthrock", "flipturn", "earthquake", "knockoff"],
      evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 0, spd: 31, spe: 31 },
      natureId: "adamant",
      teraType: "water",
      gender: "M",
      level: 50,
      shiny: true,
      nickname: "Mud",
      happiness: 100,
    };
    const entry = buildRecapEntry(original, catalog);
    expect(entry).not.toBeNull();
    const text = exportShowdownTeam([entry?.showdownText ?? ""]);
    expect(text).toContain("Mud (Swampert) (M) @ Leftovers");

    const result = only(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.set).toEqual(original);
    }
    expect(only(SWAMPERT_PASTE)).toMatchObject({ ok: true, label: "Mud (Swampert)" });
  });

  it("looks up forms and punctuation the way Showdown does", () => {
    const result = only(
      ["Urshifu-Rapid-Strike (M) @ Choice Band", "Ability: Unseen Fist", "Tera Type: Water", "Jolly Nature", "- Surging Strikes", "- Close Combat", "- U-turn", "- Aqua Jet"].join("\n"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.set.pokemonId).toBe("urshifurapidstrike");
      expect(result.set.itemId).toBe("choiceband");
    }
  });

  it("lists everything the app will not fill in on its own", () => {
    const result = only("Swampert\n- Earthquake");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const text = result.problems.join("\n");
      expect(text).toContain("Ability");
      expect(text).toContain("Nature");
      expect(text).toContain("Tera Type");
      expect(text).toContain("(M) or (F)");
      expect(text).toContain("exactly 4 moves");
    }
  });

  it("reports names it does not know and abilities the Pokémon cannot have", () => {
    const unknown = only(
      ["Notamon", "Ability: Torrent", "Tera Type: Water", "Adamant Nature", "- Earthquake", "- Outrage", "- Surf", "- Bogus Move"].join("\n"),
    );
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.problems.join("\n")).toContain('"Notamon"');
      expect(unknown.problems.join("\n")).toContain('"Bogus Move"');
    }

    const wrongAbility = only(
      ["Swampert (M)", "Ability: Levitate", "Tera Type: Water", "Adamant Nature", "- Earthquake", "- Surf", "- Waterfall", "- Protect"].join("\n"),
    );
    expect(wrongAbility.ok).toBe(false);
    if (!wrongAbility.ok) {
      expect(wrongAbility.problems.join("\n")).toContain("cannot have the ability");
    }

    const badTera = only(
      ["Swampert (M)", "Ability: Torrent", "Tera Type: Sound", "Adamant Nature", "- Earthquake", "- Surf", "- Waterfall", "- Protect"].join("\n"),
    );
    expect(badTera.ok).toBe(false);
  });

  it("keeps the EV rules of the builder", () => {
    const result = only(SWAMPERT_PASTE.replace("EVs: 252 HP / 252 Atk / 4 SpD", "EVs: 252 HP / 252 Atk / 6 SpD"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems.join(" ")).toContain("maximum is 508");
    }
  });

  it("gives plain messages for empty, huge, and oversized pastes", () => {
    expect(previewShowdownImport("   ", catalog)).toEqual({ ok: false, message: "Paste a Pokémon Showdown team first." });
    const huge = previewShowdownImport("x".repeat(20_001), catalog);
    expect(huge.ok).toBe(false);
    const seven = previewShowdownImport(Array.from({ length: 7 }, () => "Swampert").join("\n\n"), catalog);
    expect(seven).toMatchObject({ ok: false });
    expect(seven.ok === false && seven.message).toContain("7 Pokémon");
  });

  it("reports each set on its own, keeping the good ones", () => {
    const preview = previewShowdownImport(`${SWAMPERT_PASTE}\n\nNotamon`, catalog);
    expect(preview.ok && preview.results.map((result) => result.ok)).toEqual([true, false]);
  });
});
