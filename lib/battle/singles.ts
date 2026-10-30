import { damageMultiplier } from "@/lib/analysis/typeChart";
import { damageAtRoll, type BattleCombatant, type StrikeMove } from "@/lib/battle/damage";
import { modify, natureEffectFor, natureWouldWrap, showdownStat, statBeforeNature, trunc } from "@/lib/battle/showdownMath";
import type { BattleFormat } from "@/lib/formats/schema";
import { validateFormat } from "@/lib/formats/validate";
import { createRng } from "@/lib/randomizer/randomUtils";
import type { PokemonType } from "@/lib/types/pokemon-type";
import { STAT_IDS, type StatId, type StatSpread } from "@/lib/types/stats";
import type { ValidationIssue } from "@/lib/validation/result";

/**
 * A generation 9 singles battle on one copied snapshot.
 * A critical hit is 1 in 24 and uses Showdown's `trunc(base * 1.5)` before the damage roll.
 * Moves that crit more often in the games use that same rate, because the catalog does not
 * store a critical-hit ratio. Weather, status, stat stages, and every ability or item not
 * listed in `APPLIED_ABILITIES` / `APPLIED_ITEMS` are left out, and the battle log says so.
 */

export const APPLIED_ABILITIES = ["levitate", "hugepower", "purepower"] as const;
export const APPLIED_ITEMS = ["choiceband", "choicespecs", "choicescarf", "lifeorb"] as const;

const LIFE_ORB_MODIFIER = { numerator: 5324, denominator: 4096 } as const;
/** Generation 7+ chance for a move with the standard critical-hit ratio. */
const STANDARD_CRIT_RATE = 1 / 24;

export interface SinglesMoveInput {
  id: string;
  name: string;
  type: PokemonType;
  category: "physical" | "special";
  power: number;
  pp: number;
}

export interface SinglesFighterInput {
  speciesId: string;
  speciesName: string;
  types: readonly PokemonType[];
  baseStats: StatSpread;
  level: number;
  ivs: StatSpread;
  evs: StatSpread;
  plusStat: StatId | null;
  minusStat: StatId | null;
  abilityId: string;
  abilityName: string;
  itemId: string | null;
  itemName: string | null;
  moves: readonly SinglesMoveInput[];
}

export interface SinglesMove {
  id: string;
  name: string;
  type: PokemonType;
  category: "physical" | "special";
  power: number;
  pp: number;
  maxPp: number;
}

export interface SinglesFighter {
  speciesId: string;
  speciesName: string;
  types: PokemonType[];
  baseStats: StatSpread;
  level: number;
  ivs: StatSpread;
  evs: StatSpread;
  plusStat: StatId | null;
  minusStat: StatId | null;
  abilityId: string;
  abilityName: string;
  itemId: string | null;
  itemName: string | null;
  moves: SinglesMove[];
  hp: number;
  maxHp: number;
  fainted: boolean;
  /** Move index locked by a Choice item. Cleared on switch. */
  choiceMove: number | null;
}

export interface SinglesSide {
  name: string;
  fighters: SinglesFighter[];
  active: number;
}

export type SinglesChoice =
  | { kind: "move"; index: number }
  | { kind: "switch"; index: number }
  | { kind: "struggle" };

export interface SinglesBattle {
  battleId: string;
  formatId: string;
  seed: string;
  rngStep: number;
  turn: number;
  phase: "choose" | "switch" | "end";
  winner: 0 | 1 | null;
  mustSwitch: [boolean, boolean];
  choices: [SinglesChoice | null, SinglesChoice | null];
  sides: [SinglesSide, SinglesSide];
  log: string[];
}

export type SinglesStart =
  | { ok: true; battle: SinglesBattle }
  | { ok: false; errors: ValidationIssue[] };

