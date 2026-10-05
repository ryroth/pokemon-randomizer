import type { MoveCategory } from "@/lib/types/catalog-entities";
import type { PokemonType } from "@/lib/types/pokemon-type";
import { SHOWDOWN_STAT_LABELS, STAT_IDS, type StatId, type StatSpread } from "@/lib/types/stats";

/**
 * Spread guess from the Pokémon Showdown teambuilder (`BattleStatGuesser`).
 * The role is inferred from move categories and base stats in the Gen 9 EV rules.
 * A published Smogon set is not required.
 */
export interface EvSuggestion {
  role: string;
  evs: Partial<StatSpread>;
  plusStat: Exclude<StatId, "hp">;
  minusStat: Exclude<StatId, "hp">;
}

export interface GuessMove {
  showdownName: string;
  category: MoveCategory;
}

export interface EvGuessInput {
  showdownName: string;
  baseStats: StatSpread;
  types: readonly PokemonType[];
  moves: readonly (GuessMove | undefined)[];
  abilityName?: string;
  itemName?: string;
  level?: number;
  ivs?: Partial<StatSpread>;
  /** Nature already chosen on the set. Leftover EVs use it the way Showdown does. */
  plusStat?: StatId | null;
  minusStat?: StatId | null;
}

type RoleStat = Exclude<StatId, "hp">;

interface MoveCount {
  Physical: number;
  Special: number;
  PhysicalAttack: number;
  SpecialAttack: number;
  PhysicalSetup: number;
  SpecialSetup: number;
  Support: number;
  Setup: number;
  Restoration: number;
  Offense: number;
  Stall: number;
  SpecialStall: number;
  PhysicalStall: number;
  Fast: number;
  Ultrafast: number;
  bulk: number;
  specialBulk: number;
  physicalBulk: number;
}

const MAX_EV = 252;
const EV_TOTAL = 508;
const EV_STEP = 4;

const STATUS_HEAL = new Set([
  "healorder",
  "lifedew",
  "milkdrink",
  "recover",
  "roost",
  "slackoff",
  "softboiled",
]);

/** Status moves whose Showdown target is the user. Setup counting uses this. */
const STATUS_SELF = new Set([
  "acidarmor",
  "agility",
  "allyswitch",
  "amnesia",
  "aquaring",
  "assist",
  "autotomize",
  "banefulbunker",
  "barrier",
  "batonpass",
  "bellydrum",
  "bulkup",
  "burningbulwark",
  "calmmind",
  "camouflage",
  "celebrate",
  "charge",
  "clangoroussoul",
  "coil",
  "conversion",
  "copycat",
  "cosmicpower",
  "cottonguard",
  "defendorder",
  "defensecurl",
  "destinybond",
  "detect",
  "doubleteam",
  "dragondance",
  "endure",
  "extremeevoboost",
  "filletaway",
  "focusenergy",
  "followme",
  "geomancy",
  "growth",
  "grudge",
  "harden",
  "healingwish",
  "healorder",
  "honeclaws",
  "imprison",
  "ingrain",
  "irondefense",
  "kingsshield",
  "laserfocus",
  "lunardance",
  "magiccoat",
  "magnetrise",
  "maxguard",
  "meditate",
  "metronome",
  "milkdrink",
  "minimize",
  "moonlight",
  "morningsun",
  "nastyplot",
  "noretreat",
  "obstruct",
  "powershift",
  "powertrick",
  "protect",
  "quiverdance",
  "ragepowder",
  "recover",
  "recycle",
  "refresh",
  "rest",
  "revivalblessing",
  "rockpolish",
  "roost",
  "sharpen",
  "shedtail",
  "shellsmash",
  "shelter",
  "shiftgear",
  "shoreup",
  "silktrap",
  "slackoff",
  "sleeptalk",
  "snatch",
  "softboiled",
  "spikyshield",
  "splash",
  "stockpile",
  "stuffcheeks",
  "substitute",
  "swallow",
  "swordsdance",
  "synthesis",
  "tailglow",
  "takeheart",
  "teleport",
  "tidyup",
  "victorydance",
  "wish",
  "withdraw",
  "workup",
]);

