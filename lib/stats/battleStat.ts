import {
  PERFECT_IVS,
  STAT_IDS,
  type StatId,
  type StatSpread,
} from "@/lib/types/stats";
import { MAX_LEVEL, MIN_LEVEL } from "@/lib/validation/details";

export type NatureEffect = "boost" | "drop" | "neutral";

export interface CalculatedStat {
  stat: StatId;
  value: number;
  natureEffect: NatureEffect;
}

const NATURE_BOOST = 1.1;
const NATURE_DROP = 0.9;

/**
 * Official battle stat at a level. HP uses the HP formula. A base HP of 1 stays 1
 * (Shedinja). Other stats apply a 1.1× or 0.9× Nature after the level calculation.
 * Blank IVs use 31. Blank EVs use 0. A missing or illegal level uses 100.
 */
export function calculateBattleStats(input: {
  base: StatSpread;
  ivs?: Partial<StatSpread>;
  evs?: Partial<StatSpread>;
  level?: number;
  plusStat?: StatId | null;
  minusStat?: StatId | null;
}): { level: number; stats: CalculatedStat[] } {
  const level = previewLevel(input.level);
  const stats = STAT_IDS.map((stat) => {
    const natureEffect = natureEffectFor(stat, input.plusStat, input.minusStat);
    return {
      stat,
      natureEffect,
      value: calculateStat({
        stat,
        base: input.base[stat],
        iv: input.ivs?.[stat] ?? PERFECT_IVS[stat],
        ev: input.evs?.[stat] ?? 0,
        level,
        natureEffect,
      }),
    };
  });
  return { level, stats };
}

export function calculateStat(input: {
  stat: StatId;
  base: number;
  iv: number;
  ev: number;
  level: number;
  natureEffect: NatureEffect;
}): number {
  if (input.stat === "hp" && input.base === 1) {
    return 1;
  }

  const effort = Math.floor(input.ev / 4);
  const core = Math.floor(((input.base * 2 + input.iv + effort) * input.level) / 100);

  if (input.stat === "hp") {
    return core + input.level + 10;
  }

  const nature =
    input.natureEffect === "boost" ? NATURE_BOOST : input.natureEffect === "drop" ? NATURE_DROP : 1;
  return Math.floor((core + 5) * nature);
}

function natureEffectFor(
  stat: StatId,
  plusStat: StatId | null | undefined,
  minusStat: StatId | null | undefined,
): NatureEffect {
  if (stat === "hp" || !plusStat || !minusStat || plusStat === minusStat) {
    return "neutral";
  }
  if (stat === plusStat) {
    return "boost";
  }
  if (stat === minusStat) {
    return "drop";
  }
  return "neutral";
}

function previewLevel(level: number | undefined): number {
  if (level === undefined || !Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
    return MAX_LEVEL;
  }
  return level;
}