export function createSinglesBattle(input: {
  battleId: string;
  format: BattleFormat;
  seed: string;
  sides: [{ name: string; fighters: readonly SinglesFighterInput[] }, { name: string; fighters: readonly SinglesFighterInput[] }];
  notes?: readonly string[];
}): SinglesStart {
  const errors: ValidationIssue[] = [...validateFormat(input.format)];
  if (input.format.structure === "doubles") {
    errors.push({
      code: "battle.doubles",
      field: "format",
      message: "This battle is singles. Doubles is not played here.",
    });
  }
  if (!input.seed) {
    errors.push({ code: "battle.seed", field: "seed", message: "This battle needs a seed." });
  }
  input.sides.forEach((side, index) => {
    if (side.fighters.length === 0) {
      errors.push({
        code: "battle.empty-side",
        field: `side-${index}`,
        message: `${side.name || `Side ${index + 1}`} needs a Pokémon.`,
      });
    }
    if (side.fighters.length > input.format.teamSize) {
      errors.push({
        code: "battle.team-size",
        field: `side-${index}`,
        message: `${input.format.name} allows ${input.format.teamSize} Pokémon on a side.`,
      });
    }
    side.fighters.forEach((fighter) => {
      const wrap = wrappedStat(fighter);
      if (wrap) {
        errors.push({ code: "battle.nature-wrap", field: fighter.speciesName, message: wrap });
      }
      fighter.moves.forEach((move) => {
        if (!Number.isInteger(move.power) || move.power < 1) {
          errors.push({
            code: "battle.move-power",
            field: move.name,
            message: `${move.name} has no damage, so this battle cannot use it.`,
          });
        }
        if (!Number.isInteger(move.pp) || move.pp < 1) {
          errors.push({
            code: "battle.move-pp",
            field: move.name,
            message: `${move.name} needs at least 1 PP.`,
          });
        }
      });
    });
  });
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const sides = input.sides.map((side) => ({
    name: side.name,
    active: 0,
    fighters: side.fighters.map(copyFighter),
  })) as [SinglesSide, SinglesSide];

  const log = [
    "This is a generation 9 singles battle. A critical hit is 1 in 24, including for moves that crit more often in the games. Weather, status, and stat stages are not applied.",
    "Levitate, Huge Power, Pure Power, Choice Band, Choice Specs, Choice Scarf, and Life Orb are applied. Other abilities and items are not.",
  ];
  for (const note of input.notes ?? []) {
    log.push(note);
  }
  for (const side of sides) {
    const lead = side.fighters[0];
    if (!lead) {
      continue;
    }
    log.push(`${side.name} sent out ${lead.speciesName}.`);
    log.push(...modifierNotes(lead));
  }

  return {
    ok: true,
    battle: {
      battleId: input.battleId,
      formatId: input.format.id || "unsaved",
      seed: input.seed,
      rngStep: 0,
      turn: 1,
      phase: "choose",
      winner: null,
      mustSwitch: [false, false],
      choices: [null, null],
      sides,
      log,
    },
  };
}

export function sideMustAct(battle: SinglesBattle, side: 0 | 1): boolean {
  if (battle.phase === "end") {
    return false;
  }
  if (battle.phase === "switch") {
    return battle.mustSwitch[side];
  }
  return true;
}

export function submitSinglesChoice(
  battle: SinglesBattle,
  side: 0 | 1,
  choice: SinglesChoice,
): { ok: true; battle: SinglesBattle } | { ok: false; battle: SinglesBattle; message: string } {
  const message = illegalChoice(battle, side, choice);
  if (message) {
    return { ok: false, battle, message };
  }
  const choices: [SinglesChoice | null, SinglesChoice | null] = [battle.choices[0], battle.choices[1]];
  choices[side] = choice;
  const next: SinglesBattle = { ...battle, choices, log: [...battle.log], sides: battle.sides };
  if (!bothReady(next)) {
    return { ok: true, battle: next };
  }
  return { ok: true, battle: resolve(next) };
}

export function clearSinglesChoice(battle: SinglesBattle, side: 0 | 1): SinglesBattle {
  if (battle.phase === "end" || battle.choices[side] === null) {
    return battle;
  }
  const choices: [SinglesChoice | null, SinglesChoice | null] = [battle.choices[0], battle.choices[1]];
  choices[side] = null;
  return { ...battle, choices };
}

function bothReady(battle: SinglesBattle): boolean {
  return ([0, 1] as const).every((side) => !sideMustAct(battle, side) || battle.choices[side] !== null);
}

function illegalChoice(battle: SinglesBattle, side: 0 | 1, choice: SinglesChoice): string | null {
  if (battle.phase === "end") {
    return "This battle is over.";
  }
  if (!sideMustAct(battle, side)) {
    return `${battle.sides[side].name} does not choose right now.`;
  }
  const current = active(battle.sides[side]);
  if (choice.kind === "switch") {
    return illegalSwitch(battle.sides[side], choice.index);
  }
  if (battle.phase === "switch") {
    return `${current.speciesName} fainted. Send in another Pokémon.`;
  }
  if (choice.kind === "struggle") {
    if (current.moves.some((move) => move.pp > 0)) {
      return `${current.speciesName} still has a move with PP.`;
    }
    return null;
  }
  const move = current.moves[choice.index];
  if (!move) {
    return "That move is not on this Pokémon.";
  }
  if (move.pp < 1) {
    return `${move.name} has no PP left.`;
  }
  if (isChoiceItem(current.itemId) && current.choiceMove !== null && current.choiceMove !== choice.index) {
    const locked = current.moves[current.choiceMove];
    return `${current.itemName || "A Choice item"} locks ${current.speciesName} into ${locked?.name ?? "its move"}.`;
  }
  return null;
}