const STAT_CHART: Record<string, readonly [RoleStat, StatId]> = {
  "Bulky Band": ["atk", "hp"],
  "Fast Band": ["spe", "atk"],
  "Bulky Specs": ["spa", "hp"],
  "Fast Specs": ["spe", "spa"],
  "Physical Scarf": ["spe", "atk"],
  "Special Scarf": ["spe", "spa"],
  "Physical Biased Mixed Scarf": ["spe", "atk"],
  "Special Biased Mixed Scarf": ["spe", "spa"],
  "Fast Physical Sweeper": ["spe", "atk"],
  "Fast Special Sweeper": ["spe", "spa"],
  "Bulky Physical Sweeper": ["atk", "hp"],
  "Bulky Special Sweeper": ["spa", "hp"],
  "Fast Bulky Support": ["spe", "hp"],
  "Physically Defensive": ["def", "hp"],
  "Specially Defensive": ["spd", "hp"],
};

export function guessEvSpread(input: EvGuessInput): EvSuggestion | undefined {
  const judged = judgeRole(input);
  if (!judged || judged.role === "?") {
    return undefined;
  }
  const spread = guessEvs(input, judged.role, judged.moveCount, judged.hasMove);
  if (!spread) {
    return undefined;
  }
  return {
    role: judged.role,
    plusStat: spread.plusStat,
    minusStat: spread.minusStat,
    evs: invested(spread.evs),
  };
}

export function formatGuessedSpread(suggestion: EvSuggestion): string {
  const investedStats = STAT_IDS.filter((stat) => (suggestion.evs[stat] ?? 0) > 0).map(
    (stat) => `${suggestion.evs[stat]} ${SHOWDOWN_STAT_LABELS[stat]}`,
  );
  const signs =
    suggestion.plusStat !== suggestion.minusStat
      ? `(+${SHOWDOWN_STAT_LABELS[suggestion.plusStat]}, −${SHOWDOWN_STAT_LABELS[suggestion.minusStat]})`
      : undefined;
  const spread = [...investedStats, signs].filter(Boolean).join(" / ");
  return spread ? `${suggestion.role}: ${spread}` : suggestion.role;
}

