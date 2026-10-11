import { speciesGenus } from "@/lib/data/genera";
import { pokemonImage } from "@/lib/art/pokemonImage";
import { exportShowdownSet } from "@/lib/showdown/exportSet";
import { calculateBattleStats, type CalculatedStat } from "@/lib/stats/battleStat";
import type { MoveCategory } from "@/lib/types/catalog-entities";
import type { PokemonType, TeraType } from "@/lib/types/pokemon-type";
import type { PokemonSet, RandomizerSession } from "@/lib/types/session";
import type { StatId, StatSpread } from "@/lib/types/stats";
import type { Gender } from "@/lib/types/taxonomy";

export interface RecapPokemon {
  id: string;
  speciesId: string;
  nationalDexNumber: number;
  form: string;
  displayName: string;
  showdownName: string;
  types: PokemonType[];
  dexEntries: ReadonlyArray<{ text: string }>;
  baseStats: StatSpread;
  sprites: {
    sprite: string | null;
    spriteShiny: string | null;
    artwork: string | null;
    artworkShiny: string | null;
  };
}

export interface RecapAbility {
  id: string;
  showdownName: string;
  description: string;
}

export interface RecapMove {
  id: string;
  showdownName: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  description: string;
}

export interface RecapItem {
  id: string;
  showdownName: string;
  description: string;
  iconUrl?: string | null;
}

export interface RecapNature {
  id: string;
  showdownName: string;
  plusStat: StatId | null;
  minusStat: StatId | null;
}

export interface RecapCatalog {
  pokemon: readonly RecapPokemon[];
  abilities: readonly RecapAbility[];
  moves: readonly RecapMove[];
  items: readonly RecapItem[];
  natures: readonly RecapNature[];
}

export interface RecapMoveView {
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  description: string;
}

/** One Pokémon that will be pasted into Pokémon Showdown. */
export interface RecapEntry {
  pokemonId: string;
  /** Species whose Pokédex entries from every generation can be shown. */
  speciesId: string;
  speciesName: string;
  /** English PokéAPI genus, such as EleFish Pokémon. */
  genus: string | null;
  nickname: string | null;
  dexNumber: string;
  types: PokemonType[];
  dexText: string | null;
  /** The still picture: official artwork in the matching regular or shiny colors. */
  imageUrl: string | null;
  abilityName: string;
  abilityDescription: string;
  itemName: string | null;
  itemDescription: string | null;
  itemIconUrl: string | null;
  natureName: string;
  teraType: TeraType;
  /** One to four moves, in slot order. */
  moves: RecapMoveView[];
  stats: CalculatedStat[];
  gender: Gender | null;
  level: number;
  shiny: boolean;
  happiness: number;
  evs: StatSpread;
  showdownText: string;
}

export type RecapView =
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | { status: "ready"; entries: RecapEntry[] };

const INVALID_SET_MESSAGE = "This finished set does not match the current catalog.";

/**
 * V1 stores one finalized set. The recap still lists every set that will be exported,
 * one Pokédex card per Pokémon.
 */
export function buildRecap(
  session: RandomizerSession,
  catalog: RecapCatalog,
): RecapView {
  if (!session.finalizedSet) {
    return { status: "empty" };
  }

  const entry = buildRecapEntry(session.finalizedSet, catalog);
  if (!entry) {
    return { status: "invalid", message: INVALID_SET_MESSAGE };
  }
  return { status: "ready", entries: [entry] };
}

export function buildRecapEntry(
  set: PokemonSet,
  catalog: RecapCatalog,
): RecapEntry | null {
  const pokemon = catalog.pokemon.find((form) => form.id === set.pokemonId);
  const ability = catalog.abilities.find((candidate) => candidate.id === set.abilityId);
  const nature = catalog.natures.find((candidate) => candidate.id === set.natureId);
  if (!pokemon || !ability || !nature) {
    return null;
  }

  const item = set.itemId ? catalog.items.find((candidate) => candidate.id === set.itemId) : null;
  if (set.itemId && !item) {
    return null;
  }

  const moveViews = resolveMoves(set.moveIds, catalog.moves);
  if (!moveViews) {
    return null;
  }
  const nickname = set.nickname?.trim() ? set.nickname.trim() : null;
  const dexText = pokemon.dexEntries.find((entry) => entry.text.trim().length > 0)?.text ?? null;

  return {
    pokemonId: pokemon.id,
    speciesId: pokemon.speciesId,
    speciesName: pokemon.displayName,
    genus: speciesGenus(pokemon.speciesId),
    nickname,
    dexNumber: formatDexNumber(pokemon.nationalDexNumber),
    types: pokemon.types,
    dexText,
    imageUrl: pokemonImage(pokemon, set.shiny),
    abilityName: ability.showdownName,
    abilityDescription: ability.description,
    itemName: item?.showdownName ?? null,
    itemDescription: item?.description ?? null,
    itemIconUrl: item?.iconUrl ?? null,
    natureName: nature.showdownName,
    teraType: set.teraType,
    moves: moveViews.map(toMoveView),
    stats: calculateBattleStats({
      base: pokemon.baseStats,
      ivs: set.ivs,
      evs: set.evs,
      level: set.level,
      plusStat: nature.plusStat,
      minusStat: nature.minusStat,
    }).stats,
    gender: set.gender,
    level: set.level,
    shiny: set.shiny,
    happiness: set.happiness,
    evs: set.evs,
    showdownText: exportShowdownSet(set, {
      pokemon: pokemon.showdownName,
      ability: ability.showdownName,
      item: item?.showdownName ?? null,
      nature: nature.showdownName,
      moves: moveViews.map((move) => move.showdownName),
    }),
  };
}

function toMoveView(move: RecapMove): RecapMoveView {
  return {
    name: move.showdownName,
    type: move.type,
    category: move.category,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    description: move.description,
  };
}

function resolveMoves(
  moveIds: PokemonSet["moveIds"],
  moves: readonly RecapMove[],
): RecapMove[] | null {
  if (moveIds.length === 0) {
    return null;
  }
  const resolved: RecapMove[] = [];
  for (const moveId of moveIds) {
    const move = moves.find((candidate) => candidate.id === moveId);
    if (!move) {
      return null;
    }
    resolved.push(move);
  }
  return resolved;
}

export function formatDexNumber(nationalDexNumber: number): string {
  return String(nationalDexNumber).padStart(4, "0");
}