function illegalSwitch(side: SinglesSide, index: number): string | null {
  const fighter = side.fighters[index];
  if (!fighter || index === side.active) {
    return "There is no other Pokémon to send in.";
  }
  if (fighter.fainted) {
    return `${fighter.speciesName} has fainted.`;
  }
  return null;
}

function resolve(source: SinglesBattle): SinglesBattle {
  const battle = structuredClone(source);
  if (battle.phase === "switch") {
    const switches = ([0, 1] as const)
      .filter((side) => battle.mustSwitch[side] && battle.choices[side]?.kind === "switch")
      .map((side) => side);
    for (const side of orderBySpeed(battle, switches)) {
      const choice = battle.choices[side];
      if (choice?.kind === "switch") {
        sendOut(battle, side, choice.index);
      }
    }
    battle.choices = [null, null];
    battle.mustSwitch = [false, false];
    battle.phase = "choose";
    battle.turn += 1;
    return battle;
  }

  battle.log.push(`Turn ${battle.turn}.`);
  const moveSides: Array<0 | 1> = [];
  const switchSides: Array<0 | 1> = [];
  for (const side of [0, 1] as const) {
    const choice = battle.choices[side];
    if (choice?.kind === "switch") {
      switchSides.push(side);
    } else if (choice) {
      moveSides.push(side);
    }
  }
  for (const side of orderBySpeed(battle, switchSides)) {
    const choice = battle.choices[side];
    if (choice?.kind === "switch") {
      sendOut(battle, side, choice.index);
    }
  }
  for (const side of orderBySpeed(battle, moveSides)) {
    const choice = battle.choices[side];
    if (choice?.kind === "move" || choice?.kind === "struggle") {
      performMove(battle, side, choice);
    }
  }
  return settle(battle);
}

function sendOut(battle: SinglesBattle, side: 0 | 1, index: number): void {
  const party = battle.sides[side];
  const outgoing = active(party);
  outgoing.choiceMove = null;
  party.active = index;
  const incoming = active(party);
  battle.log.push(`${party.name} sent out ${incoming.speciesName}.`);
  battle.log.push(...modifierNotes(incoming));
}

function performMove(battle: SinglesBattle, side: 0 | 1, choice: Extract<SinglesChoice, { kind: "move" | "struggle" }>): void {
  const actor = active(battle.sides[side]);
  const foeSide: 0 | 1 = side === 0 ? 1 : 0;
  const target = active(battle.sides[foeSide]);
  if (actor.fainted) {
    return;
  }
  if (target.fainted) {
    battle.log.push(`${actor.speciesName} couldn't move. ${target.speciesName} already fainted.`);
    return;
  }

  const selected = choice.kind === "move" ? actor.moves[choice.index] : null;
  if (choice.kind === "move" && !selected) {
    return;
  }
  if (selected && choice.kind === "move") {
    selected.pp -= 1;
    if (isChoiceItem(actor.itemId)) {
      actor.choiceMove = choice.index;
    }
  }
  const strike: StrikeMove = selected
    ? { name: selected.name, type: selected.type, category: selected.category, power: selected.power }
    : { name: "Struggle", type: "normal", category: "physical", power: 50 };
  const struggle = choice.kind === "struggle";
  battle.log.push(`${actor.speciesName} used ${strike.name}.`);

  const levitate = target.abilityId === "levitate" && strike.type === "ground" && !struggle;
  const effectiveness = struggle ? 1 : levitate ? 0 : damageMultiplier(strike.type, target.types);
  if (effectiveness === 0) {
    battle.log.push(
      levitate
        ? `${target.speciesName}'s Levitate makes it immune to Ground.`
        : `${target.speciesName} is immune to ${strike.type}.`,
    );
    return;
  }

  const attackStat = offensiveStat(actor, strike.category);
  const defenseId: StatId = strike.category === "physical" ? "def" : "spd";
  const defenseStat = battleStat(target, defenseId);
  const crit = randomUnit(battle) < STANDARD_CRIT_RATE;
  const roll = Math.floor(randomUnit(battle) * 16);
  const stab = !struggle && actor.types.includes(strike.type);
  const damage = damageAtRoll({
    attacker: toCombatant(actor),
    move: strike,
    attack: attackStat,
    defense: defenseStat,
    roll,
    effectiveness,
    stab,
    crit,
    finalModifier: actor.itemId === "lifeorb" ? LIFE_ORB_MODIFIER : undefined,
  });
  const dealt = Math.min(damage, target.hp);
  target.hp -= dealt;
  if (effectiveness > 1) {
    battle.log.push("It's super effective.");
  } else if (effectiveness < 1) {
    battle.log.push("It's not very effective.");
  }
  if (crit) {
    battle.log.push("A critical hit!");
  }
  battle.log.push(`${target.speciesName} took ${dealt} damage.`);
  if (target.hp === 0) {
    target.fainted = true;
    battle.log.push(`${target.speciesName} fainted.`);
  }
  if (actor.itemId === "lifeorb") {
    applyRecoil(battle, actor, lifeOrbRecoil(actor.maxHp), `${actor.speciesName} was hurt by its Life Orb.`);
  }
  if (struggle) {
    applyRecoil(battle, actor, struggleRecoil(actor.maxHp), `${actor.speciesName} was hurt by Struggle.`);
  }
}