function judgeRole(input: EvGuessInput): { role: string; moveCount: MoveCount; hasMove: Set<string> } | undefined {
  const moveIds = input.moves.map((move) => (move ? toId(move.showdownName) : ""));
  if (moveIds.every((id) => id.length === 0)) {
    return undefined;
  }

  const speciesId = toId(input.showdownName);
  const baseSpeciesId = speciesId.startsWith("unown")
    ? "unown"
    : speciesId.startsWith("ditto")
      ? "ditto"
      : speciesId;
  const needsFourMoves = baseSpeciesId !== "unown" && baseSpeciesId !== "ditto" && !moveIds.includes("lastresort");
  const hasFourValidMoves = moveIds.length >= 4 && !moveIds.includes("");
  if (!hasFourValidMoves && needsFourMoves) {
    return { role: "?", moveCount: emptyMoveCount(), hasMove: new Set() };
  }

  const moveCount = emptyMoveCount();
  const hasMove = new Set<string>();
  const abilityId = toId(input.abilityName);
  const itemId = toId(input.itemName);
  const stats = input.baseStats;

  for (let index = 0; index < input.moves.length; index += 1) {
    const move = input.moves[index];
    const moveId = moveIds[index] ?? "";
    if (!move || moveId.length === 0) {
      continue;
    }
    hasMove.add(moveId);
    if (move.category === "status") {
      countStatusMove(moveId, moveCount);
    } else if (["counter", "endeavor", "metalburst", "mirrorcoat", "rapidspin"].includes(moveId)) {
      moveCount.Support += 1;
    } else if (
      [
        "nightshade",
        "seismictoss",
        "psywave",
        "superfang",
        "naturesmadness",
        "foulplay",
        "endeavor",
        "finalgambit",
        "bodypress",
      ].includes(moveId)
    ) {
      moveCount.Offense += 1;
    } else if (moveId === "fellstinger") {
      moveCount.PhysicalSetup += 1;
      moveCount.Setup += 1;
    } else {
      if (move.category === "physical") {
        moveCount.Physical += 1;
      } else {
        moveCount.Special += 1;
      }
      moveCount.Offense += 1;
      if (moveId === "knockoff") {
        moveCount.Support += 1;
      }
      if (["scald", "voltswitch", "uturn", "flipturn"].includes(moveId)) {
        if (move.category === "physical") {
          moveCount.Physical -= 0.2;
        } else {
          moveCount.Special -= 0.2;
        }
      }
    }
  }

  if (hasMove.has("batonpass")) {
    moveCount.Support += moveCount.Setup;
  }
  moveCount.PhysicalAttack = moveCount.Physical;
  moveCount.Physical += moveCount.PhysicalSetup;
  moveCount.SpecialAttack = moveCount.Special;
  moveCount.Special += moveCount.SpecialSetup;

  if (hasMove.has("dragondance") || hasMove.has("quiverdance")) {
    moveCount.Ultrafast = 1;
  }

  let isFast = stats.spe >= 80;
  let physicalBulk = (stats.hp + 75) * (stats.def + 87);
  let specialBulk = (stats.hp + 75) * (stats.spd + 87);

  if (
    hasMove.has("willowisp") ||
    hasMove.has("acidarmor") ||
    hasMove.has("irondefense") ||
    hasMove.has("cottonguard")
  ) {
    physicalBulk *= 1.6;
    moveCount.PhysicalStall += 1;
  } else if (hasMove.has("scald") || hasMove.has("bulkup") || hasMove.has("coil") || hasMove.has("cosmicpower")) {
    physicalBulk *= 1.3;
    if (hasMove.has("scald")) {
      moveCount.SpecialStall += 1;
    } else {
      moveCount.PhysicalStall += 1;
    }
  }
  if (abilityId === "flamebody") {
    physicalBulk *= 1.1;
  }

  if (hasMove.has("calmmind") || hasMove.has("quiverdance") || hasMove.has("geomancy")) {
    specialBulk *= 1.3;
    moveCount.SpecialStall += 1;
  }
  if (abilityId === "sandstream" && input.types.includes("rock")) {
    specialBulk *= 1.5;
  }

  if (hasMove.has("bellydrum")) {
    physicalBulk *= 0.6;
    specialBulk *= 0.6;
  }
  if (moveCount.Restoration) {
    physicalBulk *= 1.5;
    specialBulk *= 1.5;
  } else if (hasMove.has("painsplit") && hasMove.has("substitute")) {
    moveCount.Stall -= 1;
  } else if (hasMove.has("painsplit") || hasMove.has("rest")) {
    physicalBulk *= 1.4;
    specialBulk *= 1.4;
  }
  if (((hasMove.has("bodyslam") || hasMove.has("thunder")) && abilityId === "serenegrace") || hasMove.has("thunderwave")) {
    physicalBulk *= 1.1;
    specialBulk *= 1.1;
  }
  if ((hasMove.has("ironhead") || hasMove.has("airslash")) && abilityId === "serenegrace") {
    physicalBulk *= 1.1;
    specialBulk *= 1.1;
  }
  if (hasMove.has("gigadrain") || hasMove.has("drainpunch") || hasMove.has("hornleech")) {
    physicalBulk *= 1.15;
    specialBulk *= 1.15;
  }
  if (itemId === "leftovers" || itemId === "blacksludge") {
    physicalBulk *= 1 + 0.1 * (1 + moveCount.Stall / 1.5);
    specialBulk *= 1 + 0.1 * (1 + moveCount.Stall / 1.5);
  }
  if (hasMove.has("leechseed")) {
    physicalBulk *= 1 + 0.1 * (1 + moveCount.Stall / 1.5);
    specialBulk *= 1 + 0.1 * (1 + moveCount.Stall / 1.5);
  }
  if ((itemId === "flameorb" || itemId === "toxicorb") && abilityId !== "magicguard") {
    if (itemId === "toxicorb" && abilityId === "poisonheal") {
      physicalBulk *= 1 + 0.1 * (2 + moveCount.Stall);
      specialBulk *= 1 + 0.1 * (2 + moveCount.Stall);
    } else {
      physicalBulk *= 0.8;
      specialBulk *= 0.8;
    }
  }
  if (itemId === "lifeorb") {
    physicalBulk *= 0.7;
    specialBulk *= 0.7;
  }
  if (abilityId === "multiscale" || abilityId === "magicguard" || abilityId === "regenerator") {
    physicalBulk *= 1.4;
    specialBulk *= 1.4;
  }
  if (itemId === "eviolite") {
    physicalBulk *= 1.5;
    specialBulk *= 1.5;
  }
  if (itemId === "assaultvest") {
    specialBulk *= 1.5;
  }

  const bulk = physicalBulk + specialBulk;
  if (bulk < 46000 && stats.spe >= 70) {
    isFast = true;
  }
  if (hasMove.has("trickroom")) {
    isFast = false;
  }
  moveCount.bulk = bulk;
  moveCount.physicalBulk = physicalBulk;
  moveCount.specialBulk = specialBulk;

  if (
    hasMove.has("agility") ||
    hasMove.has("dragondance") ||
    hasMove.has("quiverdance") ||
    hasMove.has("rockpolish") ||
    hasMove.has("shellsmash") ||
    hasMove.has("flamecharge")
  ) {
    isFast = true;
  } else if (abilityId === "unburden" || abilityId === "speedboost" || abilityId === "motordrive") {
    isFast = true;
    moveCount.Ultrafast = 1;
  } else if (abilityId === "chlorophyll" || abilityId === "swiftswim" || abilityId === "sandrush") {
    isFast = true;
    moveCount.Ultrafast = 2;
  } else if (itemId === "salacberry") {
    isFast = true;
  }
  const ultrafast =
    hasMove.has("agility") ||
    hasMove.has("shellsmash") ||
    hasMove.has("autotomize") ||
    hasMove.has("shiftgear") ||
    hasMove.has("rockpolish");
  if (ultrafast) {
    moveCount.Ultrafast = 2;
  }
  moveCount.Fast = isFast ? 1 : 0;

  if (speciesId === "ditto") {
    return { role: abilityId === "imposter" ? "Physically Defensive" : "Fast Bulky Support", moveCount, hasMove };
  }
  if (speciesId === "shedinja") {
    return { role: "Fast Physical Sweeper", moveCount, hasMove };
  }

  if (itemId === "choiceband" && moveCount.PhysicalAttack >= 2) {
    return { role: isFast ? "Fast Band" : "Bulky Band", moveCount, hasMove };
  }
  if (itemId === "choicespecs" && moveCount.SpecialAttack >= 2) {
    return { role: isFast ? "Fast Specs" : "Bulky Specs", moveCount, hasMove };
  }
  if (itemId === "choicescarf") {
    if (moveCount.PhysicalAttack === 0) {
      return { role: "Special Scarf", moveCount, hasMove };
    }
    if (moveCount.SpecialAttack === 0) {
      return { role: "Physical Scarf", moveCount, hasMove };
    }
    if (moveCount.PhysicalAttack > moveCount.SpecialAttack) {
      return { role: "Physical Biased Mixed Scarf", moveCount, hasMove };
    }
    if (moveCount.PhysicalAttack < moveCount.SpecialAttack) {
      return { role: "Special Biased Mixed Scarf", moveCount, hasMove };
    }
    return {
      role: stats.atk < stats.spa ? "Special Biased Mixed Scarf" : "Physical Biased Mixed Scarf",
      moveCount,
      hasMove,
    };
  }

  if (speciesId === "unown") {
    return { role: "Fast Special Sweeper", moveCount, hasMove };
  }

  if (moveCount.PhysicalStall && moveCount.Restoration) {
    return {
      role: stats.spe > 110 && abilityId !== "prankster" ? "Fast Bulky Support" : "Specially Defensive",
      moveCount,
      hasMove,
    };
  }
  if (moveCount.SpecialStall && moveCount.Restoration && itemId !== "lifeorb") {
    return {
      role: stats.spe > 110 && abilityId !== "prankster" ? "Fast Bulky Support" : "Physically Defensive",
      moveCount,
      hasMove,
    };
  }

  let offenseBias: "Physical" | "Special" = "Physical";
  if (stats.spa > stats.atk && moveCount.Special > 1) {
    offenseBias = "Special";
  } else if (stats.atk > stats.spa && moveCount.Physical > 1) {
    offenseBias = "Physical";
  } else if (moveCount.Special > moveCount.Physical) {
    offenseBias = "Special";
  }

  if (moveCount.Stall + moveCount.Support / 2 <= 2 && bulk < 135000 && moveCount[offenseBias] >= 1.5) {
    if (isFast) {
      const bulky = bulk > 80000 && !moveCount.Ultrafast;
      return { role: `${bulky ? "Bulky" : "Fast"} ${offenseBias} Sweeper`, moveCount, hasMove };
    }
    if (moveCount[offenseBias] >= 3 || moveCount.Stall <= 0) {
      return { role: `Bulky ${offenseBias} Sweeper`, moveCount, hasMove };
    }
  }

  if (isFast && abilityId !== "prankster") {
    if (stats.spe > 100 || bulk < 55000 || moveCount.Ultrafast) {
      return { role: "Fast Bulky Support", moveCount, hasMove };
    }
  }
  if (moveCount.SpecialStall) {
    return { role: "Physically Defensive", moveCount, hasMove };
  }
  if (moveCount.PhysicalStall) {
    return { role: "Specially Defensive", moveCount, hasMove };
  }
  if (speciesId === "blissey" || speciesId === "chansey") {
    return { role: "Physically Defensive", moveCount, hasMove };
  }
  if (specialBulk >= physicalBulk) {
    return { role: "Specially Defensive", moveCount, hasMove };
  }
  return { role: "Physically Defensive", moveCount, hasMove };
}

