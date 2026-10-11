import { MOVES_ASSIGNED_PER_POKEMON, requiredMovesPerPokemon } from "@/lib/randomizer/applyExtras";
import { enabledRandomizerSteps, isExtraBeforePokemon } from "@/lib/randomizer/flow";
import type { RandomizerTab } from "@/lib/types/randomizer";
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

/**
 * Randomizer steps that are turned on but have not given this Pokémon its ability, moves, or item
 * yet, in the order the user set. The builder never lets the user pick these by hand: they finish
 * them in the randomizer first, so a randomized part can not be swapped for a hand-picked one.
 */
export function pendingRandomizerSteps(session: RandomizerSession): RandomizerTab[] {
  return enabledRandomizerSteps(session.config).filter((step) => {
    switch (step) {
      case "ability":
        return !session.draft.abilityId;
      case "item":
        return session.draft.itemId === undefined;
      case "move": {
        const needed = isExtraBeforePokemon(session.config, "move")
          ? requiredMovesPerPokemon(session.config.movesPerPokemon)
          : MOVES_ASSIGNED_PER_POKEMON;
        return session.draft.moveIds.filter(Boolean).length < needed;
      }
      case "pokemon":
        return false;
    }
  });
}
