import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";

const SPECIES_NAMES_CSV =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv";
const ENGLISH_LANGUAGE_ID = "9";

/**
 * Writes the English PokéAPI genus for each catalog species.
 * The text is copied from pokemon_species_names.csv and is not rewritten.
 */
async function main() {
  const catalog = loadGeneratedCatalog();
  const response = await fetch(SPECIES_NAMES_CSV);
  if (!response.ok) {
    throw new Error(`PokéAPI species names returned ${response.status}.`);
  }
  const genusBySpeciesId = englishGenusBySpeciesId(await response.text());
  const genera: Record<string, string> = {};
  const missing: string[] = [];

  for (const species of catalog.species) {
    const genus = genusBySpeciesId.get(species.pokeApiId);
    if (!genus) {
      missing.push(species.id);
      continue;
    }
    genera[species.id] = genus;
  }

  const filePath = path.join(process.cwd(), "data", "generated", "genera.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  const ordered = Object.fromEntries(Object.entries(genera).sort(([left], [right]) => left.localeCompare(right)));
  await writeFile(filePath, `${JSON.stringify(ordered, null, 2)}\n`);
  console.log(`Wrote ${filePath}`);
  console.log(`  ${Object.keys(ordered).length} species`);
  if (missing.length > 0) {
    console.log(`  Missing English genus: ${missing.join(", ")}`);
  }
}

export function englishGenusBySpeciesId(csv: string): Map<number, string> {
  const genera = new Map<number, string>();
  const lines = csv.split(/\r?\n/);
  for (const line of lines.slice(1)) {
    if (!line.trim()) {
      continue;
    }
    const [speciesId, languageId, , ...genusParts] = line.split(",");
    if (languageId !== ENGLISH_LANGUAGE_ID || !speciesId) {
      continue;
    }
    const genus = genusParts.join(",").trim();
    if (!genus) {
      continue;
    }
    genera.set(Number(speciesId), genus);
  }
  return genera;
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/import/genera.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
