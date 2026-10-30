/**
 * Versioned battle-format configuration.
 *
 * A format describes rules. It does not contain Pokémon, and it never changes the catalog.
 * Custom types and base stats live on a Pokémon set. The format only says whether those
 * overrides are allowed when a team is checked or a damage preview is built.
 *
 * Precedence, from lowest to highest:
 * 1. The species entry in the catalog (never edited).
 * 2. The parent preset's rules, copied onto a variant when the user customizes it.
 * 3. The saved format's own switches (species clause, shiny, typing, base stats).
 * 4. The overrides on one Pokémon set.
 * 5. The copy stored on one battle snapshot.
 *
 * A later step does not rewrite an earlier one. If a set's overrides are not allowed by the
 * format, the check fails instead of guessing.
 *
 * Showdown's team paste cannot store custom types or custom base stats. Those fields stay in
 * this app. See `customAttributeNote` in `lib/showdown/exportSet.ts`.
 */

export const FORMAT_SCHEMA_VERSION = 1 as const;

export const FORMAT_STORAGE_KEY = "pokemon-randomizer.formats.v1";
export const LAST_FORMAT_STORAGE_KEY = "pokemon-randomizer.battle-format.v1";

export const MAX_FORMAT_NAME_LENGTH = 48;
export const MAX_FORMAT_DESCRIPTION_LENGTH = 280;
export const MIN_FORMAT_TEAM_SIZE = 1;
export const MAX_FORMAT_TEAM_SIZE = 6;
export const MIN_CUSTOM_BASE_STAT = 1;
export const MAX_CUSTOM_BASE_STAT = 255;

/** Pokémon Showdown snapshot these preset texts were transcribed from. */
export const SHOWDOWN_FORMAT_SNAPSHOT = "7244fe8e28fa8bc4d0809ae30d183c608b62bb2b";

export const SHOWDOWN_FORMATS_URL = `https://github.com/smogon/pokemon-showdown/blob/${SHOWDOWN_FORMAT_SNAPSHOT}/config/formats.ts`;

export type FormatOrigin = "simulator" | "app" | "user";

export type ExperienceLabel =
  | "beginner-friendly"
  | "standard-competitive"
  | "advanced-competitive"
  | "casual-experimentation"
  | "custom-rules";

export type BattleStructure = "singles" | "doubles";

/** Shiny is cosmetic. This policy is whether a set may be marked shiny. */
export type ShinyPolicy = "allowed" | "forbidden";

/** Whether a set may replace the species typing or base stats. */
export type AttributePolicy = "species" | "custom";

/**
 * What this app can actually do with the format. Full battles, AI, multiplayer, and replays
 * are false until a battle engine exists. Do not flip them to true in saved data.
 */
export interface FormatSupport {
  bringTeam: boolean;
  teamValidation: boolean;
  damagePreview: boolean;
  aiBattle: false;
  localMultiplayer: false;
  onlineMultiplayer: false;
  replay: false;
}

export interface BattleFormat {
  schemaVersion: typeof FORMAT_SCHEMA_VERSION;
  id: string;
  name: string;
  description: string;
  audience: string;
  experience: ExperienceLabel;
  origin: FormatOrigin;
  /** Preset this variant was copied from. Null for a format started from scratch. */
  parentId: string | null;
  /** `formatRevision` of the parent at the time of the copy. */
  parentRevision: string | null;
  /**
   * True for built-in presets. Saving always writes a separate user format, so a preset
   * cannot be overwritten.
   */
  locked: boolean;
  generation: 9;
  /** Showdown mod name, such as `gen9`. Display only. */
  mod: string;
  structure: BattleStructure;
  teamSize: number;
  /** The format's level rule, in the simulator's words. This app's sets are still level 1–100. */
  levelRule: string;
  /** Ruleset names as written in Showdown's format entry. Display only. */
  ruleset: string[];
  /** Banlist names as written in Showdown's format entry. This app does not enforce them. */
  banlist: string[];
  /** Clauses after the ruleset is expanded. Display only, except where a switch below matches. */
  clauses: string[];
  speciesClause: boolean;
  itemClause: boolean;
  shinyPolicy: ShinyPolicy;
  typePolicy: AttributePolicy;
  statPolicy: AttributePolicy;
  /** Maximum total of the six base stats. Null means no budget. Only used when stats are custom. */
  statBudget: number | null;
  statMin: number;
  statMax: number;
  support: FormatSupport;
}

