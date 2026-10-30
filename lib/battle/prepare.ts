import type { BattleCombatant, BattleSnapshot } from "@/lib/battle/damage";
import { createBattleSnapshot } from "@/lib/battle/damage";
import { natureWouldWrap, statBeforeNature } from "@/lib/battle/showdownMath";
import { validateFormat } from "@/lib/formats/validate";
import {
  customStatsAllowed,
  customTypesAllowed,
  effectiveBaseStats,
  effectiveTypes,
  statLimitsForFormat,
  validateCustomBaseStats,
  validateCustomTypes,
} from "@/lib/pokemon/customAttributes";
import type { BattleFormat } from "@/lib/formats/schema";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { PokemonSet } from "@/lib/types/session";
import { STAT_IDS, STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";
import { MAX_LEVEL, MIN_LEVEL } from "@/lib/validation/details";
import type { ValidationIssue } from "@/lib/validation/result";

export interface StagedPokemon {
  speciesId: string;
  speciesName: string;
  speciesTypes: readonly PokemonType[];
  speciesBase: StatSpread;
  customTypes?: readonly PokemonType[];
  customBaseStats?: StatSpread;
  level: number;
  ivs: StatSpread;
  evs: StatSpread;
  plusStat: StatId | null;
  minusStat: StatId | null;
}

export type PrepareResult =
  | { ok: true; snapshot: BattleSnapshot; warnings: string[] }
  | { ok: false; errors: ValidationIssue[] };

/**
 * Copies the format and the two Pokémon into one battle snapshot.
 * The species objects passed in are read and then left alone.
 */
export function prepareBattle(input: {
  battleId: string;
  format: BattleFormat;
  attacker: StagedPokemon;
  defender: StagedPokemon;
}): PrepareResult {
  const errors = [
    ...validateFormat(input.format),
    ...stagedErrors(input.attacker, input.format, "attacker"),
    ...stagedErrors(input.defender, input.format, "defender"),
  ];
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const warnings =
    input.format.structure === "doubles"
      ? [
          "This format is doubles. The number below is one single-target hit and does not include the doubles spread modifier.",
        ]
      : [];
  return {
    ok: true,
    warnings,
    snapshot: createBattleSnapshot(input.battleId, input.format.id || "unsaved", toCombatant(input.attacker), toCombatant(input.defender)),
  };
}

export function validateTeamAgainstFormat(
  sets: readonly PokemonSet[],
  format: BattleFormat,
  speciesIdFor: (pokemonId: string) => string | undefined,
): ValidationIssue[] {
  const errors = validateFormat(format);
  if (sets.length === 0) {
    errors.push({
      code: "team.empty",
      field: "team",
      message: "Add at least one Pokémon before checking this team.",
    });
  }
  if (sets.length > format.teamSize) {
    errors.push({
      code: "team.size",
      field: "team",
      message: `This format allows ${format.teamSize} Pokémon. This team has ${sets.length}.`,
    });
  }

  if (format.speciesClause) {
    const seen = new Map<string, number>();
    for (const set of sets) {
      const speciesId = speciesIdFor(set.pokemonId) ?? set.pokemonId;
      seen.set(speciesId, (seen.get(speciesId) ?? 0) + 1);
    }
    for (const [speciesId, count] of seen) {
      if (count > 1) {
        errors.push({
          code: "team.species",
          field: "team",
          message: `Species Clause: ${speciesId} is on this team ${count} times. Remove one, or turn Species Clause off.`,
        });
      }
    }
  }

  if (format.itemClause) {
    const items = new Map<string, number>();
    for (const set of sets) {
      if (!set.itemId) {
        continue;
      }
      items.set(set.itemId, (items.get(set.itemId) ?? 0) + 1);
    }
    for (const [itemId, count] of items) {
      if (count > 1) {
        errors.push({
          code: "team.item",
          field: "team",
          message: `Item Clause: ${itemId} is held ${count} times. Change one item, or turn Item Clause off.`,
        });
      }
    }
  }

  sets.forEach((set, index) => {
    const slot = `Pokémon ${index + 1}`;
    if (format.shinyPolicy === "forbidden" && set.shiny) {
      errors.push({
        code: "team.shiny",
        field: `sets.${index}.shiny`,
        message: `${slot} is shiny. This format does not allow shiny Pokémon. The Randomizer's shiny chance is a separate setting.`,
      });
    }
    if (!customTypesAllowed(format) && set.customTypes) {
      errors.push({
        code: "team.types",
        field: `sets.${index}.customTypes`,
        message: `${slot} has custom types. This format uses species typing. Remove the custom types, or customize the format.`,
      });
    }
    if (set.customTypes) {
      const typed = validateCustomTypes(set.customTypes);
      if (!typed.ok) {
        errors.push(...typed.errors.map((error) => ({ ...error, message: `${slot}: ${error.message}` })));
      }
    }
    if (!customStatsAllowed(format) && set.customBaseStats) {
      errors.push({
        code: "team.stats",
        field: `sets.${index}.customBaseStats`,
        message: `${slot} has custom base stats. This format uses species base stats. Remove them, or customize the format.`,
      });
    }
    if (set.customBaseStats && customStatsAllowed(format)) {
      const stats = validateCustomBaseStats(set.customBaseStats, statLimitsForFormat(format));
      if (!stats.ok) {
        errors.push(...stats.errors.map((error) => ({ ...error, message: `${slot}: ${error.message}` })));
      }
    }
  });

  return errors;
}

function stagedErrors(pokemon: StagedPokemon, format: BattleFormat, field: string): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!Number.isInteger(pokemon.level) || pokemon.level < MIN_LEVEL || pokemon.level > MAX_LEVEL) {
    errors.push({
      code: "battle.level",
      field: `${field}.level`,
      message: `${pokemon.speciesName} must be level ${MIN_LEVEL} to ${MAX_LEVEL}.`,
    });
  }
  if (!customTypesAllowed(format) && pokemon.customTypes) {
    errors.push({
      code: "battle.types",
      field: `${field}.customTypes`,
      message: `${pokemon.speciesName} has custom types, and ${format.name || "this format"} uses species typing. Customize the format to allow them.`,
    });
  }
  if (pokemon.customTypes) {
    const typed = validateCustomTypes(pokemon.customTypes);
    if (!typed.ok) {
      errors.push(...typed.errors.map((error) => ({ ...error, field: `${field}.${error.field}` })));
    }
  }
  if (!customStatsAllowed(format) && pokemon.customBaseStats) {
    errors.push({
      code: "battle.stats",
      field: `${field}.customBaseStats`,
      message: `${pokemon.speciesName} has custom base stats, and ${format.name || "this format"} uses species base stats. Customize the format to allow them.`,
    });
  }
  if (pokemon.customBaseStats && customStatsAllowed(format)) {
    const stats = validateCustomBaseStats(pokemon.customBaseStats, statLimitsForFormat(format));
    if (!stats.ok) {
      errors.push(
        ...stats.errors.map((error) => ({
          ...error,
          field: `${field}.${error.field}`,
          message: `${pokemon.speciesName}: ${error.message}`,
        })),
      );
    }
  }
  const types = effectiveTypes(pokemon.speciesTypes, pokemon.customTypes);
  if (types.length === 0) {
    errors.push({
      code: "battle.types",
      field: `${field}.types`,
      message: `${pokemon.speciesName} needs a type.`,
    });
  }
  for (const stat of STAT_IDS) {
    if (stat === "hp") {
      continue;
    }
    const nature = stat === pokemon.plusStat ? "boost" : stat === pokemon.minusStat ? "drop" : "neutral";
    const base = (pokemon.customBaseStats ?? pokemon.speciesBase)[stat];
    const before = statBeforeNature({
      base,
      iv: pokemon.ivs[stat],
      ev: pokemon.evs[stat],
      level: pokemon.level,
    });
    if (natureWouldWrap(before, nature)) {
      errors.push({
        code: "battle.wrap",
        field: `${field}.${stat}`,
        message: `${pokemon.speciesName}'s ${STAT_LABELS[stat]} would wrap under a ${nature === "boost" ? "boosting" : "lowering"} Nature. Lower that base stat or change the Nature.`,
      });
    }
  }
  return errors;
}

function toCombatant(pokemon: StagedPokemon): BattleCombatant {
  return {
    speciesId: pokemon.speciesId,
    speciesName: pokemon.speciesName,
    types: effectiveTypes(pokemon.speciesTypes, pokemon.customTypes),
    baseStats: effectiveBaseStats(pokemon.speciesBase, pokemon.customBaseStats),
    level: pokemon.level,
    ivs: { ...pokemon.ivs },
    evs: { ...pokemon.evs },
    plusStat: pokemon.plusStat,
    minusStat: pokemon.minusStat,
  };
}