function applyRecoil(battle: SinglesBattle, fighter: SinglesFighter, amount: number, message: string): void {
  if (fighter.fainted || amount < 1) {
    return;
  }
  const dealt = Math.min(amount, fighter.hp);
  fighter.hp -= dealt;
  battle.log.push(message);
  if (fighter.hp === 0) {
    fighter.fainted = true;
    battle.log.push(`${fighter.speciesName} fainted.`);
  }
}

function settle(battle: SinglesBattle): SinglesBattle {
  const needs: [boolean, boolean] = [false, false];
  const defeated: Array<0 | 1> = [];
  for (const side of [0, 1] as const) {
    const current = active(battle.sides[side]);
    if (!current.fainted) {
      continue;
    }
    const bench = battle.sides[side].fighters.some((fighter, index) => index !== battle.sides[side].active && !fighter.fainted);
    if (bench) {
      needs[side] = true;
    } else {
      defeated.push(side);
    }
  }
  battle.choices = [null, null];
  battle.mustSwitch = [false, false];
  if (defeated.length === 2) {
    battle.phase = "end";
    battle.winner = null;
    battle.log.push("The battle is a draw.");
    return battle;
  }
  if (defeated.length === 1) {
    const loser = defeated[0];
    const winner: 0 | 1 = loser === 0 ? 1 : 0;
    battle.phase = "end";
    battle.winner = winner;
    battle.log.push(`${battle.sides[winner].name} wins.`);
    return battle;
  }
  if (needs[0] || needs[1]) {
    battle.phase = "switch";
    battle.mustSwitch = needs;
    for (const side of [0, 1] as const) {
      if (needs[side]) {
        battle.log.push(`${battle.sides[side].name} has to send in another Pokémon.`);
      }
    }
    return battle;
  }
  battle.phase = "choose";
  battle.turn += 1;
  return battle;
}

function orderBySpeed(battle: SinglesBattle, sides: readonly (0 | 1)[]): Array<0 | 1> {
  const speeds = new Map<0 | 1, number>();
  for (const side of sides) {
    speeds.set(side, speedOf(active(battle.sides[side])));
  }
  let tieFirst: 0 | 1 | null = null;
  return [...sides].sort((left, right) => {
    const leftSpeed = speeds.get(left) ?? 0;
    const rightSpeed = speeds.get(right) ?? 0;
    if (leftSpeed !== rightSpeed) {
      return rightSpeed - leftSpeed;
    }
    if (tieFirst === null) {
      tieFirst = randomUnit(battle) < 0.5 ? left : right;
    }
    return left === tieFirst ? -1 : 1;
  });
}

function speedOf(fighter: SinglesFighter): number {
  const speed = battleStat(fighter, "spe");
  return fighter.itemId === "choicescarf" ? modify(speed, 1.5) : speed;
}

function offensiveStat(fighter: SinglesFighter, category: "physical" | "special"): number {
  const statId: StatId = category === "physical" ? "atk" : "spa";
  let stat = battleStat(fighter, statId);
  if (category === "physical" && (fighter.abilityId === "hugepower" || fighter.abilityId === "purepower")) {
    stat = modify(stat, 2);
  }
  if (category === "physical" && fighter.itemId === "choiceband") {
    stat = modify(stat, 1.5);
  }
  if (category === "special" && fighter.itemId === "choicespecs") {
    stat = modify(stat, 1.5);
  }
  return stat;
}

