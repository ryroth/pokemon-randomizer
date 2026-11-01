import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import formItems from "../../data/generated/form-items.json";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";
import { copyTypeChangeCries } from "../../lib/data/typeItemForms";
import { POKEAPI_CACHE_DIR } from "./pokeapi";

const CRY_PREFIX = "https://raw.githubusercontent.com/PokeAPI/cries/";

/**
 * Writes each form's official latest cry URL from the cached PokéAPI Pokémon record.
 * The URL is copied as published. A plate, memory, or drive form with no cry of its
 * own keeps the base form's cry. Every other form with no cry is left out.
 */
async function main() {
  const catalog = loadGeneratedCatalog();
  const cries: Record<string, string> = {};
  const requiredItemId = formItems as Record<string, string>;

  for (const form of catalog.pokemon) {
    const url = await latestCry(form.pokeApiSlug);
    if (!url) {
      continue;
    }
    cries[form.id] = url;
  }

  const withTypeForms = copyTypeChangeCries(cries, catalog.pokemon, (id) => requiredItemId[id]);
  const missing = catalog.pokemon.filter((form) => !withTypeForms[form.id]).map((form) => form.id);

  const filePath = path.join(process.cwd(), "data", "generated", "cries.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  const ordered = Object.fromEntries(
    Object.entries(withTypeForms).sort(([left], [right]) => left.localeCompare(right)),
  );
  await writeFile(filePath, `${JSON.stringify(ordered, null, 2)}\n`);
  console.log(`Wrote ${filePath}`);
  console.log(`  ${Object.keys(ordered).length} cries`);
  if (missing.length > 0) {
    console.log(`  Missing cry: ${missing.length}`);
  }
}

async function latestCry(pokeApiSlug: string): Promise<string | null> {
  const safeKey = pokeApiSlug.replace(/[^a-z0-9._-]+/gi, "_");
  const filePath = path.join(POKEAPI_CACHE_DIR, "pokemon", `${safeKey}.json`);
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as {
      data?: { cries?: { latest?: string } };
    };
    const url = parsed.data?.cries?.latest;
    if (typeof url !== "string" || !url.startsWith(CRY_PREFIX)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/import/cries.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