function countStatusMove(moveId: string, moveCount: MoveCount): void {
  if (["batonpass", "healingwish", "lunardance"].includes(moveId)) {
    moveCount.Support += 1;
    return;
  }
  if (["metronome", "assist", "copycat", "mefirst", "photongeyser", "shellsidearm"].includes(moveId)) {
    moveCount.Physical += 0.5;
    moveCount.Special += 0.5;
    return;
  }
  if (moveId === "naturepower") {
    moveCount.Special += 1;
    return;
  }
  if (["protect", "detect", "spikyshield", "kingsshield"].includes(moveId)) {
    moveCount.Stall += 1;
    return;
  }
  if (moveId === "wish") {
    moveCount.Restoration += 1;
    moveCount.Stall += 1;
    moveCount.Support += 1;
    return;
  }
  if (STATUS_HEAL.has(moveId)) {
    moveCount.Restoration += 1;
    moveCount.Stall += 1;
    return;
  }
  if (STATUS_SELF.has(moveId)) {
    if (["agility", "rockpolish", "shellsmash", "growth", "workup"].includes(moveId)) {
      moveCount.PhysicalSetup += 1;
      moveCount.SpecialSetup += 1;
    } else if (["dragondance", "swordsdance", "coil", "bulkup", "curse", "bellydrum"].includes(moveId)) {
      moveCount.PhysicalSetup += 1;
    } else if (["nastyplot", "tailglow", "quiverdance", "calmmind", "geomancy"].includes(moveId)) {
      moveCount.SpecialSetup += 1;
    }
    if (moveId === "substitute") {
      moveCount.Stall += 1;
    }
    moveCount.Setup += 1;
    return;
  }
  if (["toxic", "leechseed", "willowisp"].includes(moveId)) {
    moveCount.Stall += 1;
  }
  moveCount.Support += 1;
}

