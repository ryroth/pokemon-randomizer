import type { StatSpread } from "@/lib/types/stats";
import { STAT_IDS, STAT_LABELS } from "@/lib/types/stats";
import { fail, ok, type ValidationResult } from "@/lib/validation/result";
import type { ValidationIssue } from "@/lib/validation/result";

export const MIN_IV = 0;
export const MAX_IV = 31;

export function validateIvs(ivs: StatSpread | undefined): ValidationResult<StatSpread> {
  if (!ivs) {
    return fail([
      {
        code: "ivs.missing",
        field: "ivs",
        message: "Set your IVs before finishing this Pokémon.",
      },
    ]);
  }

  const errors: ValidationIssue[] = [];

  for (const stat of STAT_IDS) {
    const value = ivs[stat];
    if (!Number.isInteger(value) || value < MIN_IV || value > MAX_IV) {
      errors.push({
        code: "ivs.range",
        field: `ivs.${stat}`,
        message: `${STAT_LABELS[stat]} IVs must be a whole number between ${MIN_IV} and ${MAX_IV}.`,
      });
    }
  }

  if (errors.length > 0) {
    return fail(errors);
  }

  return ok(ivs);
}
