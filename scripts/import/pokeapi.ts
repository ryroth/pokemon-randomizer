import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { showdownNameToPokeApiSlugs, toPokeApiKebab } from "./mapping";
import type {
  PokeApiAbility,
  PokeApiEvolutionChain,
  PokeApiItem,
  PokeApiMove,
  PokeApiNature,
  PokeApiPokemon,
  PokeApiSnapshot,
  PokeApiSpecies,
  ResourceList,
} from "./pokeapi-types";

export const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
export const POKEAPI_CACHE_DIR = path.join(process.cwd(), "data", "cache", "pokeapi");
const USER_AGENT =
  "pokemon-randomizer-importer/2.0 (+https://github.com/ryroth/pokemon-randomizer)";

export interface NamedResource {
  name: string;
  url: string;
}

export interface SnapshotRequest {
  species: Array<{ id: string; name: string; forme: string; baseSpecies: string }>;
  abilities: Array<{ id: string; name: string }>;
  moves: Array<{ id: string; name: string }>;
  items: Array<{ id: string; name: string }>;
  natures: Array<{ id: string; name: string }>;
}

export function resourceIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match?.[1]) {
    throw new Error(`Could not read a resource id from ${url}`);
  }
  return Number(match[1]);
}

export interface PokeApiFetchOptions {
  cacheDir?: string;
  fresh?: boolean;
  offline?: boolean;
  concurrency?: number;
  onProgress?: (message: string) => void;
}

interface CacheHit<T> {
  ok: true;
  data: T;
}

interface CacheMiss {
  ok: false;
  status: number;
}

type Cached<T> = CacheHit<T> | CacheMiss;

function cacheFile(cacheDir: string, resource: string, key: string): string {
  const safeKey = key.replace(/[^a-z0-9._-]+/gi, "_");
  return path.join(cacheDir, resource, `${safeKey}.json`);
}

async function readCache<T>(filePath: string): Promise<Cached<T> | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as Cached<T>;
  } catch {
    return null;
  }
}