function guessEvs(
  input: EvGuessInput,
  role: string,
  moveCount: MoveCount,
  hasMove: Set<string>,
): { evs: StatSpread; plusStat: RoleStat; minusStat: RoleStat } | undefined {
  const chart = STAT_CHART[role];
  if (!chart) {
    return undefined;
  }

  const stats = input.baseStats;
  const speciesId = toId(input.showdownName);
  const evs: StatSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  let plusStat: RoleStat = chart[0];
  if (role === "Fast Bulky Support") {
    moveCount.Ultrafast = 0;
  }
  if (plusStat === "spe" && moveCount.Ultrafast) {
    const second = chart[1];
    if (second === "atk" || second === "spa") {
      plusStat = second;
    } else if (moveCount.Physical >= 3) {
      plusStat = "atk";
    } else if (stats.spd > stats.def) {
      plusStat = "spd";
    } else {
      plusStat = "def";
    }
  }

  let evTotal = 0;
  const primaryStat = chart[0];
  evs[primaryStat] = evsForCap(input, primaryStat, plusStat === primaryStat ? 1.1 : 1);
  evTotal += evs[primaryStat];

  let secondaryStat: StatId | null = chart[1];
  const level = usedLevel(input.level);
  if (secondaryStat === "hp" && level < 20) {
    secondaryStat = "spd";
  }
  evs[secondaryStat] = evsForCap(input, secondaryStat, plusStat === secondaryStat ? 1.1 : 1);
  evTotal += evs[secondaryStat];

  evTotal = ensureSpeciesSpeed(speciesId, evs, evTotal);
  evTotal = ensureHpDivisibility(input, evs, hasMove, evTotal);

  let hpSelected = false;
  while (evTotal < EV_TOTAL) {
    const before = evTotal;
    let leftover: StatId | null = null;
    if (!evs.atk && moveCount.PhysicalAttack >= 1) {
      leftover = "atk";
    } else if (!evs.spa && moveCount.SpecialAttack >= 1) {
      leftover = "spa";
    } else if (!evs.hp && stats.hp > 1 && !hpSelected) {
      leftover = "hp";
    } else if (!evs.spd && stats.hp > 1) {
      leftover = "spd";
    } else if (!evs.def && stats.hp > 1) {
      leftover = "def";
    } else if (!evs.spe) {
      leftover = "spe";
    }
    if (!leftover) {
      break;
    }

    let ev = Math.min(EV_TOTAL - evTotal, MAX_EV);
    const capped = showdownStat(input, leftover, ev);
    while (ev > 0 && capped === showdownStat(input, leftover, ev - EV_STEP)) {
      ev -= EV_STEP;
    }
    if (ev) {
      evs[leftover] = ev;
    }
    evTotal += ev;

    if (leftover === "hp") {
      hpSelected = true;
      evTotal = ensureHpDivisibility(input, evs, hasMove, evTotal);
      continue;
    }
    if (evTotal === before) {
      break;
    }
  }

  let minusStat: RoleStat | undefined;
  if (hasMove.has("gyroball") || hasMove.has("trickroom")) {
    minusStat = "spe";
  } else if (!moveCount.PhysicalAttack) {
    minusStat = "atk";
  } else if (moveCount.SpecialAttack < 1 && !evs.spa) {
    if (moveCount.SpecialAttack < moveCount.PhysicalAttack) {
      minusStat = "spa";
    } else if (!evs.atk) {
      minusStat = "atk";
    }
  } else if (moveCount.PhysicalAttack < 1 && !evs.atk) {
    minusStat = "atk";
  } else if (stats.def > stats.spe && stats.spd > stats.spe && !evs.spe) {
    minusStat = "spe";
  } else if (plusStat === "def" || plusStat === "spd") {
    minusStat = evs.atk && !evs.spe ? "spe" : "atk";
  } else if (stats.def > stats.spd) {
    minusStat = "spd";
  } else {
    minusStat = "def";
  }

  if (!minusStat || plusStat === minusStat) {
    minusStat = plusStat === "spe" ? "spd" : "spe";
  }

  return { evs, plusStat, minusStat };
}

