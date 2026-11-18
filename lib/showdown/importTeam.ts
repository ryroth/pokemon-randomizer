import { hiddenAbilityId } from "@/lib/builder/abilities";
import { requiredFormItemId } from "@/lib/data/formItems";
import { isLearnableMove } from "@/lib/filters/moves";
import {
  MAX_IMPORT_CHARS,
  parseShowdownText,
  showdownId,
  type ParsedSet,
} from "@/lib/showdown/parseSet";
import { TERA_TYPES, type TeraType } from "@/lib/types/pokemon-type";
import type { DraftedPokemon, PokemonSet, PokemonSetDraft } from "@/lib/types/session";
import { PERFECT_IVS, STAT_IDS, STAT_LABELS, type StatSpread } from "@/lib/types/stats";
import type { GenderRule } from "@/lib/types/taxonomy";
import { DEFAULT_HAPPINESS, MAX_HAPPINESS, MAX_LEVEL, MAX_NICKNAME_LENGTH, MIN_HAPPINESS, MIN_LEVEL } from "@/lib/validation/details";
import { MAX_EV_PER_STAT, MAX_EV_TOTAL } from "@/lib/validation/ev";
import { MAX_IV, MIN_IV } from "@/lib/validation/iv";
import { MAX_MOVE_COUNT, MIN_MOVE_COUNT } from "@/lib/validation/moves";
import { validateSet } from "@/lib/validation/set";
import type { PokemonForm } from "@/lib/types/pokemon";

/** The part of the catalog the importer needs. The server passes the real one. */
export interface ImportCatalog {
  pokemon: ReadonlyArray<{
    id: string;
    showdownName: string;
    displayName: string;
    genderRule: GenderRule;
    abilityIds: readonly string[];
  }>;
  abilities: ReadonlyArray<{ id: string; showdownName: string }>;
  moves: ReadonlyArray<{ id: string; showdownName: string }>;
  items: ReadonlyArray<{ id: string; showdownName: string }>;
  natures: ReadonlyArray<{ id: string; showdownName: string }>;
}

export type ImportedSetResult =
  | { ok: true; position: number; label: string; set: PokemonSet }
  | { ok: false; position: number; label: string; problems: string[] };

export type ImportPreview =
  | { ok: true; results: ImportedSetResult[] }
  | { ok: false; message: string };

export const MAX_IMPORT_SETS = 6;

export type UnbuiltImportResult =
  | { ok: true; position: number; label: string; pokemon: DraftedPokemon }
  | { ok: false; position: number; label: string; problems: string[] };

export type UnbuiltImportPreview =
  | { ok: true; results: UnbuiltImportResult[] }
  | { ok: false; message: string };

/**
 * Turns a paste into unbuilt Pokémon. A species name is enough. Ability, item, moves, Nature,
 * Tera type, EVs, and the rest are kept when the paste includes them and left blank when it does not.
 * Nothing here is locked: the randomizer did not choose these parts.
 */
export function previewUnbuiltImport(text: string, catalog: ImportCatalog): UnbuiltImportPreview {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, message: "Paste a Pokémon Showdown team first." };
  }
  if (text.length > MAX_IMPORT_CHARS) {
    return { ok: false, message: "That paste is too long. A team of six is well under 20,000 characters." };
  }
  const parsed = parseShowdownText(text);
  if (parsed.length === 0) {
    return { ok: false, message: "I could not find any Pokémon in that text." };
  }
  if (parsed.length > MAX_IMPORT_SETS) {
    return {
      ok: false,
      message: `That paste has ${parsed.length} Pokémon. A team holds ${MAX_IMPORT_SETS}, so paste at most ${MAX_IMPORT_SETS}.`,
    };
  }
  const lookups = buildLookups(catalog);
  return { ok: true, results: parsed.map((set) => resolveUnbuiltSet(set, lookups)) };
}

/**
 * Turns pasted Showdown text into finished sets. A set is only accepted when every part the app
 * never fills in for you is in the paste: Ability, Nature, Tera Type, one to four moves, and a gender
 * for species that have both. Anything unknown or missing is reported in plain language so the
 * paste can be fixed and read again.
 */
