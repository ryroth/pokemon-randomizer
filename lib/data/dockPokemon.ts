"use server";

import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import type { RecapCatalog } from "@/lib/recap/entries";
import { teamShowdownText } from "@/lib/teams/export";
import { TEAM_SIZE } from "@/lib/teams/teams";
import type { PokemonSprites } from "@/lib/types/pokemon";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { PokemonSet } from "@/lib/types/session";

/** The little the team dock needs about a saved Pokémon. Sent per form, not the whole catalog. */
export interface DockPokemon {
  id: string;
  displayName: string;
  types: PokemonType[];
  sprites: PokemonSprites;
}

const MAX_LOOKUP = 60;

export async function loadDockPokemon(ids: string[]): Promise<DockPokemon[]> {
  if (!Array.isArray(ids)) {
    return [];
  }
  const wanted = new Set(ids.filter((id): id is string => typeof id === "string").slice(0, MAX_LOOKUP));
  if (wanted.size === 0) {
    return [];
  }
  return loadGeneratedCatalog()
    .pokemon.filter((form) => wanted.has(form.id))
    .map((form) => ({
      id: form.id,
      displayName: form.displayName,
      types: form.types,
      sprites: form.sprites,
    }));
}

/** Showdown paste for one team. The catalog stays on the server. */
export async function exportTeamText(
  sets: PokemonSet[],
): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  if (!Array.isArray(sets) || sets.length > TEAM_SIZE) {
    return { ok: false, message: "This team could not be copied." };
  }
  try {
    const catalog = loadGeneratedCatalog();
    const recapCatalog: RecapCatalog = {
      pokemon: catalog.pokemon,
      abilities: catalog.abilities,
      moves: catalog.moves,
      items: catalog.items,
      natures: catalog.natures,
    };
    return teamShowdownText(sets, recapCatalog);
  } catch {
    return { ok: false, message: "This team could not be copied." };
  }
}