function evsForCap(input: EvGuessInput, stat: StatId, natureMultiplier: number): number {
  let ev = MAX_EV;
  const capped = showdownStat(input, stat, ev, natureMultiplier);
  while (ev > 0 && capped <= showdownStat(input, stat, ev - EV_STEP, natureMultiplier)) {
    ev -= EV_STEP;
  }
  return ev;
}

function ensureSpeciesSpeed(speciesId: string, evs: StatSpread, evTotal: number): number {
  if (speciesId === "tentacruel") {
    return ensureMinEvs(evs, "spe", 16, evTotal);
  }
  if (speciesId === "skarmory") {
    return ensureMinEvs(evs, "spe", 24, evTotal);
  }
  if (speciesId === "jirachi") {
    return ensureMinEvs(evs, "spe", 32, evTotal);
  }
  if (speciesId === "celebi") {
    return ensureMinEvs(evs, "spe", 36, evTotal);
  }
  if (speciesId === "volcarona") {
    return ensureMinEvs(evs, "spe", 52, evTotal);
  }
  if (speciesId === "gliscor") {
    return ensureMinEvs(evs, "spe", 72, evTotal);
  }
  if (speciesId === "dragonite" && evs.hp) {
    return ensureMaxEvs(evs, "spe", 220, evTotal);
  }
  return evTotal;
}

