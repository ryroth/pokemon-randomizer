import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Dex } from "@pkmn/dex";
import type { Species } from "@pkmn/dex";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";
import { toShowdownId } from "./mapping";

/**
 * Writes each catalog form's Hidden Ability id from Pokémon Showdown.
 * Forms with no Hidden Ability are omitted.
 */
async function main() {
  const catalog = loadGeneratedCatalog();
  const hiddenAbilities: Record<string, string> = {};

  for (const form of catalog.pokemon) {
    const hiddenId = hiddenAbilityIdFor(form.id);
    if (hiddenId && form.abilityIds.includes(hiddenId)) {
      hiddenAbilities[form.id] = hiddenId;
    }
  }

  const filePath = path.join(process.cwd(), "data", "generated", "hidden-abilities.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(hiddenAbilities)}\n`);
  console.log(`Wrote ${filePath}`);
  console.log(`  ${Object.keys(hiddenAbilities).length} forms with a Hidden Ability`);
}

function hiddenAbilityIdFor(speciesId: string): string {
  const species = Dex.species.getByID(speciesId as Species["id"]);
  if (!species.exists) {
    return "";
  }
  return toShowdownId(species.abilities.H);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
