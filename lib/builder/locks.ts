import type { RandomizerSession } from "@/lib/types/session";

/** The ability randomizer already chose this Pokémon's ability. */
export function abilityLockedByRandomizer(session: RandomizerSession): boolean {
  return session.config.randomizeAbilities && Boolean(session.draft.abilityId);
}

/** A move slot filled by the move randomizer cannot be replaced. */
export function moveSlotLockedByRandomizer(session: RandomizerSession, slot: number): boolean {
  return session.config.randomizeMoves && Boolean(session.draft.moveIds[slot]);
}

/** The item randomizer already chose this Pokémon's held item, including None. */
export function itemLockedByRandomizer(session: RandomizerSession): boolean {
  return session.config.randomizeItems && session.draft.itemId !== undefined;
}
