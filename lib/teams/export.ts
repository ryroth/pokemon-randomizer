import { buildRecapEntry, type RecapCatalog } from "@/lib/recap/entries";
import { exportShowdownTeam } from "@/lib/showdown/exportSet";
import type { PokemonSet } from "@/lib/types/session";

export function teamShowdownText(
  sets: readonly PokemonSet[],
  catalog: RecapCatalog,
): { ok: true; text: string } | { ok: false; message: string } {
  if (sets.length === 0) {
    return { ok: false, message: "This team has no Pokémon to copy." };
  }
  const texts: string[] = [];
  for (const set of sets) {
    const entry = buildRecapEntry(set, catalog);
    if (!entry) {
      return { ok: false, message: "This team does not match the current catalog." };
    }
    texts.push(entry.showdownText);
  }
  return { ok: true, text: exportShowdownTeam(texts) };
}
