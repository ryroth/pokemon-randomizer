import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Dex } from "@pkmn/dex";
import type { Species } from "@pkmn/dex";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";

/**
 * Level-up (L), TM/HM/TR (M), egg (E), tutor (T), transfer (V), and a move the form itself
 * adds (R), such as Overheat on Rotom-Heat. Event and Dream World sources stay out. Each move
 * is written as `moveId:CODES`, such as `surf:MT`, so the builder can filter by how it is learned.
 */
const NATURAL_SOURCE = /[LEMTVR]/g;
const SOURCE_ORDER = "LMETVR";

/**
 * Writes each catalog form's in-game learnset.
 * Follows Pokémon Showdown's learnset chain: a form with no learnset of its own uses
 * `changesFrom` or its base form, and a form whose learnset only adds a few moves
 * (Rotom-Heat, Zacian-Crowned) keeps those and also inherits the form it changes from.
 * Earlier stages are included, because those moves can be learned before evolving.
 * Kyurem's fused forms have their own complete learnsets and do not inherit Kyurem.
 * A Pokémon that learns Hidden Power also learns each Hidden Power type, which Showdown stores
 * as a separate entry with the same move id.
 */
async function main() {
  const catalog = loadGeneratedCatalog();
  const standardMoves = new Set(catalog.moves.map((move) => move.id));
  const hiddenPowerTypeIds = catalog.moves
    .filter((move) => move.id.startsWith("hiddenpower") && move.id !== "hiddenpower")
    .map((move) => move.id);
  const learnsets: Record<string, string[]> = {};

  for (const form of catalog.pokemon) {
    const moves = await learnableMoves(form.id);
    const hiddenPower = moves.get("hiddenpower");
    if (hiddenPower) {
      for (const id of hiddenPowerTypeIds) {
        moves.set(id, new Set(hiddenPower));
      }
    }
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
  let species: Species | null = Dex.species.getByID(speciesId as Species["id"]);
  if (!species.exists) {
    return moves;
  }

  while (species?.exists && !seen.has(species.id)) {
    seen.add(species.id);
    const learnset = await Dex.learnsets.getByID(species.id);
    if (learnset.learnset) {
      addSources(moves, learnset.learnset);
      species = await learnsetParent(species);
      continue;
    }

    // A form with no learnset of its own uses the form it changes from, then its base form.
    if ((species.changesFrom || species.baseSpecies) !== species.name) {
      const next = Dex.species.get(species.changesFrom || species.baseSpecies);
      species = next.exists ? next : null;
      continue;
    }

    if (species.prevo) {
      const prevo = Dex.species.get(species.prevo);
      const prevoLearnset = prevo.exists ? await Dex.learnsets.getByID(prevo.id) : undefined;
      if (prevo.exists && prevoLearnset?.learnset) {
        species = prevo;
        continue;
      }
    }

    break;
  }

  return moves;
}

/**
 * The next species whose moves this one may also know. Mirrors Showdown's `learnsetParent`:
 * an evolution walks to its previous stage, and a form that extends another form
 * (Rotom-Heat, Necrozma-Dusk-Mane) walks to `changesFrom`. Kyurem-Black and Kyurem-White
 * are the exception: their learnsets already replace Kyurem's.
 */
async function learnsetParent(species: Species): Promise<Species | null> {
  const learnset = await Dex.learnsets.getByID(species.id);
  if (!learnset.learnset && species.forme) {
    const next = Dex.species.get(species.changesFrom || species.baseSpecies);
    return next.exists ? next : null;
  }
  if (species.prevo) {
    const prevo = Dex.species.get(species.prevo);
    return prevo.exists ? prevo : null;
  }
  if (species.changesFrom && species.baseSpecies !== "Kyurem") {
    const next = Dex.species.get(species.changesFrom);
    return next.exists ? next : null;
  }
  if (!species.prevo && species.baseSpecies && species.baseSpecies !== species.name) {
    let base = Dex.species.get(species.baseSpecies);
    if (!base.exists || !base.prevo) {
      return null;
    }
    while (base.prevo) {
      const prevo = Dex.species.get(base.prevo);
      if (!prevo.exists) {
        break;
      }
      base = prevo;
    }
    return base.id === species.id ? null : base;
  }
  return null;
}

function addSources(
  moves: Map<string, Set<string>>,
  learnset: { [moveId: string]: readonly string[] },
): void {
  for (const [moveId, sources] of Object.entries(learnset)) {
    const codes = sources.flatMap((source) => source.replace(/\d/g, "").match(NATURAL_SOURCE) ?? []);
    if (codes.length === 0) {
      continue;
    }
    const known = moves.get(moveId) ?? new Set<string>();
    for (const code of codes) {
      known.add(code);
    }
    moves.set(moveId, known);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : "Unknown importer error");
  process.exitCode = 1;
});
