"use server";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  dexEntryGroupFromStored,
  type DexEntryGroup,
  type StoredDexEntryGroup,
} from "@/lib/data/dexVersions";

const MAX_LOOKUP = 60;

let cached: Record<string, StoredDexEntryGroup[]> | undefined;

function storedEntries(): Record<string, StoredDexEntryGroup[]> {
  if (cached) {
    return cached;
  }
  const filePath = path.join(process.cwd(), "data", "generated", "dex-entries.json");
  if (!existsSync(filePath)) {
    throw new Error(`Pokédex entries not found at ${filePath}. Run npm run import:dex-entries.`);
  }
  // JSON.parse cannot prove the shape; the dex-entries unit test checks the generated file.
  cached = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, StoredDexEntryGroup[]>;
  return cached;
}

/**
 * Every English Pokédex text for the given species, one entry per generation text. The file is
 * large, so it stays on the server and the browser asks only for the species on screen.
 */
export async function loadDexEntries(speciesIds: string[]): Promise<Record<string, DexEntryGroup[]>> {
  if (!Array.isArray(speciesIds)) {
    return {};
  }
  const wanted = [...new Set(speciesIds.filter((id): id is string => typeof id === "string"))].slice(
    0,
    MAX_LOOKUP,
  );
  const stored = storedEntries();
  const result: Record<string, DexEntryGroup[]> = {};
  for (const id of wanted) {
    const groups = stored[id];
    if (groups) {
      result[id] = groups.map(dexEntryGroupFromStored);
    }
  }
  return result;
}
