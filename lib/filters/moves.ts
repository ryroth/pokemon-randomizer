import type { Move, MoveCategory } from "@/lib/types/catalog-entities";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export type MoveFilterConfig = Pick<RandomizerConfig, "moveCategories" | "moveTypes">;

/**
 * Returns catalog moves whose damage class is in `moveCategories` and whose type
 * is in `moveTypes`. An empty category list or empty type list matches nothing.
 */
export function filterMoves(
  moves: readonly Move[],
  config: MoveFilterConfig,
): Move[] {
  const categories = selectedValues(config.moveCategories);
  const types = selectedValues(config.moveTypes);
  if (categories.size === 0 || types.size === 0) {
    return [];
  }

  return moves.filter(
    (move) => categories.has(move.category) && types.has(move.type),
  );
}

function selectedValues<T extends MoveCategory | PokemonType>(
  values: readonly T[],
): ReadonlySet<T> {
  return new Set(values);
}
