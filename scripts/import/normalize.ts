import type {
  Ability as ShowdownAbility,
  Item as ShowdownItem,
  Move as ShowdownMove,
  Nature as ShowdownNature,
  Species as ShowdownSpecies,
} from "@pkmn/dex";
import {
  classifyEvolutionStages,
  classifyFormType,
  isPseudoLegendarySpecies,
  type EvolutionNode,
} from "../../lib/data/classify";
import type { Ability, Item, Move, Nature } from "../../lib/types/catalog-entities";
import type { Catalog } from "../../lib/types/catalog";
import type { DexEntry, PokemonForm } from "../../lib/types/pokemon";
import type { PokemonType } from "../../lib/types/pokemon-type";
import type { PokemonSpecies } from "../../lib/types/species";
import type { StatSpread } from "../../lib/types/stats";
import type { EvolutionStage, FormType, GenderRule } from "../../lib/types/taxonomy";
import type { CatalogJoinReport, MythicalMismatch, UnmatchedJoin } from "./joinReport";
import { sortUnmatched } from "./joinReport";
import {
  generationFromNumber,
  generationFromPokeApi,
  genderRuleFromRate,
  parseMoveCategory,
  parsePokemonType,
  pokeApiStatToId,
  toPokeApiKebab,
  toShowdownId,
} from "./mapping";
import { resourceIdFromUrl } from "./pokeapi";
import type { PokeApiChainLink, PokeApiPokemon, PokeApiSnapshot, PokeApiSpecies } from "./pokeapi-types";
import { itemCategory, showdownAbilityIds, type ShowdownCatalogSources } from "./showdown";
import { englishName, uniqueEnglishFlavor } from "./text";

export interface NormalizeFormInput {
  slug: string;
  formName?: string;
  isMega?: boolean;
}

export function normalizeFormType(input: NormalizeFormInput): FormType {
  return classifyFormType(input);
}

