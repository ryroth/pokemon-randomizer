import { TERA_TYPES, type TeraType } from "@/lib/types/pokemon-type";
import type { Gender, GenderRule } from "@/lib/types/taxonomy";
import { fail, ok, type ValidationResult } from "@/lib/validation/result";

export function validateTeraType(
  teraType: TeraType | undefined,
): ValidationResult<TeraType> {
  if (!teraType) {
    return fail([
      {
        code: "tera.missing",
        field: "teraType",
        message: "Choose a Tera type before finishing this Pokémon.",
      },
    ]);
  }

  if (!TERA_TYPES.includes(teraType)) {
    return fail([
      {
        code: "tera.invalid",
        field: "teraType",
        message: "That Tera type is not valid.",
      },
    ]);
  }

  return ok(teraType);
}

export function validateGender(
  gender: Gender | undefined,
  genderRule: GenderRule,
): ValidationResult<Gender | null> {
  if (genderRule === "genderless") {
    return ok(null);
  }

  if (genderRule === "male") {
    return ok("M");
  }

  if (genderRule === "female") {
    return ok("F");
  }

  if (!gender) {
    return fail([
      {
        code: "gender.missing",
        field: "gender",
        message: "Choose Male or Female before finishing this Pokémon.",
      },
    ]);
  }

  return ok(gender);
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;

export function validateLevel(level: number | undefined): ValidationResult<number> {
  if (level === undefined) {
    return fail([
      {
        code: "level.missing",
        field: "level",
        message: "Choose a level before finishing this Pokémon.",
      },
    ]);
  }

  if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
    return fail([
      {
        code: "level.range",
        field: "level",
        message: `Level must be a whole number between ${MIN_LEVEL} and ${MAX_LEVEL}.`,
      },
    ]);
  }

  return ok(level);
}

export function validateShiny(shiny: boolean | undefined): ValidationResult<boolean> {
  if (shiny === undefined) {
    return fail([
      {
        code: "shiny.missing",
        field: "shiny",
        message: "Choose whether this Pokémon is shiny.",
      },
    ]);
  }

  return ok(shiny);
}
