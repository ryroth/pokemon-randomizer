import { POKEMON_TYPES, type PokemonType } from "@/lib/types/pokemon-type";
import { STAT_IDS, STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";
import {
  MAX_CUSTOM_BASE_STAT,
  MIN_CUSTOM_BASE_STAT,
  type BattleFormat,
} from "@/lib/formats/schema";
import { fail, ok, type ValidationIssue, type ValidationResult } from "@/lib/validation/result";

export interface StatLimits {
  min: number;
  max: number;
  budget: number | null;
}

export const DEFAULT_STAT_LIMITS: StatLimits = {
  min: MIN_CUSTOM_BASE_STAT,
  max: MAX_CUSTOM_BASE_STAT,
  budget: null,
};

/** Species types when the set has no override. The returned array is a copy. */
export function effectiveTypes(
  speciesTypes: readonly PokemonType[],
  customTypes: readonly PokemonType[] | undefined,
): PokemonType[] {
  if (!customTypes || customTypes.length === 0) {
    return [...speciesTypes];
  }
  return [...customTypes];
}

/** Species base stats when the set has no override. The returned spread is a copy. */
export function effectiveBaseStats(species: StatSpread, custom: StatSpread | undefined): StatSpread {
  if (!custom) {
    return { ...species };
  }
  return { ...custom };
}

export function baseStatTotal(stats: StatSpread): number {
  return STAT_IDS.reduce((total, stat) => total + stats[stat], 0);
}

export function sameStatSpread(left: StatSpread, right: StatSpread): boolean {
  return STAT_IDS.every((stat) => left[stat] === right[stat]);
}

export function validateCustomTypes(
  types: readonly PokemonType[] | undefined,
): ValidationResult<PokemonType[] | undefined> {
  if (types === undefined) {
    return ok(undefined);
  }
  if (types.length < 1 || types.length > 2) {
    return fail([
      {
        code: "types.count",
        field: "customTypes",
        message: "Choose one type, or two different types.",
      },
    ]);
  }
  const invalid = types.find((type) => !POKEMON_TYPES.includes(type));
  if (invalid) {
    return fail([
      {
        code: "types.invalid",
        field: "customTypes",
        message: "That is not a battle type. Stellar is a Tera type, not a species type.",
      },
    ]);
  }
  if (types.length === 2 && types[0] === types[1]) {
    return fail([
      {
        code: "types.duplicate",
        field: "customTypes",
        message: "A Pokémon cannot have the same type twice. Pick a different second type, or leave it empty.",
      },
    ]);
  }
  return ok([...types]);
}

export function validateCustomBaseStats(
  stats: StatSpread | undefined,
  limits: StatLimits = DEFAULT_STAT_LIMITS,
): ValidationResult<StatSpread | undefined> {
  if (stats === undefined) {
    return ok(undefined);
  }
  const errors: ValidationIssue[] = [];
  for (const stat of STAT_IDS) {
    const value = stats[stat];
    if (!Number.isInteger(value) || value < limits.min || value > limits.max) {
      errors.push({
        code: "stats.range",
        field: `customBaseStats.${stat}`,
        message: `${STAT_LABELS[stat]} must be a whole number from ${limits.min} to ${limits.max}.`,
      });
    }
  }
  if (errors.length > 0) {
    return fail(errors);
  }
  if (limits.budget !== null && baseStatTotal(stats) > limits.budget) {
    return fail([
      {
        code: "stats.budget",
        field: "customBaseStats",
        message: `These base stats add up to ${baseStatTotal(stats)}. This format allows ${limits.budget}. Lower a stat or raise the budget.`,
      },
    ]);
  }
  return ok({ ...stats });
}

export function statLimitsForFormat(format: Pick<BattleFormat, "statMin" | "statMax" | "statBudget">): StatLimits {
  return { min: format.statMin, max: format.statMax, budget: format.statBudget };
}

/**
 * The Builder type picker stays closed until this Pokémon's change is turned on,
 * or the set already has a typing override.
 */
export function showCustomTypePicker(
  enabled: boolean,
  customTypes: readonly PokemonType[] | undefined,
): boolean {
  return enabled || customTypes !== undefined;
}

/**
 * The Builder base-stat picker stays closed until this Pokémon's change is turned on,
 * or the set already has a base-stat override.
 */
export function showCustomStatPicker(enabled: boolean, customBaseStats: StatSpread | undefined): boolean {
  return enabled || customBaseStats !== undefined;
}

export function customTypesAllowed(format: Pick<BattleFormat, "typePolicy">): boolean {
  return format.typePolicy === "custom";
}

export function customStatsAllowed(format: Pick<BattleFormat, "statPolicy">): boolean {
  return format.statPolicy === "custom";
}

/** A spread the editor can show: the custom stats, or the species stats when there is no override. */
export function editingBaseStats(species: StatSpread, custom: StatSpread | undefined): StatSpread {
  return custom ? { ...custom } : { ...species };
}

export function withBaseStat(stats: StatSpread, stat: StatId, value: number): StatSpread {
  return { ...stats, [stat]: value };
}
