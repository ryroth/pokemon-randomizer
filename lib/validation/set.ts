import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonSet, PokemonSetDraft } from "@/lib/types/session";
import { STAT_IDS, STAT_LABELS, type StatSpread } from "@/lib/types/stats";
import { validateAbility, validateItem, validateNature } from "@/lib/validation/identity";
import {
  validateGender,
  validateHappiness,
  validateLevel,
  validateNickname,
  validateShiny,
  validateTeraType,
} from "@/lib/validation/details";
import { evsCountingBlanksAsZero, validateEvs } from "@/lib/validation/ev";
import { validateIvs } from "@/lib/validation/iv";
import { validateMoves } from "@/lib/validation/moves";
import {
  fail,
  ok,
  type ValidationIssue,
  type ValidationResult,
} from "@/lib/validation/result";

export function validateSet(
  draft: PokemonSetDraft,
  pokemon: PokemonForm | undefined,
): ValidationResult<PokemonSet> {
  const errors: ValidationIssue[] = [];

  if (!draft.pokemonId || !pokemon) {
    errors.push({
      code: "pokemon.missing",
      field: "pokemonId",
      message: "Select a Pokémon before finishing the set.",
    });
  }

  if (!draft.evsConfirmed) {
    errors.push({
      code: "evs.unconfirmed",
      field: "evs",
      message: "Review and confirm the EV spread before finishing this Pokémon.",
    });
  }

  const evs = validateEvs(evsCountingBlanksAsZero(draft.evs));
  const ivs = validateSpreadField(draft.ivs, "ivs", "IVs", validateIvs);
  const nature = validateNature(draft.natureId);
  const ability = validateAbility(draft.abilityId);
  const item = validateItem(draft.itemId);
  const moves = validateMoves(draft.moveIds);
  const tera = validateTeraType(draft.teraType);
  const gender = validateGender(draft.gender, pokemon?.genderRule ?? "mixed");
  const level = validateLevel(draft.level);
  const shiny = validateShiny(draft.shiny);
  const happiness = validateHappiness(draft.happiness);
  const nickname = validateNickname(draft.nickname);

  for (const result of [evs, ivs, nature, ability, item, moves, tera, gender, level, shiny, happiness, nickname]) {
    if (!result.ok) {
      errors.push(...result.errors);
    }
  }

  if (errors.length > 0 || !pokemon) {
    return fail(errors);
  }

  if (
    !evs.ok ||
    !ivs.ok ||
    !nature.ok ||
    !ability.ok ||
    !item.ok ||
    !moves.ok ||
    !tera.ok ||
    !gender.ok ||
    !level.ok ||
    !shiny.ok ||
    !happiness.ok ||
    !nickname.ok
  ) {
    return fail(errors);
  }

  return ok({
    pokemonId: pokemon.id,
    itemId: item.value,
    abilityId: ability.value,
    moveIds: moves.value,
    evs: evs.value,
    ivs: ivs.value,
    natureId: nature.value,
    teraType: tera.value,
    gender: gender.value,
    level: level.value,
    shiny: shiny.value,
    nickname: nickname.value,
    happiness: happiness.value,
  });
}

function validateSpreadField(
  spread: Partial<StatSpread> | undefined,
  field: "evs" | "ivs",
  label: "EVs" | "IVs",
  validate: (value: StatSpread | undefined) => ValidationResult<StatSpread>,
): ValidationResult<StatSpread> {
  if (!spread || STAT_IDS.every((stat) => spread[stat] === undefined)) {
    return validate(undefined);
  }

  const missing = STAT_IDS.filter((stat) => typeof spread[stat] !== "number");
  if (missing.length > 0) {
    return fail(
      missing.map((stat) => ({
        code: `${field}.incomplete`,
        field: `${field}.${stat}`,
        message: `Enter ${STAT_LABELS[stat]} ${label} before finishing this Pokémon.`,
      })),
    );
  }

  return validate(spread as StatSpread);
}
