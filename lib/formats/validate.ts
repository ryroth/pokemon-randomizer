import {
  FORMAT_SCHEMA_VERSION,
  MAX_CUSTOM_BASE_STAT,
  MAX_FORMAT_DESCRIPTION_LENGTH,
  MAX_FORMAT_NAME_LENGTH,
  MAX_FORMAT_TEAM_SIZE,
  MIN_CUSTOM_BASE_STAT,
  MIN_FORMAT_TEAM_SIZE,
  type BattleFormat,
} from "@/lib/formats/schema";
import type { ValidationIssue } from "@/lib/validation/result";

const EXPERIENCES = new Set([
  "beginner-friendly",
  "standard-competitive",
  "advanced-competitive",
  "casual-experimentation",
  "custom-rules",
]);

export function validateFormat(format: BattleFormat): ValidationIssue[] {
  const errors: ValidationIssue[] = [];

  if (format.schemaVersion !== FORMAT_SCHEMA_VERSION) {
    errors.push({
      code: "format.version",
      field: "schemaVersion",
      message: "This format was saved by a different version of the app and cannot be used.",
    });
  }

  const name = format.name.trim();
  if (!name) {
    errors.push({
      code: "format.name",
      field: "name",
      message: "Enter a name for this format.",
    });
  } else if (name.length > MAX_FORMAT_NAME_LENGTH) {
    errors.push({
      code: "format.name",
      field: "name",
      message: `A format name can be ${MAX_FORMAT_NAME_LENGTH} characters.`,
    });
  }

  if (format.description.trim().length > MAX_FORMAT_DESCRIPTION_LENGTH) {
    errors.push({
      code: "format.description",
      field: "description",
      message: `The description can be ${MAX_FORMAT_DESCRIPTION_LENGTH} characters.`,
    });
  }

  if (format.generation !== 9) {
    errors.push({
      code: "format.generation",
      field: "generation",
      message: "The damage check only supports generation 9. Pick generation 9.",
    });
  }

  if (format.structure !== "singles" && format.structure !== "doubles") {
    errors.push({
      code: "format.structure",
      field: "structure",
      message: "Choose singles or doubles.",
    });
  }

  if (
    !Number.isInteger(format.teamSize) ||
    format.teamSize < MIN_FORMAT_TEAM_SIZE ||
    format.teamSize > MAX_FORMAT_TEAM_SIZE
  ) {
    errors.push({
      code: "format.teamSize",
      field: "teamSize",
      message: `Team size must be a whole number from ${MIN_FORMAT_TEAM_SIZE} to ${MAX_FORMAT_TEAM_SIZE}. Saved teams hold 6.`,
    });
  }

  if (!EXPERIENCES.has(format.experience)) {
    errors.push({
      code: "format.experience",
      field: "experience",
      message: "Choose a description of who this format is for.",
    });
  }

  if (format.shinyPolicy !== "allowed" && format.shinyPolicy !== "forbidden") {
    errors.push({
      code: "format.shinyPolicy",
      field: "shinyPolicy",
      message: "Choose whether shiny Pokémon are allowed.",
    });
  }

  if (format.typePolicy !== "species" && format.typePolicy !== "custom") {
    errors.push({
      code: "format.typePolicy",
      field: "typePolicy",
      message: "Choose species typing or custom typing.",
    });
  }

  if (format.statPolicy !== "species" && format.statPolicy !== "custom") {
    errors.push({
      code: "format.statPolicy",
      field: "statPolicy",
      message: "Choose species base stats or custom base stats.",
    });
  }

  if (
    !Number.isInteger(format.statMin) ||
    !Number.isInteger(format.statMax) ||
    format.statMin < MIN_CUSTOM_BASE_STAT ||
    format.statMax > MAX_CUSTOM_BASE_STAT ||
    format.statMin > format.statMax
  ) {
    errors.push({
      code: "format.statLimits",
      field: "statMin",
      message: `Base stat limits must be whole numbers from ${MIN_CUSTOM_BASE_STAT} to ${MAX_CUSTOM_BASE_STAT}, and the minimum cannot be above the maximum.`,
    });
  }

  if (format.statPolicy === "species" && format.statBudget !== null) {
    errors.push({
      code: "format.statBudget",
      field: "statBudget",
      message: "A base-stat budget only applies when custom base stats are allowed. Turn custom stats on, or clear the budget.",
    });
  }

  if (format.statBudget !== null) {
    const floor = format.statMin * 6;
    const ceiling = format.statMax * 6;
    if (!Number.isInteger(format.statBudget) || format.statBudget < floor || format.statBudget > ceiling) {
      errors.push({
        code: "format.statBudget",
        field: "statBudget",
        message: `The base-stat budget must be a whole number from ${floor} to ${ceiling}, because each of the six stats is limited.`,
      });
    }
  }

  if (
    format.support.aiBattle ||
    format.support.localMultiplayer ||
    format.support.onlineMultiplayer ||
    format.support.replay
  ) {
    errors.push({
      code: "format.support",
      field: "support",
      message: "AI battles, multiplayer, and replays are not available. Leave those off.",
    });
  }

  if (!format.support.damagePreview || !format.support.teamValidation) {
    errors.push({
      code: "format.support",
      field: "support",
      message: "This format has to allow the team check and the damage check.",
    });
  }

  return errors;
}