export function previewShowdownImport(text: string, catalog: ImportCatalog): ImportPreview {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, message: "Paste a Pokémon Showdown team first." };
  }
  if (text.length > MAX_IMPORT_CHARS) {
    return { ok: false, message: "That paste is too long. A team of six is well under 20,000 characters." };
  }
  const parsed = parseShowdownText(text);
  if (parsed.length === 0) {
    return { ok: false, message: "I could not find any Pokémon in that text." };
  }
  if (parsed.length > MAX_IMPORT_SETS) {
    return {
      ok: false,
      message: `That paste has ${parsed.length} Pokémon. A team holds ${MAX_IMPORT_SETS}, so paste at most ${MAX_IMPORT_SETS}.`,
    };
  }
  const lookups = buildLookups(catalog);
  return { ok: true, results: parsed.map((set) => resolveParsedSet(set, catalog, lookups)) };
}

interface Lookups {
  pokemon: Map<string, ImportCatalog["pokemon"][number]>;
  abilities: Map<string, string>;
  moves: Map<string, string>;
  items: Map<string, string>;
  natures: Map<string, string>;
}

function indexByName(entries: ReadonlyArray<{ id: string; showdownName: string }>): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of entries) {
    // Several Showdown names can share one id (Hidden Power types), so keep the first of each name.
    const nameKey = showdownId(entry.showdownName);
    if (nameKey && !map.has(nameKey)) {
      map.set(nameKey, entry.id);
    }
    if (!map.has(entry.id)) {
      map.set(entry.id, entry.id);
    }
  }
  return map;
}

function buildLookups(catalog: ImportCatalog): Lookups {
  const pokemon = new Map<string, ImportCatalog["pokemon"][number]>();
  for (const form of catalog.pokemon) {
    pokemon.set(form.id, form);
    const nameKey = showdownId(form.showdownName);
    if (nameKey && !pokemon.has(nameKey)) {
      pokemon.set(nameKey, form);
    }
  }
  return {
    pokemon,
    abilities: indexByName(catalog.abilities),
    moves: indexByName(catalog.moves),
    items: indexByName(catalog.items),
    natures: indexByName(catalog.natures),
  };
}

function resolveParsedSet(parsed: ParsedSet, catalog: ImportCatalog, lookups: Lookups): ImportedSetResult {
  const problems = [...parsed.problems];
  const label = setLabel(parsed);

  const form = parsed.species ? lookups.pokemon.get(showdownId(parsed.species)) : undefined;
  if (!parsed.species) {
    problems.push("The first line should name a Pokémon.");
  } else if (!form) {
    problems.push(`I do not know a Pokémon called "${parsed.species}".`);
  }

  let abilityId: string | undefined;
  if (!parsed.ability) {
    problems.push("Add an Ability line.");
  } else {
    abilityId = lookups.abilities.get(showdownId(parsed.ability));
    if (!abilityId) {
      problems.push(`I do not know an ability called "${parsed.ability}".`);
    } else if (form) {
      const allowed = new Set([...form.abilityIds, hiddenAbilityId(form.id)].filter(Boolean));
      if (!allowed.has(abilityId)) {
        problems.push(`${form.displayName} cannot have the ability "${parsed.ability}".`);
      }
    }
  }

  let itemId: string | null = null;
  if (parsed.item) {
    const found = lookups.items.get(showdownId(parsed.item));
    if (!found) {
      problems.push(`I do not know an item called "${parsed.item}".`);
    } else {
      itemId = found;
    }
  }

  let natureId: string | undefined;
  if (!parsed.nature) {
    problems.push("Add a Nature line, such as \"Jolly Nature\".");
  } else {
    natureId = lookups.natures.get(showdownId(parsed.nature));
    if (!natureId) {
      problems.push(`I do not know a Nature called "${parsed.nature}".`);
    }
  }

  let teraType: TeraType | undefined;
  if (!parsed.teraType) {
    problems.push("Add a Tera Type line, such as \"Tera Type: Water\".");
  } else {
    teraType = TERA_TYPES.find((type) => type === parsed.teraType?.trim().toLowerCase());
    if (!teraType) {
      problems.push(`"${parsed.teraType}" is not a Tera type.`);
    }
  }

  if (form?.genderRule === "mixed" && !parsed.gender) {
    problems.push("This species can be male or female. Add (M) or (F) after the name.");
  }

  const moveIds: string[] = [];
  for (const name of parsed.moves) {
    const moveId = lookups.moves.get(showdownId(name));
    if (!moveId) {
      problems.push(`I do not know a move called "${name}".`);
    } else {
      moveIds.push(moveId);
    }
  }
  if (parsed.moves.length < MIN_MOVE_COUNT) {
    problems.push("Add at least one move line, such as \"- Protect\".");
  } else if (parsed.moves.length > MAX_MOVE_COUNT) {
    problems.push(`A set can have at most ${MAX_MOVE_COUNT} moves, and this one has ${parsed.moves.length}.`);
  }

  if (problems.length > 0 || !form || !abilityId || !natureId || !teraType) {
    return { ok: false, position: parsed.position, label, problems };
  }

  const ivs: StatSpread = { ...PERFECT_IVS };
  for (const stat of STAT_IDS) {
    const value = parsed.ivs[stat];
    if (value !== undefined) {
      ivs[stat] = value;
    }
  }

  const validated = validateSet(
    {
      pokemonId: form.id,
      itemId,
      abilityId,
      moveIds,
      evs: parsed.evs,
      ivs,
      natureId,
      teraType,
      gender: parsed.gender,
      level: parsed.level ?? MAX_LEVEL,
      shiny: parsed.shiny ?? false,
      nickname: parsed.nickname,
      happiness: parsed.happiness ?? DEFAULT_HAPPINESS,
    },
    // validateSet only reads the gender rule here.
    { genderRule: form.genderRule, id: form.id } as PokemonForm,
  );

  if (!validated.ok) {
    return { ok: false, position: parsed.position, label, problems: validated.errors.map((issue) => issue.message) };
  }
  return { ok: true, position: parsed.position, label, set: validated.value };
}

