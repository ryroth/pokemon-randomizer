import { fail, ok, type ValidationResult } from "@/lib/validation/result";
import type { ValidationIssue } from "@/lib/validation/result";

export const REQUIRED_MOVE_COUNT = 4;

export function validateMoves(
  moveIds: Array<string | undefined> | undefined,
): ValidationResult<[string, string, string, string]> {
  const selected = (moveIds ?? []).filter((id): id is string => Boolean(id));

  if (selected.length < REQUIRED_MOVE_COUNT) {
    return fail([
      {
        code: "moves.too-few",
        field: "moveIds",
        message: `Choose ${REQUIRED_MOVE_COUNT} moves. You currently have ${selected.length}.`,
      },
    ]);
  }

  if (selected.length > REQUIRED_MOVE_COUNT) {
    return fail([
      {
        code: "moves.too-many",
        field: "moveIds",
        message: `A Pokémon can only have ${REQUIRED_MOVE_COUNT} moves.`,
      },
    ]);
  }

  const errors: ValidationIssue[] = [];
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

  return ok(selected as [string, string, string, string]);
}