export const EXPERIENCE_LABELS: Record<ExperienceLabel, string> = {
  "beginner-friendly": "Beginner-friendly",
  "standard-competitive": "Standard competitive",
  "advanced-competitive": "Advanced competitive",
  "casual-experimentation": "Casual experimentation",
  "custom-rules": "Custom rules",
};

export const STRUCTURE_LABELS: Record<BattleStructure, string> = {
  singles: "Singles",
  doubles: "Doubles",
};

const APP_SUPPORT: FormatSupport = {
  bringTeam: true,
  teamValidation: true,
  damagePreview: true,
  aiBattle: false,
  localMultiplayer: false,
  onlineMultiplayer: false,
  replay: false,
};

export function appFormatSupport(): FormatSupport {
  return { ...APP_SUPPORT };
}

/** Rules this app will actually accept or reject. Banlists and sleep clauses are not in here. */
export function rulesThisAppChecks(format: BattleFormat): string[] {
  const rules = [
    "Damage check: one generation 9 hit, with no abilities, items, weather, or critical hits",
  ];
  if (format.structure === "doubles") {
    rules.push("Doubles is not played");
  } else {
    rules.push("Singles battle on one screen, with turns, switching, and a 1-in-24 critical hit");
    rules.push("Levitate, Huge Power, Pure Power, Choice Band, Choice Specs, Choice Scarf, and Life Orb");
    rules.push("Weather, status, stat stages, and other abilities and items are not applied");
  }
  rules.push(`At most ${format.teamSize} Pokémon`, "Level 1 to 100");
  rules.push(format.speciesClause ? "Species Clause" : "Repeated species are allowed");
  rules.push(format.itemClause ? "Item Clause" : "Repeated held items are allowed");
  rules.push(
    format.shinyPolicy === "allowed"
      ? "Shiny Pokémon are allowed"
      : "Shiny Pokémon are not allowed",
  );
  rules.push(format.typePolicy === "custom" ? "Custom typing is allowed" : "Species typing only");
  rules.push(
    format.statPolicy === "custom" ? "Custom base stats are allowed" : "Species base stats only",
  );
  if (format.statPolicy === "custom") {
    rules.push(`Each base stat from ${format.statMin} to ${format.statMax}`);
    if (format.statBudget !== null) {
      rules.push(`Base stat total at most ${format.statBudget}`);
    }
  }
  return rules;
}

/** Stable fingerprint of the rules a child format inherits. Not a security hash. */
export function formatRevision(format: BattleFormat): string {
  const body = JSON.stringify({
    schemaVersion: format.schemaVersion,
    generation: format.generation,
    mod: format.mod,
    structure: format.structure,
    teamSize: format.teamSize,
    levelRule: format.levelRule,
    ruleset: format.ruleset,
    banlist: format.banlist,
    clauses: format.clauses,
    speciesClause: format.speciesClause,
    itemClause: format.itemClause,
    shinyPolicy: format.shinyPolicy,
    typePolicy: format.typePolicy,
    statPolicy: format.statPolicy,
    statBudget: format.statBudget,
    statMin: format.statMin,
    statMax: format.statMax,
  });
  let hash = 5381;
  for (let index = 0; index < body.length; index += 1) {
    hash = ((hash << 5) + hash + body.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

export function cloneFormat(format: BattleFormat): BattleFormat {
  return {
    ...format,
    ruleset: [...format.ruleset],
    banlist: [...format.banlist],
    clauses: [...format.clauses],
    support: { ...format.support },
  };
}
