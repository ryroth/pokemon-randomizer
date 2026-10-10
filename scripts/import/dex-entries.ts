import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";
import type { StoredDexEntryGroup } from "../../lib/data/dexVersions";
import { POKEAPI_CACHE_DIR } from "./pokeapi";
import type { PokeApiSpecies } from "./pokeapi-types";
import { englishFlavorByGeneration } from "./text";

/**
 * Writes every English PokéAPI Pokédex text for each catalog species, grouped by generation.
 * The words are copied from the cached PokéAPI species files and are not rewritten. Run
 * `npm run import:data` first if the species cache is empty.
 */
async function main() {
  const catalog = loadGeneratedCatalog();
  const output: Record<string, StoredDexEntryGroup[]> = {};
  const missing: string[] = [];
  const unknownVersions = new Set<string>();
  let groupCount = 0;

  for (const species of catalog.species) {
    const cached = await readSpecies(species.pokeApiSlug);
    if (!cached) {
      missing.push(species.id);
      continue;
    }
    const { groups, unknownVersions: unknown } = englishFlavorByGeneration(cached.flavor_text_entries);
    unknown.forEach((version) => unknownVersions.add(version));
    if (groups.length === 0) {
      continue;
    }
    output[species.id] = groups.map((group) => [group.generation, group.versions, group.text]);
    groupCount += groups.length;
  }

  // Every text the catalog already shows must still be in the new file.
  const lost: string[] = [];
  for (const form of catalog.pokemon) {
    const known = output[form.speciesId];
    for (const entry of form.dexEntries) {
      if (!known?.some((group) => group[2] === entry.text)) {
        lost.push(`${form.id}: ${entry.version}`);
      }
    }
  }

  const ordered = Object.fromEntries(
    Object.entries(output).sort(([left], [right]) => left.localeCompare(right)),
  );
  const filePath = path.join(process.cwd(), "data", "generated", "dex-entries.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(ordered)}\n`);

  console.log(`Wrote ${filePath}`);
  console.log(`  ${Object.keys(ordered).length} species, ${groupCount} generation entries`);
  if (missing.length > 0) {
    console.log(`  No cached species file for: ${missing.join(", ")}`);
  }
  if (unknownVersions.size > 0) {
    console.log(`  Left out unknown versions: ${[...unknownVersions].join(", ")}`);
  }
  if (lost.length > 0) {
    console.log(`  ${lost.length} catalog texts were not found in the new file: ${lost.slice(0, 8).join("; ")}`);
    process.exitCode = 1;
  }
}

async function readSpecies(slug: string): Promise<PokeApiSpecies | null> {
  try {
    const raw = await readFile(path.join(POKEAPI_CACHE_DIR, "pokemon-species", `${slug}.json`), "utf8");
    const parsed = JSON.parse(raw) as { ok: boolean; data?: PokeApiSpecies };
    return parsed.ok && parsed.data ? parsed.data : null;
  } catch {
    return null;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : "Unknown importer error");
  process.exitCode = 1;
});