function ensureMinEvs(evs: StatSpread, stat: StatId, min: number, evTotal: number): number {
  let diff = min - evs[stat];
  if (diff <= 0) {
    return evTotal;
  }
  if (evTotal <= 504) {
    const change = Math.min(508 - evTotal, diff);
    evTotal += change;
    evs[stat] += change;
    diff -= change;
  }
  if (diff <= 0) {
    return evTotal;
  }
  const donors: StatId[] = ["def", "spd", "hp", "atk", "spa", "spe"];
  for (const donor of donors) {
    if (donor === stat) {
      continue;
    }
    if (evs[donor] > 128) {
      evs[donor] -= diff;
      evs[stat] += diff;
      return evTotal;
    }
  }
  return evTotal;
}

function ensureMaxEvs(evs: StatSpread, stat: StatId, min: number, evTotal: number): number {
  const diff = evs[stat] - min;
  if (diff <= 0) {
    return evTotal;
  }
  evs[stat] -= diff;
  return evTotal - diff;
}

function ensureHpDivisibility(
  input: EvGuessInput,
  evs: StatSpread,
  hasMove: Set<string>,
  evTotal: number,
): number {
  const itemName = input.itemName ?? "";
  const abilityId = toId(input.abilityName);
  let hpDivisibility = 0;
  let hpShouldBeDivisible = false;
  let hp = evs.hp;
  let hpStat = showdownStat(input, "hp", hp, 1);
  if ((itemName === "Leftovers" || itemName === "Black Sludge") && hasMove.has("substitute") && hpStat !== 404) {
    hpDivisibility = 4;
  } else if (itemName === "Leftovers" || itemName === "Black Sludge") {
    hpDivisibility = 0;
  } else if (hasMove.has("bellydrum") && itemName.endsWith("Berry")) {
    hpDivisibility = 2;
    hpShouldBeDivisible = true;
  } else if (hasMove.has("substitute") && itemName.endsWith("Berry")) {
    hpDivisibility = 4;
    hpShouldBeDivisible = true;
  } else if (stealthRockWeakness(input) >= 2 || hasMove.has("bellydrum")) {
    hpDivisibility = 2;
  } else if (stealthRockWeakness(input) >= 1 || hasMove.has("substitute") || hasMove.has("transform")) {
    hpDivisibility = 4;
  } else if (abilityId !== "magicguard") {
    hpDivisibility = 8;
  }

  if (!hpDivisibility) {
    return evTotal;
  }

  // Same grouping as Showdown: && binds tighter than !==.
  while (hp < MAX_EV && evTotal < EV_TOTAL && !(hpStat % hpDivisibility) !== hpShouldBeDivisible) {
    hp += EV_STEP;
    hpStat = showdownStat(input, "hp", hp, 1);
    evTotal += EV_STEP;
  }
  while (hp > 0 && !(hpStat % hpDivisibility) !== hpShouldBeDivisible) {
    hp -= EV_STEP;
    hpStat = showdownStat(input, "hp", hp, 1);
    evTotal -= EV_STEP;
  }
  while (hp > 0 && hpStat === showdownStat(input, "hp", hp - EV_STEP, 1)) {
    hp -= EV_STEP;
    evTotal -= EV_STEP;
  }
  if (hp || evs.hp) {
    evs.hp = hp;
  }
  return evTotal;
}

