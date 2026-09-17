import type { MoveCategory } from "../../lib/types/catalog-entities";
import type { PokemonType } from "../../lib/types/pokemon-type";
import { POKEMON_TYPES } from "../../lib/types/pokemon-type";
import type { StatId } from "../../lib/types/stats";
import type { GenderRule, Generation } from "../../lib/types/taxonomy";

export function toShowdownId(name: string | undefined): string {
  if (!name) {
    return "";
  }
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function toPokeApiKebab(name: string | undefined): string {
  if (!name) {
    return "";
  }
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’']/g, "")
    .replace(/%/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Showdown ids whose PokéAPI pokemon slug is not a plain kebab of the teambuilder name.
 * Tried first during join so the importer spends fewer 404s on known mismatches.
 */
export const SHOWDOWN_ID_TO_POKEAPI: Record<string, string> = {
  aegislash: "aegislash-shield",
  aegislashblade: "aegislash-blade",
  basculegion: "basculegion-male",
  basculegionf: "basculegion-female",
  basculin: "basculin-red-striped",
  burmy: "burmy-plant",
  darmanitan: "darmanitan-standard",
  darmanitangalar: "darmanitan-galar-standard",
  deoxys: "deoxys-normal",
  dudunsparce: "dudunsparce-two-segment",
  dudunsparcethreesegment: "dudunsparce-three-segment",
  eiscue: "eiscue-ice",
  eiscuenoice: "eiscue-noice",
  enamorus: "enamorus-incarnate",
  frillish: "frillish-male",
  gastrodon: "gastrodon-west",
  giratina: "giratina-altered",
  gourgeist: "gourgeist-average",
  greninjabond: "greninja-battle-bond",
  indeedee: "indeedee-male",
  indeedeef: "indeedee-female",
  jellicent: "jellicent-male",
  keldeo: "keldeo-ordinary",
  landorus: "landorus-incarnate",
  lycanroc: "lycanroc-midday",
  maushold: "maushold-family-of-three",
  mausholdfour: "maushold-family-of-four",
  meloetta: "meloetta-aria",
  meowstic: "meowstic-male",
  meowsticf: "meowstic-female",
  mimikyu: "mimikyu-disguised",
  mimikyubusted: "mimikyu-busted",
  minior: "minior-red",
  miniormeteor: "minior-red-meteor",
  morpeko: "morpeko-full-belly",
  morpekohangry: "morpeko-hangry",
  necrozmadawnwings: "necrozma-dawn",
  necrozmaduskmane: "necrozma-dusk",
  ogerponcornerstone: "ogerpon-cornerstone-mask",
  ogerponhearthflame: "ogerpon-hearthflame-mask",
  ogerponwellspring: "ogerpon-wellspring-mask",
  oinkologne: "oinkologne-male",
  oinkolognef: "oinkologne-female",
  oricorio: "oricorio-baile",
  palafin: "palafin-zero",
  pikachualola: "pikachu-alola-cap",
  pikachuhoenn: "pikachu-hoenn-cap",
  pikachukalos: "pikachu-kalos-cap",
  pikachuoriginal: "pikachu-original-cap",
  pikachupartner: "pikachu-partner-cap",
  pikachusinnoh: "pikachu-sinnoh-cap",
  pikachuunova: "pikachu-unova-cap",
  pikachuworld: "pikachu-world-cap",
  pumpkaboo: "pumpkaboo-average",
  pyroar: "pyroar-male",
  rockruffdusk: "rockruff-own-tempo",
  shaymin: "shaymin-land",
  shellos: "shellos-west",
  squawkabilly: "squawkabilly-green-plumage",
  squawkabillyblue: "squawkabilly-blue-plumage",
  squawkabillywhite: "squawkabilly-white-plumage",
  squawkabillyyellow: "squawkabilly-yellow-plumage",
  tatsugiri: "tatsugiri-curly",
  taurospaldeaaqua: "tauros-paldea-aqua-breed",
  taurospaldeablaze: "tauros-paldea-blaze-breed",
  taurospaldeacombat: "tauros-paldea-combat-breed",
  thundurus: "thundurus-incarnate",
  tornadus: "tornadus-incarnate",
  toxtricity: "toxtricity-amped",
  toxtricitygmax: "toxtricity-amped-gmax",
  urshifu: "urshifu-single-strike",
  urshifugmax: "urshifu-single-strike-gmax",
  wishiwashi: "wishiwashi-solo",
  wishiwashischool: "wishiwashi-school",
  wormadam: "wormadam-plant",
  zygarde: "zygarde-50",
  zygarde10: "zygarde-10",
};

export interface ShowdownNameParts {
  id: string;
  name: string;
  forme: string;
  baseSpecies: string;
}

export function showdownNameToPokeApiSlugs(input: ShowdownNameParts): string[] {
  const slugs: string[] = [];
  const add = (value: string | undefined) => {
    if (!value) {
      return;
    }
    if (!slugs.includes(value)) {
      slugs.push(value);
    }
  };

  add(SHOWDOWN_ID_TO_POKEAPI[input.id]);
  add(toPokeApiKebab(input.name));

  const kebab = toPokeApiKebab(input.name);
  const base = toPokeApiKebab(input.baseSpecies);
  const forme = toPokeApiKebab(input.forme);

  if (input.forme) {
    add(`${base}-${forme}`);
  }

  if (kebab.endsWith("-f")) {
    add(`${kebab.slice(0, -2)}-female`);
  }
  if (input.forme === "M" && kebab.endsWith("-m")) {
    add(`${kebab.slice(0, -2)}-male`);
  }
  if (/mask|wellspring|hearthflame|cornerstone/i.test(input.forme)) {
    add(`${kebab}-mask`);
    add(`${base}-${forme}-mask`);
  }
  if (/paldea|combat|blaze|aqua/i.test(input.forme)) {
    add(`${kebab}-breed`);
    add(`${base}-${forme}-breed`);
  }
  if (/pikachu/i.test(input.baseSpecies) && input.forme) {
    add(`${kebab}-cap`);
  }
  if (/squawkabilly/i.test(input.baseSpecies) && input.forme) {
    add(`${kebab}-plumage`);
  }

  return slugs;
}

export function pokeApiSlugToShowdownId(slug: string): string {
  let normalized = slug.toLowerCase();
  normalized = normalized.replace(/-female$/, "f");
  normalized = normalized.replace(/-mask$/, "");
  normalized = normalized.replace(/-breed$/, "");
  normalized = normalized.replace(/-power-construct$/, "");
  return toShowdownId(normalized);
}

export function genderRuleFromRate(rate: number): GenderRule {
  if (rate === -1) {
    return "genderless";
  }
  if (rate === 0) {
    return "male";
  }
  if (rate === 8) {
    return "female";
  }
  return "mixed";
}

const GENERATION_BY_SLUG: Record<string, Generation> = {
  "generation-i": 1,
  "generation-ii": 2,
  "generation-iii": 3,
  "generation-iv": 4,
  "generation-v": 5,
  "generation-vi": 6,
  "generation-vii": 7,
  "generation-viii": 8,
  "generation-ix": 9,
};

export function generationFromPokeApi(name: string): Generation | null {
  return GENERATION_BY_SLUG[name] ?? null;
}

export function generationFromNumber(value: number): Generation | null {
  if (value >= 1 && value <= 9) {
    return value as Generation;
  }
  return null;
}

export function parsePokemonType(value: string): PokemonType | null {
  const lowered = value.toLowerCase();
  return (POKEMON_TYPES as readonly string[]).includes(lowered)
    ? (lowered as PokemonType)
    : null;
}

export function parseMoveCategory(value: string): MoveCategory | null {
  const lowered = value.toLowerCase();
  if (lowered === "physical" || lowered === "special" || lowered === "status") {
    return lowered;
  }
  return null;
}

export function pokeApiStatToId(name: string): StatId | null {
  switch (name) {
    case "hp":
      return "hp";
    case "attack":
      return "atk";
    case "defense":
      return "def";
    case "special-attack":
      return "spa";
    case "special-defense":
      return "spd";
    case "speed":
      return "spe";
    default:
      return null;
  }
}
