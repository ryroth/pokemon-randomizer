import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Dex } from "@pkmn/dex";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";

/**
 * Forms that exist only while holding an item: Other forms (Giratina-Origin and the
 * Griseous Core, Arceus-Fire and the Flame Plate) and Mega Evolutions (Venusaur-Mega
 * and Venusaurite). When several items can cause the change, a Mega Stone wins for a
 * Mega, and a plate, orb, mask, drive, or memory wins over a Z-Crystal otherwise.
 * Mega Rayquaza has no stone, so it is left out.
 */
async function main() {
  const catalog = loadGeneratedCatalog();
  const itemsById = new Map(catalog.items.map((item) => [item.id, item]));
  const formItems: Record<string, string> = {};

  for (const form of catalog.pokemon) {
    if (form.formType !== "other" && form.formType !== "mega") {
      continue;
    }
    const species = Dex.species.get(form.id);
    const names =
      species.requiredItems && species.requiredItems.length > 0
        ? species.requiredItems
        : species.requiredItem
          ? [species.requiredItem]
          : [];
    const ids = names
      .map((name) => Dex.items.get(name).id)
      .filter((id) => itemsById.has(id));
    if (ids.length === 0) {
      continue;
    }
    const held =
      form.formType === "mega"
        ? ids.find((id) => itemsById.get(id)?.kind === "mega-stone")
        : ids.find((id) => itemsById.get(id)?.kind !== "z-crystal");
    formItems[form.id] = held ?? ids[0];
  }

  const ordered = Object.fromEntries(
    Object.entries(formItems).sort(([left], [right]) => left.localeCompare(right)),
  );
  const filePath = path.join(process.cwd(), "data", "generated", "form-items.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(ordered, null, 2)}\n`);
  console.log(`Wrote ${filePath}`);
  console.log(`  ${Object.keys(ordered).length} forms require a held item`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : "Unknown importer error");
  process.exitCode = 1;
});
