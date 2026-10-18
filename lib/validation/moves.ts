import { isLearnableMove } from "@/lib/filters/moves";
import { fail, ok, type ValidationResult } from "@/lib/validation/result";
import type { ValidationIssue } from "@/lib/validation/result";

/** A Pokémon has four move slots. */
export const MAX_MOVE_COUNT = 4;
/**
 * A set needs at least one move. Fewer than four is fine: Protect with Last Resort, or a lone
 * Splash, are real sets.
 */
export const MIN_MOVE_COUNT = 1;

export function validateMoves(
  moveIds: Array<string | undefined> | undefined,
): ValidationResult<string[]> {
  const selected = (moveIds ?? []).filter((id): id is string => Boolean(id));

  if (selected.length < MIN_MOVE_COUNT) {
    return fail([
      {
        code: "moves.too-few",
        field: "moveIds",
        message: "Choose at least one move.",
      },
    ]);
  }

  if (selected.length > MAX_MOVE_COUNT) {
    return fail([
      {
        code: "moves.too-many",
        field: "moveIds",
        message: `A Pokémon can only have ${MAX_MOVE_COUNT} moves.`,
      },
    ]);
  }

  const errors: ValidationIssue[] = [];
  if (selected.some((id) => !isLearnableMove({ id }))) {
    errors.push({
      code: "moves.struggle",
      field: "moveIds",
      message: "Struggle is used when a Pokémon is out of PP. It cannot be one of its moves.",
    });
  }
  const seen = new Set<string>();
  for (const id of selected) {
    if (seen.has(id)) {
      errors.push({
        code: "moves.duplicate",
        field: "moveIds",
        message: "Each move can only be selected once.",
      });
      break;
    }
    seen.add(id);
  }

  if (errors.length > 0) {
    return fail(errors);
  }

  return ok(selected);
}
