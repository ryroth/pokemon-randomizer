import { hiddenAbilityId } from "@/lib/builder/abilities";
import {
  MAX_IMPORT_CHARS,
  parseShowdownText,
  showdownId,
  type ParsedSet,
} from "@/lib/showdown/parseSet";
import { TERA_TYPES, type TeraType } from "@/lib/types/pokemon-type";
import type { PokemonSet } from "@/lib/types/session";
import { PERFECT_IVS, STAT_IDS, type StatSpread } from "@/lib/types/stats";
import type { GenderRule } from "@/lib/types/taxonomy";
import { DEFAULT_HAPPINESS, MAX_LEVEL } from "@/lib/validation/details";
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

/**
 * Turns pasted Showdown text into finished sets. A set is only accepted when every part the app
 * never fills in for you is in the paste: Ability, Nature, Tera Type, four moves, and a gender
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
  if (parsed.moves.length !== 4) {
    problems.push(`A set needs exactly 4 moves, and this one has ${parsed.moves.length}.`);
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
