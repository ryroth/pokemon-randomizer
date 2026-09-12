import type { StatSpread } from "@/lib/types/stats";
import { STAT_IDS, STAT_LABELS } from "@/lib/types/stats";
import { fail, ok, type ValidationResult } from "@/lib/validation/result";
import type { ValidationIssue } from "@/lib/validation/result";

export const MAX_EV_PER_STAT = 252;
export const MAX_EV_TOTAL = 510;

export function sumEvs(evs: StatSpread): number {
  return STAT_IDS.reduce((total, stat) => total + evs[stat], 0);
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