function stealthRockWeakness(input: EvGuessInput): number {
  const abilityId = toId(input.abilityName);
  if (abilityId === "magicguard" || abilityId === "mountaineer") {
    return 0;
  }
  const weak = new Set<PokemonType>(["fire", "flying", "bug", "ice"]);
  const resist = new Set<PokemonType>(["ground", "steel", "fighting"]);
  let score = 0;
  for (const type of input.types) {
    if (weak.has(type)) {
      score += 1;
    } else if (resist.has(type)) {
      score -= 1;
    }
  }
  return score;
}

/**
 * Showdown's teambuilder stat, including the HP formula it uses while trimming EVs.
 * A nature multiplier of 1.1 or 1 is the guess's own plus stat. Omitted, the set's current Nature applies.
 */
function showdownStat(
  input: EvGuessInput,
  stat: StatId,
  ev: number,
  natureMultiplier?: number,
): number {
  const base = input.baseStats[stat];
  const iv = input.ivs?.[stat];
  const usedIv = typeof iv === "number" ? iv : 31;
  const level = usedLevel(input.level);
  if (stat === "hp") {
    if (base === 1) {
      return 1;
    }
    return Math.trunc((Math.trunc(2 * base + usedIv + Math.trunc(ev / 4) + 100) * level) / 100 + 10);
  }
  let value = Math.trunc((Math.trunc(2 * base + usedIv + Math.trunc(ev / 4)) * level) / 100 + 5);
  const multiplier =
    natureMultiplier ??
    (input.plusStat === stat ? 1.1 : input.minusStat === stat ? 0.9 : 1);
  value *= multiplier;
  return Math.trunc(value);
}

function usedLevel(level: number | undefined): number {
  return level && level > 0 ? level : 100;
}

function invested(evs: StatSpread): Partial<StatSpread> {
  const spread: Partial<StatSpread> = {};
  for (const stat of STAT_IDS) {
    if (evs[stat] > 0) {
      spread[stat] = evs[stat];
    }
  }
  return spread;
}

function emptyMoveCount(): MoveCount {
  return {
    Physical: 0,
    Special: 0,
    PhysicalAttack: 0,
    SpecialAttack: 0,
    PhysicalSetup: 0,
    SpecialSetup: 0,
    Support: 0,
    Setup: 0,
    Restoration: 0,
    Offense: 0,
    Stall: 0,
    SpecialStall: 0,
    PhysicalStall: 0,
    Fast: 0,
    Ultrafast: 0,
    bulk: 0,
    specialBulk: 0,
    physicalBulk: 0,
  };
}

function toId(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
