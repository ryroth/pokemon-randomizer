import { fail, ok, type ValidationResult } from "@/lib/validation/result";

export function validateNature(natureId: string | undefined): ValidationResult<string> {
  if (!natureId) {
    return fail([
      {
        code: "nature.missing",
        field: "natureId",
        message: "Choose a Nature before finishing this Pokémon.",
      },
    ]);
  }

  return ok(natureId);
}

export function validateAbility(abilityId: string | undefined): ValidationResult<string> {
  if (!abilityId) {
    return fail([
      {
        code: "ability.missing",
        field: "abilityId",
        message: "Choose an ability before finishing this Pokémon.",
      },
    ]);
  }

  return ok(abilityId);
}

export function validateItem(
  itemId: string | null | undefined,
): ValidationResult<string | null> {
  if (itemId === undefined) {
    return fail([
      {
        code: "item.missing",
        field: "itemId",
        message: "Choose a held item, or explicitly choose no item.",
      },
    ]);
  }

  return ok(itemId);
}
