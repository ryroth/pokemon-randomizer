import type { StatSpread } from "@/lib/types/stats";
import { STAT_IDS, STAT_LABELS, type StatId } from "@/lib/types/stats";
import { fail, ok, type ValidationResult } from "@/lib/validation/result";
import type { ValidationIssue } from "@/lib/validation/result";

export const MAX_EV_PER_STAT = 252;
export const MAX_EV_TOTAL = 508;

export function sumEvs(evs: StatSpread): number {
  return STAT_IDS.reduce((total, stat) => total + evs[stat], 0);
}

/** How high this stat can go without passing the total or the per-stat cap. */
export function maxEvForStat(evs: Partial<StatSpread> | undefined, stat: StatId): number {
  const filled = evsCountingBlanksAsZero(evs);
  const otherTotal = sumEvs(filled) - filled[stat];
  return Math.max(0, Math.min(MAX_EV_PER_STAT, MAX_EV_TOTAL - otherTotal));
}

/** Blank slots are 0. A filled number is kept, including an explicit 0. */
export function evsCountingBlanksAsZero(evs: Partial<StatSpread> | undefined): StatSpread {
  return {
    hp: evs?.hp ?? 0,
    atk: evs?.atk ?? 0,
    def: evs?.def ?? 0,
    spa: evs?.spa ?? 0,
    spd: evs?.spd ?? 0,
    spe: evs?.spe ?? 0,
  };
}

export function validateEvs(evs: StatSpread | undefined): ValidationResult<StatSpread> {
  if (!evs) {
    return fail([
      {
        code: "evs.missing",
        field: "evs",
        message: "Set your EVs before finishing this Pokémon.",
      },
    ]);
  }

  const errors: ValidationIssue[] = [];

  for (const stat of STAT_IDS) {
    const value = evs[stat];
    if (!Number.isInteger(value) || value < 0) {
      errors.push({
        code: "evs.invalid",
        field: `evs.${stat}`,
        message: `${STAT_LABELS[stat]} EVs must be a whole number of at least 0.`,
      });
    } else if (value > MAX_EV_PER_STAT) {
      errors.push({
        code: "evs.stat-limit",
        field: `evs.${stat}`,
        message: `${STAT_LABELS[stat]} cannot have more than ${MAX_EV_PER_STAT} EVs.`,
      });
    }
  }

  const total = sumEvs(evs);
  if (total > MAX_EV_TOTAL) {
    errors.push({
      code: "evs.total-limit",
      field: "evs",
      message: `This Pokémon uses ${total} EVs. The maximum is ${MAX_EV_TOTAL}. Reduce some stats before continuing.`,
    });
  }

  if (errors.length > 0) {
    return fail(errors);
  }

  return ok(evs);
}
