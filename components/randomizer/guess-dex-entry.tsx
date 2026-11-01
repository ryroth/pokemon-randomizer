"use client";

import { useDexEntries } from "@/components/dex/use-dex-entries";
import { pokemonNameAliases, redactPokemonNames } from "@/lib/randomizer/cardFacts";
import { stableIndex } from "@/lib/randomizer/randomUtils";

/**
 * One Pokédex entry for a hidden Pokémon. The same species always gets the same entry, and the
 * name is written as "This Pokemon" so the sentence does not give the answer away.
 */
export function GuessDexEntry({
  speciesId,
  displayName,
  fallbackText,
}: {
  speciesId: string;
  displayName: string;
  fallbackText: string | null;
}) {
  const dex = useDexEntries(speciesId);
  const entries = dex.status === "ready" ? dex.entries : [];
  const pool =
    entries.length > 0 ? entries : fallbackText ? [{ text: fallbackText }] : [];
  const entry = pool[stableIndex(`pokedex-entry:${speciesId}`, pool.length)];
  if (!entry) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {redactPokemonNames(entry.text, pokemonNameAliases(displayName))}
    </p>
  );
}
