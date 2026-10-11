import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";
import type { Catalog } from "../../lib/types/catalog";
import type { PokemonForm } from "../../lib/types/pokemon";

/**
 * Finds a still picture for every Pokémon form and every held item, so no card shows a blank box.
 *
 * Pokémon: the catalog already has PokéAPI official artwork for most forms. For the forms it is
 * missing (Arceus and Silvally types, Genesect drives, Ogerpon Tera forms, cosmetic forms), and
 * for missing shiny artwork, this probes other still-image sources in order and keeps the first
 * that answers. Nothing animated is ever chosen.
 *
 * Items: PokéAPI has an item sprite for most items. Newer items (Booster Energy, Ability Shield,
 * Z-crystals, and so on) are not in PokéAPI, so Serebii's item dex sprite is used.
 *
 * The results go to `data/generated/pokemon-art.json` and `data/generated/item-icons.json`, and
 * `loadGeneratedCatalog` applies them. Run `npm run import:art` again after a catalog refresh.
 */

const POKEAPI_SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites";
const SHOWDOWN_SPRITES = "https://play.pokemonshowdown.com/sprites";
const SEREBII_ITEMS = "https://www.serebii.net/itemdex/sprites";
const CONCURRENCY = 8;

export interface PokemonArtEntry {
  artwork?: string;
  artworkShiny?: string;
}

function toId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const probeCache = new Map<string, Promise<boolean>>();

/** True when the URL answers with an image. Probes are cached for the run. */
function imageExists(url: string): Promise<boolean> {
  const cached = probeCache.get(url);
  if (cached) {
    return cached;
  }
  const probe = (async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (response.status === 404) {
          return false;
        }
        if (response.ok) {
          return (response.headers.get("content-type") ?? "").startsWith("image/");
        }
      } catch {
        // Try once more, then treat the source as unavailable.
      }
    }
    return false;
  })();
  probeCache.set(url, probe);
  return probe;
}

async function firstExisting(urls: readonly (string | null)[]): Promise<string | undefined> {
  for (const url of urls) {
    if (url && (await imageExists(url))) {
      return url;
    }
  }
  return undefined;
}