export function buildCatalog(
  snapshot: PokeApiSnapshot,
  sources: ShowdownCatalogSources,
): { catalog: Catalog; report: CatalogJoinReport } {
  const abilities = sources.abilities.map((ability) => {
    try {
      return buildAbility(ability, snapshot);
    } catch (error) {
      throw wrapped("ability", ability.name, error);
    }
  });
  const abilityIds = new Set(abilities.map((ability) => ability.id));
  const moves = sources.moves
    .map((move) => {
      try {
        return buildMove(move, snapshot);
      } catch (error) {
        throw wrapped("move", move.name, error);
      }
    })
    .filter((move): move is Move => move !== null);
  const items = sources.items.map((item) => {
    try {
      return buildItem(item, snapshot);
    } catch (error) {
      throw wrapped("item", item.name, error);
    }
  });
  const natures = sources.natures.map((nature) => {
    try {
      return buildNature(nature, snapshot);
    } catch (error) {
      throw wrapped("nature", nature.name, error);
    }
  });

  const evolutionStages = evolutionStageMap(snapshot);
  const speciesById = new Map<string, PokemonSpecies>();
  const pokemon: PokemonForm[] = [];
  const mythicalMismatches: MythicalMismatch[] = [];
  const joinedPokeApiPokemon = new Set<string>();
  const unmatchedShowdownPokemon: string[] = [];
  const speciesByShowdownId = new Map(sources.species.map((entry) => [entry.id, entry]));

  for (const showdownSpecies of sources.species) {
    const poke = snapshot.pokemonByName.get(showdownSpecies.id);
    if (poke) {
      joinedPokeApiPokemon.add(poke.name);
    } else {
      unmatchedShowdownPokemon.push(showdownSpecies.name);
    }

    const pokeSpecies = resolvePokeApiSpecies(showdownSpecies, poke, snapshot);
    const species = upsertSpecies(
      speciesById,
      showdownSpecies,
      pokeSpecies,
      speciesByShowdownId,
      evolutionStages,
    );

    if (pokeSpecies && pokeSpecies.is_mythical !== showdownSpecies.tags.includes("Mythical")) {
      mythicalMismatches.push({
        pokeApiSlug: pokeSpecies.name,
        showdownName: showdownSpecies.name,
        pokeApiIsMythical: pokeSpecies.is_mythical,
        showdownIsMythical: showdownSpecies.tags.includes("Mythical"),
      });
    }

    try {
      pokemon.push(
        buildPokemonForm({
          showdownSpecies,
          poke,
          pokeSpecies,
          species,
          abilityIds,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new Error(`Failed to normalize ${showdownSpecies.name}: ${message}`);
    }
  }

  const catalog: Catalog = {
    version: "2.0.0",
    generatedAt: new Date().toISOString(),
    pokemon: sortById(pokemon),
    species: sortById([...speciesById.values()]),
    abilities: sortById(abilities),
    moves: sortById(moves),
    items: sortById(items),
    natures: sortById(natures),
  };

  const report: CatalogJoinReport = {
    generatedAt: catalog.generatedAt,
    catalogCounts: {
      pokemon: catalog.pokemon.length,
      species: catalog.species.length,
      abilities: catalog.abilities.length,
      moves: catalog.moves.length,
      items: catalog.items.length,
      natures: catalog.natures.length,
    },
    unmatched: {
      pokemon: sortUnmatched({
        pokeApi: snapshot.pokemonNames.filter((name) => !joinedPokeApiPokemon.has(name)),
        showdown: unmatchedShowdownPokemon,
      }),
      abilities: unmatchedFor(
        snapshot.abilityNames,
        snapshot.abilitiesByName,
        sources.abilities.map((entry) => entry.name),
      ),
      moves: unmatchedFor(
        snapshot.moveNames,
        snapshot.movesByName,
        sources.moves.map((entry) => entry.name),
      ),
      items: unmatchedFor(
        snapshot.itemNames,
        snapshot.itemsByName,
        sources.items.map((entry) => entry.name),
      ),
      natures: unmatchedFor(
        snapshot.natureNames,
        snapshot.naturesByName,
        sources.natures.map((entry) => entry.name),
      ),
    },
    mythicalMismatches: mythicalMismatches.sort((left, right) =>
      left.showdownName.localeCompare(right.showdownName),
    ),
  };

  return { catalog, report };
}

function unmatchedFor(
  pokeApiNames: string[],
  joinedByShowdownId: Map<string, { name: string }>,
  showdownNames: string[],
): UnmatchedJoin {
  const joinedPokeApi = new Set([...joinedByShowdownId.values()].map((entry) => entry.name));
  const joinedShowdownIds = new Set(joinedByShowdownId.keys());
  return sortUnmatched({
    pokeApi: pokeApiNames.filter((name) => !joinedPokeApi.has(name)),
    showdown: showdownNames.filter((name) => !joinedShowdownIds.has(toShowdownId(name))),
  });
}

function evolutionStageMap(snapshot: PokeApiSnapshot): Record<string, EvolutionStage> {
  const stages: Record<string, EvolutionStage> = {};
  for (const chain of snapshot.evolutionChainsById.values()) {
    Object.assign(stages, classifyEvolutionStages(toEvolutionNode(chain.chain)));
  }
  return stages;
}

function toEvolutionNode(link: PokeApiChainLink): EvolutionNode {
  return {
    speciesSlug: link.species.name,
    evolvesTo: link.evolves_to.map(toEvolutionNode),
  };
}

function resolvePokeApiSpecies(
  showdownSpecies: ShowdownSpecies,
  poke: PokeApiPokemon | undefined,
  snapshot: PokeApiSnapshot,
): PokeApiSpecies | undefined {
  if (poke) {
    const fromPokemon = snapshot.speciesByName.get(poke.species.name);
    if (fromPokemon) {
      return fromPokemon;
    }
  }
  return snapshot.speciesByName.get(toPokeApiKebab(showdownSpecies.baseSpecies));
}

function upsertSpecies(
  speciesById: Map<string, PokemonSpecies>,
  showdownSpecies: ShowdownSpecies,
  pokeSpecies: PokeApiSpecies | undefined,
  speciesByShowdownId: Map<string, ShowdownSpecies>,
  evolutionStages: Record<string, EvolutionStage>,
): PokemonSpecies {
  const id = pokeSpecies?.name ?? toPokeApiKebab(showdownSpecies.baseSpecies);
  const existing = speciesById.get(id);
  if (existing) {
    return existing;
  }

  const baseShowdown =
    speciesByShowdownId.get(toShowdownId(showdownSpecies.baseSpecies)) ?? showdownSpecies;
  const generation =
    (pokeSpecies?.generation ? generationFromPokeApi(pokeSpecies.generation.name) : null) ??
    generationFromNumber(baseShowdown.gen) ??
    9;
  const evolutionStage =
    (pokeSpecies ? evolutionStages[pokeSpecies.name] : undefined) ??
    evolutionStageFromShowdown(baseShowdown, speciesByShowdownId);

  const species: PokemonSpecies = {
    id,
    pokeApiId: pokeSpecies?.id ?? 0,
    pokeApiSlug: id,
    displayName: pokeSpecies ? englishName(pokeSpecies.names, showdownSpecies.baseSpecies) : showdownSpecies.baseSpecies,
    showdownName: baseShowdown.name,
    nationalDexNumber: pokeSpecies?.id ?? showdownSpecies.num,
    generation,
    isBaby: pokeSpecies?.is_baby ?? false,
    genderRule: pokeSpecies ? genderRuleFromRate(pokeSpecies.gender_rate) : genderRuleFromShowdown(baseShowdown),
    evolutionChainId: pokeSpecies ? resourceIdFromUrl(pokeSpecies.evolution_chain.url) : 0,
    evolutionStage,
  };
  speciesById.set(id, species);
  return species;
}

function evolutionStageFromShowdown(
  species: ShowdownSpecies,
  speciesByShowdownId: Map<string, ShowdownSpecies>,
): EvolutionStage {
  let depth = 0;
  let current: ShowdownSpecies | undefined = species;
  const seen = new Set<string>();

  while (current?.prevo) {
    if (seen.has(current.id)) {
      break;
    }
    seen.add(current.id);
    depth += 1;
    current = speciesByShowdownId.get(toShowdownId(current.prevo));
    if (!current) {
      break;
    }
  }

  if (depth <= 0) {
    return "basic";
  }
  if (depth === 1) {
    return "stage1";
  }
  return "stage2";
}

function genderRuleFromShowdown(species: ShowdownSpecies): GenderRule {
  if (species.gender === "N") {
    return "genderless";
  }
  if (species.gender === "M") {
    return "male";
  }
  if (species.gender === "F") {
    return "female";
  }
  const { M: male, F: female } = species.genderRatio;
  if (female === 0 && male > 0) {
    return "male";
  }
  if (male === 0 && female > 0) {
    return "female";
  }
  if (male === 0 && female === 0) {
    return "genderless";
  }
  return "mixed";
}

function buildPokemonForm(input: {
  showdownSpecies: ShowdownSpecies;
  poke: PokeApiPokemon | undefined;
  pokeSpecies: PokeApiSpecies | undefined;
  species: PokemonSpecies;
  abilityIds: Set<string>;
}): PokemonForm {
  const { showdownSpecies, poke, pokeSpecies, species, abilityIds } = input;
  const pokeApiSlug = poke?.name ?? toPokeApiKebab(showdownSpecies.name);
  const formType = classifyFormType({
    slug: pokeApiSlug,
    formName: showdownSpecies.forme || undefined,
    isMega: showdownSpecies.isMega,
  });
  const generation =
    generationFromNumber(showdownSpecies.gen) ??
    species.generation;
  const types = typesForForm(showdownSpecies, poke);
  const evolutionStage = species.evolutionStage;
  const tags = showdownSpecies.tags;

  return {
    id: showdownSpecies.id,
    pokeApiId: poke?.id ?? 0,
    pokeApiSlug,
    name: showdownSpecies.name,
    displayName: showdownSpecies.name,
    showdownName: showdownSpecies.name,
    nationalDexNumber: species.nationalDexNumber,
    generation,
    types,
    abilityIds: abilityIdsForForm(showdownSpecies, poke, abilityIds),
    speciesId: species.id,
    form: showdownSpecies.forme || "base",
    formType,
    evolutionStage,
    isBasic: evolutionStage === "basic",
    isStage1: evolutionStage === "stage1",
    isStage2: evolutionStage === "stage2",
    isPseudoLegendary: isPseudoLegendarySpecies(species.pokeApiSlug),
    isSubLegendary: tags.includes("Sub-Legendary"),
    isLegendary: tags.includes("Restricted Legendary"),
    isMythical: tags.includes("Mythical"),
    isParadox: tags.includes("Paradox"),
    isUltraBeast: tags.includes("Ultra Beast"),
    isBaby: species.isBaby,
    dexEntries: dexEntriesFor(pokeSpecies),
    sprites: {
      sprite: poke?.sprites.front_default ?? null,
      spriteShiny: poke?.sprites.front_shiny ?? null,
      artwork: poke?.sprites.other?.["official-artwork"]?.front_default ?? null,
    },
    baseStats: statsForForm(showdownSpecies, poke),
    genderRule: genderRuleFromShowdown(showdownSpecies),
  };
}

function typesForForm(showdownSpecies: ShowdownSpecies, poke: PokeApiPokemon | undefined): PokemonType[] {
  if (poke) {
    const fromApi = [...poke.types]
      .sort((left, right) => left.slot - right.slot)
      .map((entry) => parsePokemonType(entry.type.name))
      .filter((type): type is PokemonType => type !== null);
    if (fromApi.length > 0) {
      return fromApi;
    }
  }

  return showdownSpecies.types
    .map((type) => parsePokemonType(type))
    .filter((type): type is PokemonType => type !== null);
}

function abilityIdsForForm(
  showdownSpecies: ShowdownSpecies,
  poke: PokeApiPokemon | undefined,
  abilityIds: Set<string>,
): string[] {
  const fromApi =
    poke?.abilities
      .slice()
      .sort((left, right) => left.slot - right.slot)
      .map((entry) => toShowdownId(entry.ability.name))
      .filter((id) => abilityIds.has(id)) ?? [];
  const uniqueApi: string[] = [];
  for (const id of fromApi) {
    if (!uniqueApi.includes(id)) {
      uniqueApi.push(id);
    }
  }
  if (uniqueApi.length > 0) {
    return uniqueApi;
  }
  return showdownAbilityIds(showdownSpecies).filter((id) => abilityIds.has(id));
}

function statsForForm(showdownSpecies: ShowdownSpecies, poke: PokeApiPokemon | undefined): StatSpread {
  if (poke) {
    const stats: StatSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    for (const entry of poke.stats) {
      const statId = pokeApiStatToId(entry.stat.name);
      if (statId) {
        stats[statId] = entry.base_stat;
      }
    }
    return stats;
  }
  return { ...showdownSpecies.baseStats };
}

function dexEntriesFor(pokeSpecies: PokeApiSpecies | undefined): DexEntry[] {
  if (!pokeSpecies) {
    return [];
  }
  return uniqueEnglishFlavor(pokeSpecies.flavor_text_entries);
}

function buildAbility(ability: ShowdownAbility, snapshot: PokeApiSnapshot): Ability {
  const poke = snapshot.abilitiesByName.get(ability.id);
  const flavor = poke ? uniqueEnglishFlavor(poke.flavor_text_entries) : [];
  return {
    id: ability.id,
    pokeApiSlug: poke?.name ?? toPokeApiKebab(ability.name),
    name: poke ? englishName(poke.names, ability.name) : ability.name,
    showdownName: ability.name,
    description: flavor[0]?.text ?? ability.shortDesc ?? ability.desc ?? "",
  };
}

function buildMove(move: ShowdownMove, snapshot: PokeApiSnapshot): Move | null {
  const poke = snapshot.movesByName.get(move.id);
  const type = parsePokemonType(poke?.type?.name ?? move.type);
  const category = parseMoveCategory(poke?.damage_class?.name ?? move.category);
  if (!type || !category) {
    return null;
  }
  const flavor = poke ? uniqueEnglishFlavor(poke.flavor_text_entries) : [];
  return {
    id: move.id,
    pokeApiSlug: poke?.name ?? toPokeApiKebab(move.name),
    name: poke ? englishName(poke.names, move.name) : move.name,
    showdownName: move.name,
    type,
    category,
    power: poke?.power ?? (move.basePower || null),
    accuracy:
      poke?.accuracy ??
      (move.accuracy === true ? 100 : typeof move.accuracy === "number" ? move.accuracy : null),
    pp: poke?.pp ?? move.pp ?? null,
    description: flavor[0]?.text ?? move.shortDesc ?? move.desc ?? "",
  };
}

function buildItem(item: ShowdownItem, snapshot: PokeApiSnapshot): Item {
  const poke = snapshot.itemsByName.get(item.id);
  const flavor = poke ? uniqueEnglishFlavor(poke.flavor_text_entries) : [];
  return {
    id: item.id,
    pokeApiSlug: poke?.name ?? toPokeApiKebab(item.name),
    name: poke ? englishName(poke.names, item.name) : item.name,
    showdownName: item.name,
    description: flavor[0]?.text ?? item.shortDesc ?? item.desc ?? "",
    category: itemCategory(item),
  };
}

function buildNature(nature: ShowdownNature, snapshot: PokeApiSnapshot): Nature {
  const poke = snapshot.naturesByName.get(nature.id);
  const plusFromApi = poke?.increased_stat ? pokeApiStatToId(poke.increased_stat.name) : null;
  const minusFromApi = poke?.decreased_stat ? pokeApiStatToId(poke.decreased_stat.name) : null;
  return {
    id: nature.id,
    pokeApiSlug: poke?.name ?? toPokeApiKebab(nature.name),
    name: poke ? englishName(poke.names, nature.name) : nature.name,
    showdownName: nature.name,
    plusStat: plusFromApi ?? nature.plus ?? null,
    minusStat: minusFromApi ?? nature.minus ?? null,
  };
}

function wrapped(kind: string, name: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : "unknown error";
  return new Error(`Failed to normalize ${kind} ${name}: ${message}`);
}

function sortById<T extends { id: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => left.id.localeCompare(right.id));
}
