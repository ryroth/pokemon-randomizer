import { describe, expect, it } from "vitest";
import { damageAtRoll, strikeDamage, createBattleSnapshot, type BattleCombatant } from "@/lib/battle/damage";
import { prepareBattle, validateTeamAgainstFormat } from "@/lib/battle/prepare";
import {
  customizeFormat,
  deleteFormat,
  duplicateFormat,
  emptyLibrary,
  formatChanges,
  parentDrift,
  resetFormatField,
  restorePreviousFormat,
  saveFormat,
} from "@/lib/formats/library";
import { listPresets, presetById } from "@/lib/formats/presets";
import { formatRevision, rulesThisAppChecks } from "@/lib/formats/schema";
import { parseFormatLibrary, serializeFormatLibrary } from "@/lib/formats/storage";
import { validateFormat } from "@/lib/formats/validate";
import { validateCustomBaseStats, validateCustomTypes } from "@/lib/pokemon/customAttributes";
import { customAttributeNote, exportShowdownSet } from "@/lib/showdown/exportSet";
import type { PokemonSet } from "@/lib/types/session";
import { EMPTY_EVS, PERFECT_IVS, type StatSpread } from "@/lib/types/stats";

const base = (hp: number, atk: number, def: number, spa: number, spd: number, spe: number): StatSpread => ({
  hp,
  atk,
  def,
  spa,
  spd,
  spe,
});

function combatant(partial: Partial<BattleCombatant> & Pick<BattleCombatant, "types" | "baseStats">): BattleCombatant {
  return {
    speciesId: "species",
    speciesName: "Test",
    level: 100,
    ivs: { ...PERFECT_IVS },
    evs: { ...EMPTY_EVS },
    plusStat: null,
    minusStat: null,
    ...partial,
  };
}

function finishedSet(partial: Partial<PokemonSet> = {}): PokemonSet {
  return {
    pokemonId: "pikachu",
    itemId: null,
    abilityId: "static",
    moveIds: ["thunderbolt"],
    evs: { ...EMPTY_EVS },
    ivs: { ...PERFECT_IVS },
    natureId: "hardy",
    teraType: "electric",
    gender: null,
    level: 50,
    shiny: false,
    happiness: 255,
    ...partial,
  };
}

describe("format presets", () => {
  it("keeps every built-in preset valid and locked", () => {
    for (const format of listPresets()) {
      expect(validateFormat(format), format.id).toEqual([]);
      expect(format.locked).toBe(true);
      expect(format.support.aiBattle).toBe(false);
      expect(format.shinyPolicy).toBe("allowed");
    }
  });

  it("copies a preset without changing the original", () => {
    const ou = presetById("gen9ou");
    expect(ou).toBeDefined();
    if (!ou) {
      return;
    }
    const copy = customizeFormat(ou);
    copy.typePolicy = "custom";
    copy.statPolicy = "custom";
    copy.shinyPolicy = "allowed";
    expect(ou.typePolicy).toBe("species");
    expect(ou.statPolicy).toBe("species");
    expect(copy.parentId).toBe("gen9ou");
    expect(copy.parentRevision).toBe(formatRevision(ou));
    expect(copy.locked).toBe(false);
    expect(formatChanges(copy, ou).map((change) => change.field)).toEqual(["typePolicy", "statPolicy"]);
  });

  it("saves, renames, duplicates, restores, and deletes a user format", () => {
    const ou = presetById("gen9ou");
    expect(ou).toBeDefined();
    if (!ou) {
      return;
    }
    const saved = saveFormat(emptyLibrary(), customizeFormat(ou));
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(presetById("gen9ou")?.typePolicy).toBe("species");
    const renamed = saveFormat(saved.library, { ...saved.format, name: "My OU", typePolicy: "custom" });
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) {
      return;
    }
    expect(renamed.format.name).toBe("My OU");
    expect(renamed.library.records[0]?.previous?.typePolicy).toBe("species");
    const restored = restorePreviousFormat(renamed.library, renamed.format.id);
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(restored.format.typePolicy).toBe("species");
    const duplicated = duplicateFormat(restored.library, restored.format.id);
    expect(duplicated.ok).toBe(true);
    if (!duplicated.ok) {
      return;
    }
    expect(duplicated.library.records).toHaveLength(2);
    const afterDelete = deleteFormat(duplicated.library, "gen9ou");
    expect(afterDelete.records).toHaveLength(2);
    expect(deleteFormat(afterDelete, duplicated.format.id).records).toHaveLength(1);
  });

  it("rejects a stat budget when custom stats are off", () => {
    const ou = presetById("gen9ou");
    expect(ou).toBeDefined();
    if (!ou) {
      return;
    }
    const errors = validateFormat({ ...ou, statBudget: 500, locked: false, origin: "user" });
    expect(errors.some((error) => error.field === "statBudget")).toBe(true);
  });

  it("resets one field and reports a parent that changed after the copy was saved", () => {
    const ou = presetById("gen9ou");
    expect(ou).toBeDefined();
    if (!ou) {
      return;
    }
    const copy = customizeFormat(ou);
    copy.speciesClause = false;
    const reset = resetFormatField(copy, ou, "speciesClause");
    expect(reset.speciesClause).toBe(true);
    const drifted = { ...copy, parentRevision: "stale" };
    expect(parentDrift(drifted, emptyLibrary())).toMatch(/has changed/);
  });

  it("keeps an unreadable saved record instead of dropping it on the next save", () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      records: [{ current: { schemaVersion: 99, id: "future" } }],
      preserved: [],
    });
    const library = parseFormatLibrary(raw);
    expect(library.records).toEqual([]);
    expect(library.preserved).toHaveLength(1);
    const ou = presetById("open-lab");
    expect(ou).toBeDefined();
    if (!ou) {
      return;
    }
    const saved = saveFormat(library, customizeFormat(ou));
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    const again = parseFormatLibrary(serializeFormatLibrary(saved.library));
    expect(again.records).toHaveLength(1);
    expect(again.preserved).toHaveLength(1);
  });
});

