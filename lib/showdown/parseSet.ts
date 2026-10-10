import { STAT_IDS, type StatId, type StatSpread } from "@/lib/types/stats";

/** Pokémon Showdown's own id rule: lowercase letters and digits only. */
export function showdownId(name: string | undefined): string {
  return name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "") : "";
}

/** One set as written in the paste. Names are still text, not catalog ids. */
export interface ParsedSet {
  /** 1-based position in the paste. */
  position: number;
  nickname?: string;
  species: string;
  gender?: "M" | "F";
  item?: string;
  ability?: string;
  level?: number;
  shiny?: boolean;
  happiness?: number;
  teraType?: string;
  evs: Partial<StatSpread>;
  ivs: Partial<StatSpread>;
  nature?: string;
  moves: string[];
  /** Plain-language problems found while reading the text, such as a stat that is not a number. */
  problems: string[];
}

export const MAX_IMPORT_CHARS = 20_000;

const STAT_ALIASES: Record<string, StatId> = {
  hp: "hp",
  atk: "atk",
  attack: "atk",
  def: "def",
  defense: "def",
  spa: "spa",
  satk: "spa",
  spatk: "spa",
  spatt: "spa",
  spattack: "spa",
  spc: "spa",
  spd: "spd",
  sdef: "spd",
  spdef: "spd",
  spdefense: "spd",
  spe: "spe",
  speed: "spe",
};

/**
 * Reads Pokémon Showdown text into sets. Sets are separated by a blank line. Lines such as
 * `=== [gen9ou] Folder/Team ===` are skipped. Nothing here knows about the catalog.
 */
export function parseShowdownText(text: string): ParsedSet[] {
  const blocks = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !/^===.*===$/.test(line)),
    )
    .filter((lines) => lines.length > 0);

  return blocks.map((lines, index) => parseBlock(lines, index + 1));
}

function parseBlock(lines: string[], position: number): ParsedSet {
  const set: ParsedSet = { position, species: "", evs: {}, ivs: {}, moves: [], problems: [] };
  const [header, ...rest] = lines;
  parseHeader(header ?? "", set);

  for (const line of rest) {
    if (line.startsWith("-")) {
      const move = line.replace(/^-+\s*/, "").trim();
      if (move) {
        set.moves.push(move);
      }
      continue;
    }

    const natureMatch = /^(.+?)\s+nature$/i.exec(line);
    if (natureMatch) {
      set.nature = natureMatch[1]?.trim();
      continue;
    }

    const colon = line.indexOf(":");
    if (colon === -1) {
      set.problems.push(`I did not understand the line "${line}".`);
      continue;
    }
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    switch (key) {
      case "ability":
        set.ability = value;
        break;
      case "level":
        set.level = wholeNumber(value, "Level", set);
        break;
      case "happiness":
        set.happiness = wholeNumber(value, "Happiness", set);
        break;
      case "shiny":
        set.shiny = /^(yes|true)$/i.test(value);
        break;
      case "tera type":
        set.teraType = value;
        break;
      case "evs":
        parseStats(value, "EVs", set.evs, set);
        break;
      case "ivs":
        parseStats(value, "IVs", set.ivs, set);
        break;
      case "nature":
        set.nature = value;
        break;
      default:
        // Gigantamax, Dynamax Level, Hidden Power, and similar lines are not part of a set here.
        break;
    }
  }

  return set;
}

function parseHeader(header: string, set: ParsedSet): void {
  let rest = header;
  const at = rest.lastIndexOf(" @ ");
  if (at !== -1) {
    const item = rest.slice(at + 3).trim();
    if (item && showdownId(item) !== "noitem" && showdownId(item) !== "none") {
      set.item = item;
    }
    rest = rest.slice(0, at);
  }
  rest = rest.trim();

  const gender = /\s*\(([MF])\)$/.exec(rest);
  if (gender) {
    set.gender = gender[1] === "F" ? "F" : "M";
    rest = rest.slice(0, gender.index).trim();
  }

  const nicknamed = /^(.*)\s+\(([^()]+)\)$/.exec(rest);
  if (nicknamed) {
    set.nickname = nicknamed[1]?.trim() || undefined;
    set.species = nicknamed[2]?.trim() ?? "";
  } else {
    set.species = rest;
  }
}

function wholeNumber(value: string, label: string, set: ParsedSet): number | undefined {
  if (!/^\d+$/.test(value)) {
    set.problems.push(`${label} should be a whole number, but the paste says "${value}".`);
    return undefined;
  }
  return Number(value);
}

function parseStats(value: string, label: string, target: Partial<StatSpread>, set: ParsedSet): void {
  for (const part of value.split("/")) {
    const match = /^\s*(\d+)\s+([A-Za-z.]+)\s*$/.exec(part);
    const stat = match ? STAT_ALIASES[match[2]?.toLowerCase().replace(/[^a-z]/g, "") ?? ""] : undefined;
    if (!match || !stat || !STAT_IDS.includes(stat)) {
      set.problems.push(`I did not understand "${part.trim()}" in the ${label} line.`);
      continue;
    }
    target[stat] = Number(match[1]);
  }
}
