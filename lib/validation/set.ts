import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonSet, PokemonSetDraft } from "@/lib/types/session";
import { validateAbility, validateItem, validateNature } from "@/lib/validation/identity";
import {
  validateGender,
  validateLevel,
  validateShiny,
  validateTeraType,
} from "@/lib/validation/details";
import { validateEvs } from "@/lib/validation/ev";
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

  const evs = validateEvs(draft.evs);
  const ivs = validateIvs(draft.ivs);
  const nature = validateNature(draft.natureId);
  const ability = validateAbility(draft.abilityId);
  const item = validateItem(draft.itemId);
  const moves = validateMoves(draft.moveIds);
  const tera = validateTeraType(draft.teraType);
  const gender = validateGender(draft.gender, pokemon?.genderRule ?? "mixed");
  const level = validateLevel(draft.level);
  const shiny = validateShiny(draft.shiny);

  for (const result of [evs, ivs, nature, ability, item, moves, tera, gender, level, shiny]) {
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
    !shiny.ok
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
  });
}
