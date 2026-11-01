import type { PokemonType } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import { STAT_IDS, STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";
import { CARD_FACTS, CARD_FACT_LABELS, type CardFact } from "@/lib/types/card-facts";

/** The phrase that stands in for a Pokémon's name inside a clue entry. */
export const REDACTED_POKEMON_NAME = "This Pokemon";

const SPECIES_CARD_FACTS = [
  "species",
  "height",
  "weight",
  "color",
  "bodyShape",
  "eggGroup",
  "cry",
] as const satisfies readonly CardFact[];

/**
 * Suffixes after the last hyphen of a form name. Stripping them finds the species name a
 * Pokédex entry still uses, such as Weezing inside Weezing-Galar. Ho-Oh and Porygon-Z stay whole.
 */
const FORM_SUFFIXES = new Set([
  "alola",
  "galar",
  "hisui",
  "paldea",
  "mega",
  "x",
  "y",
  "origin",
  "therian",
  "incarnate",
  "primal",
  "attack",
  "defense",
  "speed",
  "heat",
  "wash",
  "frost",
  "fan",
  "mow",
  "sandy",
  "trash",
  "dusk",
  "midday",
  "midnight",
  "f",
  "m",
  "male",
  "female",
  "eternal",
  "crowned",
  "ice",
  "shadow",
  "bloodmoon",
  "wellspring",
  "hearthflame",
  "cornerstone",
  "teal",
  "unbound",
  "pom",
  "phd",
  "libre",
  "pau",
  "sensu",
  "baile",
  "complete",
]);

export function showsCardFact(facts: readonly CardFact[], fact: CardFact): boolean {
  return facts.includes(fact);
}

export function showsEveryCardFact(facts: readonly CardFact[]): boolean {
  return CARD_FACTS.every((fact) => facts.includes(fact));
}

/**
 * A guessing generation stays on the chosen clues until one of its Pokémon is selected.
 * That selection opens every card in the generation to the usual full set.
 */
export function usesFullGeneratedCard(
  facts: readonly CardFact[],
  generationRevealed: boolean,
): boolean {
  return showsEveryCardFact(facts) || generationRevealed;
}

export function showsSpeciesCardFacts(facts: readonly CardFact[]): boolean {
  return SPECIES_CARD_FACTS.some((fact) => facts.includes(fact));
}

/**
 * Which type badges to draw. All three typing choices, or primary and secondary together, show
 * every type once. Primary or secondary alone shows that slot. A single-typed Pokémon has no
 * secondary type.
 */
export function typesToShow(
  types: readonly PokemonType[],
  facts: readonly CardFact[],
): PokemonType[] {
  const primary = facts.includes("primaryType");
  const secondary = facts.includes("secondaryType");
  const both = facts.includes("bothTypes");
  if (both || (primary && secondary)) {
    return [...types];
  }
  if (primary) {
    return types[0] ? [types[0]] : [];
  }
  if (secondary) {
    return types[1] ? [types[1]] : [];
  }
  return [];
}

export function extremeStatLabels(stats: StatSpread, which: "high" | "low"): string {
  let best = which === "high" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  const ids: StatId[] = [];
  for (const id of STAT_IDS) {
    const value = stats[id];
    const wins = which === "high" ? value > best : value < best;
    if (wins) {
      best = value;
      ids.length = 0;
      ids.push(id);
    } else if (value === best) {
      ids.push(id);
    }
  }
  return joinPhrases(ids.map((id) => `${STAT_LABELS[id]} ${stats[id]}`));
}

export function describeShownCardFacts(facts: readonly CardFact[]): string {
  const selected = CARD_FACTS.filter((fact) => facts.includes(fact));
  if (selected.length === CARD_FACTS.length) {
    return "Everything";
  }
  if (selected.length === 0) {
    return "Nothing";
  }
  const hidden = CARD_FACTS.filter((fact) => !facts.includes(fact));
  if (hidden.length <= 3 && selected.length > hidden.length) {
    return `Everything except ${hidden.map((fact) => CARD_FACT_LABELS[fact]).join(", ")}`;
  }
  return selected.map((fact) => CARD_FACT_LABELS[fact]).join(", ");
}

/** Display name, then the species name once known form suffixes are peeled off. Longest first. */
export function pokemonNameAliases(displayName: string): string[] {
  const names = [displayName];
  let current = displayName;
  while (true) {
    const hyphen = current.lastIndexOf("-");
    if (hyphen <= 0) {
      break;
    }
    const suffix = current.slice(hyphen + 1).toLowerCase();
    if (!FORM_SUFFIXES.has(suffix)) {
      break;
    }
    current = current.slice(0, hyphen);
    names.push(current);
  }
  return [...new Set(names)].sort((left, right) => right.length - left.length);
}

export function redactPokemonNames(text: string, names: readonly string[]): string {
  const ordered = [...names].filter((name) => name.length > 0).sort((left, right) => right.length - left.length);
  let result = text;
  for (const name of ordered) {
    const pattern = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(name)}(?![A-Za-z0-9])`, "gi");
    result = result.replace(pattern, REDACTED_POKEMON_NAME);
  }
  return result;
}

/**
 * A saved config from before card facts existed keeps every fact. One that had turned the
 * Pokédex checkbox off drops that fact, so the entry stays hidden.
 */
export function applyStoredCardFacts(config: RandomizerConfig, stored: object): RandomizerConfig {
  const base = Array.isArray(config.shownCardFacts)
    ? config
    : { ...config, shownCardFacts: [...CARD_FACTS] };
  const record = stored as { shownCardFacts?: unknown; showPokedexEntry?: unknown };
  if (Array.isArray(record.shownCardFacts)) {
    const selected = new Set(record.shownCardFacts.filter(isCardFact));
    const shownCardFacts = CARD_FACTS.filter((fact) => selected.has(fact));
    return {
      ...base,
      shownCardFacts,
      showPokedexEntry: shownCardFacts.includes("pokedexEntry"),
    };
  }
  if (record.showPokedexEntry === false) {
    return {
      ...base,
      shownCardFacts: base.shownCardFacts.filter((fact) => fact !== "pokedexEntry"),
      showPokedexEntry: false,
    };
  }
  return base;
}

function isCardFact(value: unknown): value is CardFact {
  return typeof value === "string" && (CARD_FACTS as readonly string[]).includes(value);
}

function joinPhrases(phrases: readonly string[]): string {
  if (phrases.length === 0) {
    return "";
  }
  if (phrases.length === 1) {
    return phrases[0] ?? "";
  }
  if (phrases.length === 2) {
    return `${phrases[0]} and ${phrases[1]}`;
  }
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
