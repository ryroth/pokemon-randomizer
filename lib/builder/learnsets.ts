import learnsets from "@/data/generated/learnsets.json";

const byPokemonId = learnsets as Record<string, readonly string[]>;

/** Standard moves this Pokémon can learn by level-up, egg, TM, tutor, or transfer. */
export function learnsetMoveIds(pokemonId: string): readonly string[] {
  return byPokemonId[pokemonId] ?? [];
}
