import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Dex } from "@pkmn/dex";
import type { Species } from "@pkmn/dex";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";

/**
 * Level-up (L), TM/HM/TR (M), egg (E), tutor (T), and transfer (V). Event and Dream World sources
 * stay out. Each move is written as `moveId:CODES`, such as `surf:MT`, so the builder can filter
 * by how a move is learned.
 */
const NATURAL_SOURCE = /[LEMTV]/g;
const SOURCE_ORDER = "LMETV";

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
    const moves = await learnableMoves(form.id);
    learnsets[form.id] = [...moves]
      .filter(([id]) => standardMoves.has(id))
      .map(([id, codes]) => `${id}:${sortCodes(codes)}`)
      .sort();
  }

  const filePath = path.join(process.cwd(), "data", "generated", "learnsets.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(learnsets)}\n`);
  const withMoves = Object.values(learnsets).filter((ids) => ids.length > 0).length;
  console.log(`Wrote ${filePath}`);
  console.log(`  ${Object.keys(learnsets).length} forms, ${withMoves} with a learnset`);
}

function sortCodes(codes: ReadonlySet<string>): string {
  return [...codes].sort((a, b) => SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b)).join("");
}

async function learnableMoves(speciesId: string): Promise<Map<string, Set<string>>> {
  const moves = new Map<string, Set<string>>();
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
      const codes = sources.flatMap((source) => source.replace(/\d/g, "").match(NATURAL_SOURCE) ?? []);
      if (codes.length > 0) {
        const known = moves.get(moveId) ?? new Set<string>();
        for (const code of codes) {
          known.add(code);
        }
        moves.set(moveId, known);
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
