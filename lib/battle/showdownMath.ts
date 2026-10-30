import type { StatId } from "@/lib/types/stats";

/** Pokémon Showdown's unsigned truncation (`Dex.trunc`). */
export function trunc(num: number, bits = 0): number {
  if (bits) {
    return (num >>> 0) % 2 ** bits;
  }
  return num >>> 0;
}

/**
 * Pokémon Showdown's `Battle#modify`. Used for the 1.5× same-type bonus.
 * `numerator` may be a fraction such as 1.5 or 0.5.
 */
export function modify(value: number, numerator: number, denominator = 1): number {
  const modifier = trunc((numerator * 4096) / denominator);
  return trunc((trunc(value * modifier) + 2048 - 1) / 4096);
}

export type NatureEffect = "boost" | "drop" | "neutral";

/**
 * One battle stat from Pokémon Showdown's generation 9 `statModify`.
 * A base HP of 1 stays 1, matching Shedinja. A boosting Nature on a stat above 595 wraps in
 * 16 bits, which is how the simulator behaves. Callers should reject that case.
 */
export function showdownStat(input: {
  stat: StatId;
  base: number;
  iv: number;
  ev: number;
  level: number;
  nature: NatureEffect;
}): number {
  if (input.stat === "hp" && input.base === 1) {
    return 1;
  }
  const effort = trunc(input.ev / 4);
  if (input.stat === "hp") {
    return trunc((trunc(2 * input.base + input.iv + effort + 100) * input.level) / 100 + 10);
  }
  let stat = trunc((trunc(2 * input.base + input.iv + effort) * input.level) / 100 + 5);
  if (input.nature === "boost") {
    stat = trunc(trunc(stat * 110, 16) / 100);
  } else if (input.nature === "drop") {
    stat = trunc(trunc(stat * 90, 16) / 100);
  }
  return stat;
}

/** The stat before Nature. Showdown wraps a boost above 595 and a drop above 728. */
export function statBeforeNature(input: {
  base: number;
  iv: number;
  ev: number;
  level: number;
}): number {
  const effort = trunc(input.ev / 4);
  return trunc((trunc(2 * input.base + input.iv + effort) * input.level) / 100 + 5);
}

export function natureWouldWrap(statBefore: number, nature: NatureEffect): boolean {
  if (nature === "boost") {
    return statBefore > 595;
  }
  if (nature === "drop") {
    return statBefore > 728;
  }
  return false;
}

export function natureEffectFor(
  stat: StatId,
  plusStat: StatId | null,
  minusStat: StatId | null,
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
