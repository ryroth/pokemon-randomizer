import type { RandomizerSession } from "@/lib/types/session";

export type BuilderMoveList = "all" | "learnset";

/**
 * Moves the builder may place in empty slots.
 * Applied randomizer moves are already stored on the draft.
 * Empty slots use every standard move, or that Pokémon's in-game learnset.
 */
export function builderMovePool(
  _session: RandomizerSession,
  moves: readonly { id: string }[],
  options?: { list?: BuilderMoveList; learnsetIds?: readonly string[] },
): string[] {
  const catalogIds = uniqueIds(moves.map((move) => move.id));
  if (options?.list !== "learnset") {
    return catalogIds;
  }
  const allowed = new Set(options.learnsetIds ?? []);
  return catalogIds.filter((id) => allowed.has(id));
}

/**
 * Items the builder may hold, including explicit None (`null`).
 * A randomized run uses the rolled holdables. Otherwise the full catalog.
 */
export function builderItemPool(
  session: RandomizerSession,
  items: readonly { id: string }[],
): Array<string | null> {
  const holdables = session.config.randomizeItems
    ? uniqueIds(session.itemOptions)
    : uniqueIds(items.map((item) => item.id));
  return [null, ...holdables];
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}