function setLabel(parsed: ParsedSet): string {
  if (!parsed.species) {
    return `Pokémon ${parsed.position}`;
  }
  return parsed.nickname ? `${parsed.nickname} (${parsed.species})` : parsed.species;
}

function resolveUnbuiltSet(parsed: ParsedSet, lookups: Lookups): UnbuiltImportResult {
  const problems = [...parsed.problems];
  const label = setLabel(parsed);
  const form = parsed.species ? lookups.pokemon.get(showdownId(parsed.species)) : undefined;
  if (!parsed.species) {
    problems.push("The first line should name a Pokémon.");
  } else if (!form) {
    problems.push(`I do not know a Pokémon called "${parsed.species}".`);
  }

  let abilityId: string | undefined;
  if (parsed.ability) {
    abilityId = lookups.abilities.get(showdownId(parsed.ability));
    if (!abilityId) {
      problems.push(`I do not know an ability called "${parsed.ability}".`);
    } else if (form) {
      const allowed = new Set([...form.abilityIds, hiddenAbilityId(form.id)].filter(Boolean));
      if (!allowed.has(abilityId)) {
        problems.push(`${form.displayName} cannot have the ability "${parsed.ability}".`);
      }
    }
  }

  let itemId: string | null | undefined;
  if (parsed.item) {
    const found = lookups.items.get(showdownId(parsed.item));
    if (!found) {
      problems.push(`I do not know an item called "${parsed.item}".`);
    } else {
      itemId = found;
    }
  }

  let natureId: string | undefined;
  if (parsed.nature) {
    natureId = lookups.natures.get(showdownId(parsed.nature));
    if (!natureId) {
      problems.push(`I do not know a Nature called "${parsed.nature}".`);
    }
  }

  let teraType: TeraType | undefined;
  if (parsed.teraType) {
    teraType = TERA_TYPES.find((type) => type === parsed.teraType?.trim().toLowerCase());
    if (!teraType) {
      problems.push(`"${parsed.teraType}" is not a Tera type.`);
    }
  }

  if (form && parsed.gender) {
    const genderProblem = genderOnForm(parsed.gender, form.genderRule, form.displayName);
    if (genderProblem) {
      problems.push(genderProblem);
    }
  }

  const moveIds: string[] = [];
  const seenMoves = new Set<string>();
  for (const name of parsed.moves) {
    const moveId = lookups.moves.get(showdownId(name));
    if (!moveId) {
      problems.push(`I do not know a move called "${name}".`);
    } else if (!isLearnableMove({ id: moveId })) {
      problems.push("Struggle is used when a Pokémon is out of PP. It cannot be one of its moves.");
    } else if (seenMoves.has(moveId)) {
      problems.push(`This set lists ${name} more than once.`);
    } else {
      seenMoves.add(moveId);
      moveIds.push(moveId);
    }
  }
  if (parsed.moves.length > MAX_MOVE_COUNT) {
    problems.push(`A set can have at most ${MAX_MOVE_COUNT} moves, and this one has ${parsed.moves.length}.`);
  }

  const evs = partialStats(parsed.evs, "EVs", MAX_EV_PER_STAT, MAX_EV_TOTAL, problems);
  const ivs = partialStats(parsed.ivs, "IVs", MAX_IV, Number.POSITIVE_INFINITY, problems);

  let level: number | undefined;
  if (parsed.level !== undefined) {
    if (!Number.isInteger(parsed.level) || parsed.level < MIN_LEVEL || parsed.level > MAX_LEVEL) {
      problems.push(`Level must be a whole number between ${MIN_LEVEL} and ${MAX_LEVEL}.`);
    } else {
      level = parsed.level;
    }
  }

  let happiness: number | undefined;
  if (parsed.happiness !== undefined) {
    if (!Number.isInteger(parsed.happiness) || parsed.happiness < MIN_HAPPINESS || parsed.happiness > MAX_HAPPINESS) {
      problems.push(`Happiness must be a whole number from ${MIN_HAPPINESS} to ${MAX_HAPPINESS}.`);
    } else {
      happiness = parsed.happiness;
    }
  }

  let nickname: string | undefined;
  if (parsed.nickname) {
    if (parsed.nickname.length > MAX_NICKNAME_LENGTH) {
      problems.push(`A nickname can be at most ${MAX_NICKNAME_LENGTH} characters.`);
    } else {
      nickname = parsed.nickname;
    }
  }

  if (problems.length > 0 || !form) {
    return { ok: false, position: parsed.position, label, problems };
  }

  const requiredItemId = requiredFormItemId(form.id);
  const draft: PokemonSetDraft = {
    pokemonId: form.id,
    moveIds: Array.from({ length: MAX_MOVE_COUNT }, (_, index) => moveIds[index]),
  };
  if (abilityId) {
    draft.abilityId = abilityId;
  }
  if (requiredItemId) {
    draft.itemId = requiredItemId;
  } else if (itemId !== undefined) {
    draft.itemId = itemId;
  }
  if (natureId) {
    draft.natureId = natureId;
  }
  if (teraType) {
    draft.teraType = teraType;
  }
  if (form.genderRule === "mixed" && parsed.gender) {
    draft.gender = parsed.gender;
  }
  if (level !== undefined) {
    draft.level = level;
  }
  if (happiness !== undefined) {
    draft.happiness = happiness;
  }
  if (nickname) {
    draft.nickname = nickname;
  }
  if (parsed.shiny) {
    draft.shiny = true;
  }
  if (evs) {
    draft.evs = evs;
  }
  if (ivs) {
    draft.ivs = ivs;
  }

  return {
    ok: true,
    position: parsed.position,
    label,
    pokemon: {
      draft,
      locks: { ability: false, item: false, moveSlots: [false, false, false, false] },
    },
  };
}

