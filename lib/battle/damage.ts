import { damageMultiplier } from "@/lib/analysis/typeChart";
import {
  natureEffectFor,
  natureWouldWrap,
  showdownStat,
  statBeforeNature,
  trunc,
  modify,
} from "@/lib/battle/showdownMath";
import type { PokemonType } from "@/lib/types/pokemon-type";
import { STAT_IDS, STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";

/**
 * One Pokémon as it exists inside a single battle. Types and base stats are copies.
 * Editing the catalog, the saved set, or another battle does not change this object.
 */
export interface BattleCombatant {
  speciesId: string;
  speciesName: string;
  types: PokemonType[];
  baseStats: StatSpread;
  level: number;
  ivs: StatSpread;
  evs: StatSpread;
  plusStat: StatId | null;
  minusStat: StatId | null;
}

export interface BattleSnapshot {
  battleId: string;
  formatId: string;
  attacker: BattleCombatant;
  defender: BattleCombatant;
}

export interface StrikeMove {
  name: string;
  type: PokemonType;
  category: "physical" | "special";
  power: number;
}

export interface StrikeResult {
  stab: boolean;
  effectiveness: number;
  immune: boolean;
  /** Damage at the high end of the 85–100% roll. 0 when the defender is immune. */
  maxDamage: number;
  /** Damage at the low end of the roll. */
  minDamage: number;
  attackStat: number;
  defenseStat: number;
  note: string;
}

export function cloneCombatant(combatant: BattleCombatant): BattleCombatant {
  return {
    ...combatant,
    types: [...combatant.types],
    baseStats: { ...combatant.baseStats },
    ivs: { ...combatant.ivs },
    evs: { ...combatant.evs },
  };
}

export function createBattleSnapshot(
  battleId: string,
  formatId: string,
  attacker: BattleCombatant,
  defender: BattleCombatant,
): BattleSnapshot {
  return {
    battleId,
    formatId,
    attacker: cloneCombatant(attacker),
    defender: cloneCombatant(defender),
  };
}

/**
 * Generation 9 single-target damage, following Pokémon Showdown's order for the steps this
 * check includes: base damage, the 85–100 roll, same-type attack bonus, then type matchup.
 * Immunity is decided before damage, so it stays 0 instead of becoming 1.
 * Abilities, items, weather, critical hits, and spread moves are omitted on purpose.
 */
export function strikeDamage(snapshot: BattleSnapshot, move: StrikeMove): StrikeResult | { error: string } {
  const attackStatId: StatId = move.category === "physical" ? "atk" : "spa";
  const defenseStatId: StatId = move.category === "physical" ? "def" : "spd";
  const attackNature = natureEffectFor(attackStatId, snapshot.attacker.plusStat, snapshot.attacker.minusStat);
  const defenseNature = natureEffectFor(defenseStatId, snapshot.defender.plusStat, snapshot.defender.minusStat);
  const wrap = wrappedStat(snapshot.attacker, attackStatId, attackNature) ?? wrappedStat(snapshot.defender, defenseStatId, defenseNature);
  if (wrap) {
    return { error: wrap };
  }

  const attackStat = combatantStat(snapshot.attacker, attackStatId);
  const defenseStat = combatantStat(snapshot.defender, defenseStatId);
  const effectiveness = damageMultiplier(move.type, snapshot.defender.types);
  const stab = snapshot.attacker.types.includes(move.type);

  if (effectiveness === 0) {
    return {
      stab,
      effectiveness: 0,
      immune: true,
      maxDamage: 0,
      minDamage: 0,
      attackStat,
      defenseStat,
      note: `${snapshot.defender.speciesName} is immune to ${move.type}.`,
    };
  }

  const rolled = [0, 15].map((roll) =>
    damageAtRoll({
      attacker: snapshot.attacker,
      move,
      attack: attackStat,
      defense: defenseStat,
      roll,
      effectiveness,
      stab,
    }),
  );
  return {
    stab,
    effectiveness,
    immune: false,
    maxDamage: rolled[0] ?? 0,
    minDamage: rolled[1] ?? 0,
    attackStat,
    defenseStat,
    note: stab
      ? "Same-type attack bonus is included. Abilities, items, weather, and critical hits are not."
      : "Abilities, items, weather, and critical hits are not included.",
  };
}

/**
 * One generation 9 damage roll. `roll` is 0 for 100% and 15 for 85%, matching Showdown.
 * A critical hit is `trunc(base * 1.5)` after the +2 and before the roll, which is how
 * Showdown applies it (it is not a 4096 modifier). The damage preview leaves `crit` off.
 * `finalModifier` is the ModifyDamage step (Life Orb uses 5324/4096) and runs before the
 * minimum of 1. Immunity must be decided by the caller; this function does not return 0.
 */
export function damageAtRoll(input: {
  attacker: BattleCombatant;
  move: StrikeMove;
  attack: number;
  defense: number;
  roll: number;
  effectiveness: number;
  stab: boolean;
  crit?: boolean;
  finalModifier?: { numerator: number; denominator: number };
}): number {
  let baseDamage = trunc(
    trunc(trunc(trunc(trunc((2 * input.attacker.level) / 5 + 2) * input.move.power * input.attack) / input.defense) / 50),
  );
  baseDamage += 2;
  if (input.crit) {
    baseDamage = trunc(baseDamage * 1.5);
  }
  baseDamage = trunc(trunc(baseDamage * (100 - input.roll)) / 100);
  if (input.stab) {
    baseDamage = modify(baseDamage, 1.5);
  }
  const steps = effectivenessSteps(input.effectiveness);
  if (steps > 0) {
    baseDamage *= 2 ** steps;
  } else if (steps < 0) {
    for (let index = 0; index > steps; index -= 1) {
      baseDamage = trunc(baseDamage / 2);
    }
  }
  if (input.finalModifier) {
    baseDamage = modify(baseDamage, input.finalModifier.numerator, input.finalModifier.denominator);
  }
  if (!baseDamage) {
    baseDamage = 1;
  }
  return trunc(baseDamage, 16);
}

function effectivenessSteps(effectiveness: number): number {
  if (effectiveness === 4) {
    return 2;
  }
  if (effectiveness === 2) {
    return 1;
  }
  if (effectiveness === 0.5) {
    return -1;
  }
  if (effectiveness === 0.25) {
    return -2;
  }
  return 0;
}

function combatantStat(combatant: BattleCombatant, stat: StatId): number {
  return showdownStat({
    stat,
    base: combatant.baseStats[stat],
    iv: combatant.ivs[stat],
    ev: combatant.evs[stat],
    level: combatant.level,
    nature: natureEffectFor(stat, combatant.plusStat, combatant.minusStat),
  });
}

function wrappedStat(combatant: BattleCombatant, stat: StatId, nature: "boost" | "drop" | "neutral"): string | null {
  if (stat === "hp") {
    return null;
  }
  const before = statBeforeNature({
    base: combatant.baseStats[stat],
    iv: combatant.ivs[stat],
    ev: combatant.evs[stat],
    level: combatant.level,
  });
  if (!natureWouldWrap(before, nature)) {
    return null;
  }
  return `${combatant.speciesName}'s ${STAT_LABELS[stat]} is high enough that a ${nature === "boost" ? "boosting" : "lowering"} Nature wraps in the simulator's 16-bit math. Lower that base stat, or pick a different Nature.`;
}

export function battleStatLine(combatant: BattleCombatant): Array<{ stat: StatId; value: number }> {
  return STAT_IDS.map((stat) => ({ stat, value: combatantStat(combatant, stat) }));
}