function battleStat(fighter: SinglesFighter, stat: StatId): number {
  return showdownStat({
    stat,
    base: fighter.baseStats[stat],
    iv: fighter.ivs[stat],
    ev: fighter.evs[stat],
    level: fighter.level,
    nature: natureEffectFor(stat, fighter.plusStat, fighter.minusStat),
  });
}

function toCombatant(fighter: SinglesFighter): BattleCombatant {
  return {
    speciesId: fighter.speciesId,
    speciesName: fighter.speciesName,
    types: [...fighter.types],
    baseStats: { ...fighter.baseStats },
    level: fighter.level,
    ivs: { ...fighter.ivs },
    evs: { ...fighter.evs },
    plusStat: fighter.plusStat,
    minusStat: fighter.minusStat,
  };
}

function copyFighter(input: SinglesFighterInput): SinglesFighter {
  const fighter: SinglesFighter = {
    speciesId: input.speciesId,
    speciesName: input.speciesName,
    types: [...input.types],
    baseStats: { ...input.baseStats },
    level: input.level,
    ivs: { ...input.ivs },
    evs: { ...input.evs },
    plusStat: input.plusStat,
    minusStat: input.minusStat,
    abilityId: input.abilityId,
    abilityName: input.abilityName,
    itemId: input.itemId,
    itemName: input.itemName,
    moves: input.moves.map((move) => ({ ...move, maxPp: move.pp })),
    hp: 0,
    maxHp: 0,
    fainted: false,
    choiceMove: null,
  };
  const hp = battleStat(fighter, "hp");
  fighter.hp = hp;
  fighter.maxHp = hp;
  return fighter;
}

function modifierNotes(fighter: SinglesFighter): string[] {
  const notes: string[] = [];
  if (fighter.abilityId && !(APPLIED_ABILITIES as readonly string[]).includes(fighter.abilityId)) {
    notes.push(`${fighter.speciesName}'s ${fighter.abilityName || fighter.abilityId} is not applied in this battle.`);
  }
  if (fighter.abilityId === "levitate") {
    notes.push(`${fighter.speciesName}'s Levitate blocks Ground moves.`);
  }
  if (fighter.abilityId === "hugepower" || fighter.abilityId === "purepower") {
    notes.push(`${fighter.speciesName}'s ${fighter.abilityName || "ability"} doubles Attack.`);
  }
  if (fighter.itemId && !(APPLIED_ITEMS as readonly string[]).includes(fighter.itemId)) {
    notes.push(`${fighter.speciesName}'s ${fighter.itemName || fighter.itemId} is not applied in this battle.`);
  }
  if (fighter.itemId === "choiceband") {
    notes.push(`${fighter.speciesName}'s Choice Band boosts Attack and locks the first move it uses.`);
  }
  if (fighter.itemId === "choicespecs") {
    notes.push(`${fighter.speciesName}'s Choice Specs boosts Special Attack and locks the first move it uses.`);
  }
  if (fighter.itemId === "choicescarf") {
    notes.push(`${fighter.speciesName}'s Choice Scarf boosts Speed and locks the first move it uses.`);
  }
  if (fighter.itemId === "lifeorb") {
    notes.push(`${fighter.speciesName}'s Life Orb boosts damage and costs HP after a hit.`);
  }
  return notes;
}

function wrappedStat(fighter: SinglesFighterInput): string | null {
  for (const stat of STAT_IDS) {
    if (stat === "hp") {
      continue;
    }
    const nature = natureEffectFor(stat, fighter.plusStat, fighter.minusStat);
    const before = statBeforeNature({
      base: fighter.baseStats[stat],
      iv: fighter.ivs[stat],
      ev: fighter.evs[stat],
      level: fighter.level,
    });
    if (natureWouldWrap(before, nature)) {
      return `${fighter.speciesName}'s ${stat} is high enough that its Nature wraps in 16-bit math. Lower that base stat or pick a different Nature.`;
    }
  }
  return null;
}

function isChoiceItem(itemId: string | null): boolean {
  return itemId === "choiceband" || itemId === "choicespecs" || itemId === "choicescarf";
}

function lifeOrbRecoil(maxHp: number): number {
  const amount = trunc(maxHp / 10);
  return amount === 0 ? 1 : amount;
}

function struggleRecoil(maxHp: number): number {
  return Math.max(1, Math.round(maxHp / 4));
}

function active(side: SinglesSide): SinglesFighter {
  const fighter = side.fighters[side.active];
  if (!fighter) {
    throw new Error("A battle side has no active Pokémon.");
  }
  return fighter;
}

function randomUnit(battle: SinglesBattle): number {
  const next = createRng(`${battle.seed}:${battle.rngStep}`);
  battle.rngStep += 1;
  return next();
}