function genderOnForm(gender: "M" | "F", rule: GenderRule, name: string): string | null {
  if (rule === "genderless") {
    return `${name} has no gender. Remove (M) or (F).`;
  }
  if (rule === "male" && gender === "F") {
    return `${name} is male. Remove (F).`;
  }
  if (rule === "female" && gender === "M") {
    return `${name} is female. Remove (M).`;
  }
  return null;
}

function partialStats(
  stats: Partial<StatSpread>,
  label: string,
  perStatMax: number,
  totalMax: number,
  problems: string[],
): Partial<StatSpread> | undefined {
  const present = STAT_IDS.filter((stat) => stats[stat] !== undefined);
  if (present.length === 0) {
    return undefined;
  }
  let total = 0;
  let failed = false;
  for (const stat of present) {
    const value = stats[stat];
    if (value === undefined || !Number.isInteger(value) || value < MIN_IV || value > perStatMax) {
      problems.push(`${STAT_LABELS[stat]} ${label} must be a whole number from 0 to ${perStatMax}.`);
      failed = true;
      continue;
    }
    total += value;
  }
  if (total > totalMax) {
    problems.push(`This Pokémon uses ${total} ${label}. The maximum is ${totalMax}.`);
    failed = true;
  }
  if (failed) {
    return undefined;
  }
  const next: Partial<StatSpread> = {};
  for (const stat of present) {
    next[stat] = stats[stat];
  }
  return next;
}
