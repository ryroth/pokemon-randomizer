import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import formItems from "../../data/generated/form-items.json";
import { generatedCatalogPath } from "../../lib/data/loadCatalog";
import { copyTypeChangeCries, inheritTypeChangeFormBodies } from "../../lib/data/typeItemForms";
import type { Catalog } from "../../lib/types/catalog";
import { writeCatalog } from "./writeCatalog";

/**
 * Copies height, weight, egg groups, and the cry from the base form onto plate,
 * memory, and drive forms already in the generated catalog. A full `import:data`
 * does the same while it builds the catalog.
 */
async function main() {
  const requiredItemId = formItems as Record<string, string>;
  const itemFor = (id: string) => requiredItemId[id];
  const catalog = JSON.parse(await readFile(generatedCatalogPath(), "utf8")) as Catalog;
  const pokemon = inheritTypeChangeFormBodies(catalog.pokemon, itemFor);
  const changed = pokemon.filter(
    (form, index) =>
      form.heightM !== catalog.pokemon[index]?.heightM || form.weightKg !== catalog.pokemon[index]?.weightKg,
  ).length;

  await writeCatalog({
    ...catalog,
    version: "2.6.1",
    generatedAt: new Date().toISOString(),
    pokemon,
  });

  const criesPath = path.join(process.cwd(), "data", "generated", "cries.json");
  const cries = JSON.parse(await readFile(criesPath, "utf8")) as Record<string, string>;
  const withTypeForms = copyTypeChangeCries(cries, pokemon, itemFor);
  const added = Object.keys(withTypeForms).length - Object.keys(cries).length;
  const ordered = Object.fromEntries(
    Object.entries(withTypeForms).sort(([left], [right]) => left.localeCompare(right)),
  );
  await writeFile(criesPath, `${JSON.stringify(ordered, null, 2)}\n`);

  console.log(`Updated ${changed} type-change forms in the catalog.`);
  console.log(`Added ${added} cries from the base form.`);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/import/inherit-type-forms.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : "Unknown type-form patch error");
    process.exitCode = 1;
  });
}