describe("custom attributes", () => {
  it("rejects a duplicated type and a stat outside the format limits", () => {
    expect(validateCustomTypes(["fire", "fire"]).ok).toBe(false);
    expect(validateCustomTypes(["water"]).ok).toBe(true);
    expect(validateCustomTypes(["fire", "water"]).ok).toBe(true);
    const overBudget = validateCustomBaseStats(base(100, 100, 100, 100, 100, 100), {
      min: 1,
      max: 255,
      budget: 500,
    });
    expect(overBudget.ok).toBe(false);
    expect(validateCustomBaseStats(base(1.5, 1, 1, 1, 1, 1)).ok).toBe(false);
  });
});

describe("team checks", () => {
  it("allows a shiny Pokémon on OU and refuses custom types until the format allows them", () => {
    const ou = presetById("gen9ou");
    const lab = presetById("open-lab");
    expect(ou && lab).toBeTruthy();
    if (!ou || !lab) {
      return;
    }
    const shiny = finishedSet({ shiny: true });
    expect(validateTeamAgainstFormat([shiny], ou, (id) => id)).toEqual([]);
    const custom = finishedSet({ customTypes: ["water"] });
    expect(validateTeamAgainstFormat([custom], ou, (id) => id).some((error) => error.code === "team.types")).toBe(
      true,
    );
    expect(validateTeamAgainstFormat([custom], lab, (id) => id)).toEqual([]);
  });

  it("treats shiny availability separately from a forbidden challenge rule", () => {
    const lab = presetById("open-lab");
    expect(lab).toBeDefined();
    if (!lab) {
      return;
    }
    const banned = { ...lab, shinyPolicy: "forbidden" as const, locked: false, origin: "user" as const };
    const issues = validateTeamAgainstFormat([finishedSet({ shiny: true })], banned, (id) => id);
    expect(issues.some((error) => error.code === "team.shiny")).toBe(true);
  });

  it("blocks two forms of one species when Species Clause is on", () => {
    const ou = presetById("gen9ou");
    expect(ou).toBeDefined();
    if (!ou) {
      return;
    }
    const issues = validateTeamAgainstFormat(
      [finishedSet({ pokemonId: "pikachu" }), finishedSet({ pokemonId: "pikachu-gmax" })],
      ou,
      () => "pikachu",
    );
    expect(issues.some((error) => error.code === "team.species")).toBe(true);
  });
});