async function mapLimit<T, R>(items: readonly T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      const item = items[index];
      if (item === undefined) {
        continue;
      }
      results[index] = await work(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface FormNames {
  /** PokéAPI form suffix after the species slug, such as `bug` for arceus-bug. */
  suffix: string | null;
  /** Showdown sprite file name, such as `arceus-bug` or `pichu-spikyeared`. */
  showdownFile: string;
}

export function formNames(form: PokemonForm, speciesSlug: string): FormNames {
  const suffix = form.pokeApiSlug.startsWith(`${speciesSlug}-`)
    ? form.pokeApiSlug.slice(speciesSlug.length + 1)
    : null;
  let showdownFile = toId(form.showdownName);
  if (form.form !== "base" && form.showdownName.endsWith(`-${form.form}`)) {
    const base = form.showdownName.slice(0, form.showdownName.length - form.form.length - 1);
    showdownFile = `${toId(base)}-${toId(form.form)}`;
  }
  return { suffix, showdownFile };
}

async function artForForm(
  form: PokemonForm,
  speciesSlug: string,
  baseForm: PokemonForm | undefined,
): Promise<PokemonArtEntry> {
  const { suffix, showdownFile } = formNames(form, speciesSlug);
  const dex = form.nationalDexNumber;
  const dexKey = suffix ? `${dex}-${suffix}` : null;
  const entry: PokemonArtEntry = {};

  if (!form.sprites.artwork) {
    entry.artwork =
      (await firstExisting([
        dexKey ? `${POKEAPI_SPRITES}/pokemon/other/official-artwork/${dexKey}.png` : null,
        form.pokeApiId > 0 ? `${POKEAPI_SPRITES}/pokemon/other/home/${form.pokeApiId}.png` : null,
        dexKey ? `${POKEAPI_SPRITES}/pokemon/other/home/${dexKey}.png` : null,
        `${SHOWDOWN_SPRITES}/home/${showdownFile}.png`,
      ])) ?? baseForm?.sprites.artwork ?? undefined;
  }

  if (!form.sprites.artworkShiny) {
    entry.artworkShiny =
      (await firstExisting([
        dexKey ? `${POKEAPI_SPRITES}/pokemon/other/official-artwork/shiny/${dexKey}.png` : null,
        form.pokeApiId > 0 ? `${POKEAPI_SPRITES}/pokemon/other/home/shiny/${form.pokeApiId}.png` : null,
        dexKey ? `${POKEAPI_SPRITES}/pokemon/other/home/shiny/${dexKey}.png` : null,
        `${SHOWDOWN_SPRITES}/home-shiny/${showdownFile}.png`,
      ])) ?? baseForm?.sprites.artworkShiny ?? undefined;
  }

  return entry;
}

export async function buildPokemonArt(catalog: Catalog): Promise<Record<string, PokemonArtEntry>> {
  const speciesSlugById = new Map(catalog.species.map((species) => [species.id, species.pokeApiSlug]));
  const baseFormBySpecies = new Map<string, PokemonForm>();
  for (const form of catalog.pokemon) {
    if (form.form === "base") {
      baseFormBySpecies.set(form.speciesId, form);
    }
  }
  const needing = catalog.pokemon.filter((form) => !form.sprites.artwork || !form.sprites.artworkShiny);
  const entries = await mapLimit(needing, CONCURRENCY, async (form) => {
    const slug = speciesSlugById.get(form.speciesId) ?? form.speciesId;
    const base = form.form === "base" ? undefined : baseFormBySpecies.get(form.speciesId);
    return [form.id, await artForForm(form, slug, base)] as const;
  });
  return Object.fromEntries(
    entries
      .filter(([, entry]) => entry.artwork || entry.artworkShiny)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

interface CachedItemFile {
  ok?: boolean;
  data?: { sprites?: { default?: string | null } };
}

async function cachedPokeApiItemSprite(slug: string): Promise<string | null> {
  try {
    const file = path.join(process.cwd(), "data", "cache", "pokeapi", "item", `${slug}.json`);
    const parsed = JSON.parse(await readFile(file, "utf8")) as CachedItemFile;
    return parsed.ok ? (parsed.data?.sprites?.default ?? null) : null;
  } catch {
    return null;
  }
}

/** Serebii files that do not follow the Showdown id naming. */
const SEREBII_FILE_OVERRIDES: Readonly<Record<string, string>> = {
  heavydutyboots: "heavy-dutyboots",
};

export async function buildItemIcons(catalog: Catalog): Promise<Record<string, string>> {
  const entries = await mapLimit(catalog.items, CONCURRENCY, async (item) => {
    const url = await firstExisting([
      await cachedPokeApiItemSprite(item.pokeApiSlug),
      `${POKEAPI_SPRITES}/items/${item.pokeApiSlug}.png`,
      `${SEREBII_ITEMS}/${SEREBII_FILE_OVERRIDES[item.id] ?? item.id}.png`,
    ]);
    return [item.id, url] as const;
  });
  const icons: Record<string, string> = {};
  for (const [id, url] of entries.sort(([left], [right]) => left.localeCompare(right))) {
    if (url) {
      icons[id] = url;
    }
  }
  return icons;
}

async function writeJson(name: string, value: unknown) {
  const filePath = path.join(process.cwd(), "data", "generated", name);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`Wrote ${filePath}`);
}

async function main() {
  const catalog = loadGeneratedCatalog();

  const pokemonArt = await buildPokemonArt(catalog);
  await writeJson("pokemon-art.json", pokemonArt);
  const stillMissingArt = catalog.pokemon.filter((form) => {
    const extra = pokemonArt[form.id];
    return !(form.sprites.artwork ?? extra?.artwork);
  });
  const stillMissingShiny = catalog.pokemon.filter((form) => {
    const extra = pokemonArt[form.id];
    return !(form.sprites.artworkShiny ?? extra?.artworkShiny);
  });
  console.log(`  ${Object.keys(pokemonArt).length} forms filled in`);
  console.log(`  No artwork: ${stillMissingArt.map((form) => form.id).join(", ") || "none"}`);
  console.log(`  No shiny artwork: ${stillMissingShiny.map((form) => form.id).join(", ") || "none"}`);

  const itemIcons = await buildItemIcons(catalog);
  await writeJson("item-icons.json", itemIcons);
  const missingIcons = catalog.items.filter((item) => !itemIcons[item.id]);
  console.log(`  ${Object.keys(itemIcons).length} of ${catalog.items.length} items have an icon`);
  console.log(`  No icon: ${missingIcons.map((item) => item.id).join(", ") || "none"}`);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/import/art.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