async function writeCache<T>(filePath: string, entry: Cached<T>): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(entry)}\n`, "utf8");
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson(url: string): Promise<{ status: number; data: unknown }> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404) {
    return { status: 404, data: null };
  }
  if (!response.ok) {
    throw new Error(`PokéAPI ${response.status} for ${url}`);
  }
  return { status: response.status, data: await response.json() };
}

async function fetchUrl<T>(
  cacheDir: string,
  cacheResource: string,
  cacheKey: string,
  url: string,
  options: PokeApiFetchOptions,
): Promise<T | null> {
  const filePath = cacheFile(cacheDir, cacheResource, cacheKey);

  if (!options.fresh) {
    const cached = await readCache<T>(filePath);
    if (cached) {
      return cached.ok ? cached.data : null;
    }
  }

  if (options.offline) {
    throw new Error(`Offline import is missing cache for ${cacheResource}/${cacheKey}`);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await fetchJson(url);
      if (result.status === 404) {
        await writeCache(filePath, { ok: false, status: 404 });
        return null;
      }
      await writeCache(filePath, { ok: true, data: result.data as T });
      return result.data as T;
    } catch (error) {
      lastError = error;
      await sleep(400 * 2 ** attempt);
    }
  }

  const message = lastError instanceof Error ? lastError.message : "PokéAPI request failed";
  throw new Error(message);
}

export async function fetchPokeApiResource<T>(
  resource: string,
  key: string,
  options: PokeApiFetchOptions,
): Promise<T | null> {
  const cacheDir = options.cacheDir ?? POKEAPI_CACHE_DIR;
  const url = `${POKEAPI_BASE_URL}/${resource}/${encodeURIComponent(key)}`;
  return fetchUrl<T>(cacheDir, resource, key, url, options);
}

export async function fetchResourceIndex(
  resource: string,
  options: PokeApiFetchOptions,
): Promise<string[]> {
  const cacheDir = options.cacheDir ?? POKEAPI_CACHE_DIR;
  const url = `${POKEAPI_BASE_URL}/${resource}?limit=20000`;
  const list = await fetchUrl<ResourceList>(cacheDir, resource, "_index", url, options);
  if (!list) {
    throw new Error(`PokéAPI index for ${resource} was not found`);
  }
  return list.results.map((entry) => entry.name);
}

async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function fetchFirstMatch<T>(
  resource: string,
  keys: string[],
  options: PokeApiFetchOptions,
): Promise<T | null> {
  for (const key of keys) {
    const data = await fetchPokeApiResource<T>(resource, key, options);
    if (data) {
      return data;
    }
  }
  return null;
}

export async function loadPokeApiSnapshot(
  sources: SnapshotRequest,
  options: PokeApiFetchOptions = {},
): Promise<PokeApiSnapshot> {
  const concurrency = options.concurrency ?? 8;
  const log = options.onProgress ?? (() => undefined);

  log("Loading PokéAPI resource indexes…");
  const [pokemonNames, speciesNames, abilityNames, moveNames, itemNames, natureNames] =
    await Promise.all([
      fetchResourceIndex("pokemon", options),
      fetchResourceIndex("pokemon-species", options),
      fetchResourceIndex("ability", options),
      fetchResourceIndex("move", options),
      fetchResourceIndex("item", options),
      fetchResourceIndex("nature", options),
    ]);

  const snapshot: PokeApiSnapshot = {
    pokemonNames,
    speciesNames,
    abilityNames,
    moveNames,
    itemNames,
    natureNames,
    pokemonByName: new Map(),
    speciesByName: new Map(),
    abilitiesByName: new Map(),
    movesByName: new Map(),
    itemsByName: new Map(),
    naturesByName: new Map(),
    evolutionChainsById: new Map(),
  };

  log(`Fetching ${sources.species.length} Pokémon varieties…`);
  let pokemonDone = 0;
  await mapPool(sources.species, concurrency, async (species) => {
    const data = await fetchFirstMatch<PokeApiPokemon>(
      "pokemon",
      showdownNameToPokeApiSlugs(species),
      options,
    );
    if (data) {
      snapshot.pokemonByName.set(species.id, data);
    }
    pokemonDone += 1;
    if (pokemonDone % 100 === 0 || pokemonDone === sources.species.length) {
      log(`  Pokémon ${pokemonDone}/${sources.species.length}`);
    }
  });

  const speciesSlugs = new Set<string>();
  for (const pokemon of snapshot.pokemonByName.values()) {
    speciesSlugs.add(pokemon.species.name);
  }
  for (const species of sources.species) {
    speciesSlugs.add(toPokeApiKebab(species.baseSpecies));
  }

  const speciesSlugList = [...speciesSlugs];
  log(`Fetching ${speciesSlugList.length} species…`);
  let speciesDone = 0;
  await mapPool(speciesSlugList, concurrency, async (slug) => {
    const data = await fetchPokeApiResource<PokeApiSpecies>("pokemon-species", slug, options);
    if (data) {
      snapshot.speciesByName.set(data.name, data);
    }
    speciesDone += 1;
    if (speciesDone % 100 === 0 || speciesDone === speciesSlugList.length) {
      log(`  Species ${speciesDone}/${speciesSlugList.length}`);
    }
  });

  const chainIds = new Set<number>();
  for (const species of snapshot.speciesByName.values()) {
    chainIds.add(resourceIdFromUrl(species.evolution_chain.url));
  }
  const chainIdList = [...chainIds];
  log(`Fetching ${chainIdList.length} evolution chains…`);
  await mapPool(chainIdList, concurrency, async (chainId) => {
    const data = await fetchPokeApiResource<PokeApiEvolutionChain>(
      "evolution-chain",
      String(chainId),
      options,
    );
    if (data) {
      snapshot.evolutionChainsById.set(chainId, data);
    }
  });

  log(`Fetching ${sources.abilities.length} abilities…`);
  await mapPool(sources.abilities, concurrency, async (ability) => {
    const data = await fetchFirstMatch<PokeApiAbility>(
      "ability",
      abilitySlugCandidates(ability.id, ability.name),
      options,
    );
    if (data) {
      snapshot.abilitiesByName.set(ability.id, data);
    }
  });

  log(`Fetching ${sources.moves.length} moves…`);
  let moveDone = 0;
  await mapPool(sources.moves, concurrency, async (move) => {
    const data = await fetchFirstMatch<PokeApiMove>(
      "move",
      abilitySlugCandidates(move.id, move.name),
      options,
    );
    if (data) {
      snapshot.movesByName.set(move.id, data);
    }
    moveDone += 1;
    if (moveDone % 150 === 0 || moveDone === sources.moves.length) {
      log(`  Moves ${moveDone}/${sources.moves.length}`);
    }
  });

  log(`Fetching ${sources.items.length} items…`);
  let itemDone = 0;
  await mapPool(sources.items, concurrency, async (item) => {
    const data = await fetchFirstMatch<PokeApiItem>(
      "item",
      abilitySlugCandidates(item.id, item.name),
      options,
    );
    if (data) {
      snapshot.itemsByName.set(item.id, data);
    }
    itemDone += 1;
    if (itemDone % 150 === 0 || itemDone === sources.items.length) {
      log(`  Items ${itemDone}/${sources.items.length}`);
    }
  });

  log(`Fetching ${sources.natures.length} natures…`);
  await mapPool(sources.natures, concurrency, async (nature) => {
    const data = await fetchFirstMatch<PokeApiNature>(
      "nature",
      abilitySlugCandidates(nature.id, nature.name),
      options,
    );
    if (data) {
      snapshot.naturesByName.set(nature.id, data);
    }
  });

  return snapshot;
}

function abilitySlugCandidates(id: string, name: string): string[] {
  const kebab = toPokeApiKebab(name);
  if (kebab === id) {
    return [kebab];
  }
  return [kebab, id];
}
