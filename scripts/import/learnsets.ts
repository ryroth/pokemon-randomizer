import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Dex } from "@pkmn/dex";
import type { Species } from "@pkmn/dex";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";

/** Level-up, egg, TM/HM/TR, tutor, and transfer. Event and Dream World sources stay out. */
const NATURAL_SOURCE = /[LEMTV]/;

/**
 * Writes each catalog form's in-game learnset.
 * A form with no learnset of its own uses its base form.
 * Earlier stages are included, because those moves can be learned before evolving.
 */
async function main() {
  const catalog = loadGeneratedCatalog();
  const standardMoves = new Set(catalog.moves.map((move) => move.id));
  const learnsets: Record<string, string[]> = {};

  for (const form of catalog.pokemon) {
    const moveIds = await learnableMoveIds(form.id);
    learnsets[form.id] = [...moveIds].filter((id) => standardMoves.has(id)).sort();
  }

  const filePath = path.join(process.cwd(), "data", "generated", "learnsets.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(learnsets)}\n`);
  const withMoves = Object.values(learnsets).filter((ids) => ids.length > 0).length;
  console.log(`Wrote ${filePath}`);
  console.log(`  ${Object.keys(learnsets).length} forms, ${withMoves} with a learnset`);
}

async function learnableMoveIds(speciesId: string): Promise<Set<string>> {
  const moves = new Set<string>();
  const seen = new Set<string>();
  let species = Dex.species.getByID(speciesId as Species["id"]);
  if (!species.exists) {
    return moves;
  }

  while (species.exists && !seen.has(species.id)) {
    seen.add(species.id);
    const learnsetSpecies = await speciesWithLearnset(species);
    const learnset = await Dex.learnsets.getByID(learnsetSpecies.id);
    for (const [moveId, sources] of Object.entries(learnset.learnset ?? {})) {
      if (sources.some((source) => NATURAL_SOURCE.test(source.replace(/\d/g, "")))) {
        moves.add(moveId);
      }
    }
    species = species.prevo ? Dex.species.get(species.prevo) : Dex.species.get("");
  }

  return moves;
}

async function speciesWithLearnset(species: Species): Promise<Species> {
  const own = await Dex.learnsets.getByID(species.id);
  if (own.exists || species.baseSpecies === species.name) {
    return species;
  }
  const base = Dex.species.get(species.baseSpecies);
  return base.exists ? base : species;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : "Unknown importer error");
  process.exitCode = 1;
});