describe("generation 9 damage", () => {
  const attacker = combatant({
    speciesName: "Charizard",
    types: ["fire", "flying"],
    baseStats: base(78, 84, 78, 109, 85, 100),
  });
  const defender = combatant({
    speciesName: "Venusaur",
    types: ["grass", "poison"],
    baseStats: base(80, 82, 83, 100, 100, 80),
  });
  const flamethrower = { name: "Flamethrower", type: "fire" as const, category: "special" as const, power: 90 };

  it("applies same-type bonus and a grass weakness for a fire attack", () => {
    const snapshot = createBattleSnapshot("one", "gen9ou", attacker, defender);
    const result = strikeDamage(snapshot, flamethrower);
    expect("error" in result).toBe(false);
    if ("error" in result) {
      return;
    }
    expect(result.stab).toBe(true);
    expect(result.effectiveness).toBe(2);
    expect(result.maxDamage).toBe(248);
    expect(result.minDamage).toBe(210);
  });

  it("multiplies a critical hit by 1.5 before the damage roll", () => {
    const snapshot = createBattleSnapshot("crit", "gen9ou", attacker, defender);
    const result = strikeDamage(snapshot, flamethrower);
    if ("error" in result) {
      throw new Error(result.error);
    }
    const shared = {
      attacker,
      move: flamethrower,
      attack: result.attackStat,
      defense: result.defenseStat,
      roll: 0,
      effectiveness: 2,
      stab: true,
    };
    expect(damageAtRoll(shared)).toBe(248);
    expect(damageAtRoll({ ...shared, crit: true })).toBeGreaterThan(248);
  });

  it("deals no damage when the defender is immune", () => {
    const ground = combatant({
      speciesName: "Sandshrew",
      types: ["ground"],
      baseStats: base(50, 75, 85, 20, 30, 40),
    });
    const electric = combatant({
      speciesName: "Pikachu",
      types: ["electric"],
      baseStats: base(35, 55, 40, 50, 50, 90),
    });
    const result = strikeDamage(
      createBattleSnapshot("immune", "gen9ou", electric, ground),
      { name: "Thunderbolt", type: "electric", category: "special", power: 90 },
    );
    expect(result).toMatchObject({ immune: true, maxDamage: 0, minDamage: 0 });
  });

  it("uses custom typing and custom stats without changing the species or another battle", () => {
    const speciesTypes: BattleCombatant["types"] = ["electric"];
    const speciesStats = base(35, 55, 40, 50, 50, 90);
    const pikachu = combatant({
      speciesId: "pikachu",
      speciesName: "Pikachu",
      types: speciesTypes,
      baseStats: speciesStats,
    });
    const sand = combatant({
      speciesName: "Sandshrew",
      types: ["ground"],
      baseStats: base(50, 75, 85, 20, 30, 40),
    });
    const waterPikachu = combatant({
      ...pikachu,
      types: ["water"],
      baseStats: base(35, 55, 40, 120, 50, 90),
    });
    const normalBattle = createBattleSnapshot("normal", "a", pikachu, sand);
    const customBattle = createBattleSnapshot("custom", "b", waterPikachu, sand);
    pikachu.types.push("fire");
    pikachu.baseStats.spa = 1;

    const immune = strikeDamage(normalBattle, {
      name: "Thunderbolt",
      type: "electric",
      category: "special",
      power: 90,
    });
    const water = strikeDamage(customBattle, {
      name: "Surf",
      type: "water",
      category: "special",
      power: 90,
    });
    expect(immune).toMatchObject({ immune: true, maxDamage: 0 });
    expect(water).toMatchObject({ immune: false, stab: true, effectiveness: 2 });
    if ("error" in water || "maxDamage" in immune === false) {
      return;
    }
    expect(normalBattle.attacker.types).toEqual(["electric"]);
    expect(normalBattle.attacker.baseStats.spa).toBe(50);
    expect(customBattle.attacker.types).toEqual(["water"]);
    expect(customBattle.attacker.baseStats.spa).toBe(120);
    expect(speciesTypes).toEqual(["electric", "fire"]);
    expect(speciesStats.spa).toBe(1);
  });

  it("refuses custom types on a standard preset and allows them on a customized copy", () => {
    const ou = presetById("gen9ou");
    expect(ou).toBeDefined();
    if (!ou) {
      return;
    }
    const attackerStage = {
      speciesId: "pikachu",
      speciesName: "Pikachu",
      speciesTypes: ["electric" as const],
      speciesBase: base(35, 55, 40, 50, 50, 90),
      customTypes: ["water" as const],
      level: 50,
      ivs: { ...PERFECT_IVS },
      evs: { ...EMPTY_EVS },
      plusStat: null,
      minusStat: null,
    };
    const defenderStage = {
      ...attackerStage,
      speciesId: "sandshrew",
      speciesName: "Sandshrew",
      speciesTypes: ["ground" as const],
      speciesBase: base(50, 75, 85, 20, 30, 40),
      customTypes: undefined,
    };
    const blocked = prepareBattle({
      battleId: "blocked",
      format: ou,
      attacker: attackerStage,
      defender: defenderStage,
    });
    expect(blocked.ok).toBe(false);
    const copy = customizeFormat(ou);
    copy.typePolicy = "custom";
    copy.name = "OU with custom types";
    const allowed = prepareBattle({
      battleId: "allowed",
      format: copy,
      attacker: attackerStage,
      defender: defenderStage,
    });
    expect(allowed.ok).toBe(true);
    if (!allowed.ok) {
      return;
    }
    expect(allowed.snapshot.attacker.types).toEqual(["water"]);
    expect(ou.typePolicy).toBe("species");
  });
});

describe("showdown export", () => {
  it("leaves custom types and base stats out of the paste and explains that", () => {
    const set = finishedSet({
      customTypes: ["water"],
      customBaseStats: base(40, 40, 40, 40, 40, 40),
      shiny: true,
    });
    const text = exportShowdownSet(set, {
      pokemon: "Pikachu",
      ability: "Static",
      item: null,
      nature: "Hardy",
      moves: ["Thunderbolt"],
    });
    expect(text).toContain("Shiny: Yes");
    expect(text).not.toContain("water");
    expect(text).not.toContain("Base");
    expect(customAttributeNote(set)).toMatch(/left out of the paste/);
    expect(customAttributeNote(finishedSet())).toBeNull();
  });
});
