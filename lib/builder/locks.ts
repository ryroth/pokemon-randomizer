import { MOVES_ASSIGNED_PER_POKEMON, requiredMovesPerPokemon } from "@/lib/randomizer/applyExtras";
import { enabledRandomizerSteps, isExtraBeforePokemon } from "@/lib/randomizer/flow";
import { appliedMoveIdsForPokemon } from "@/lib/randomizer/session";
import type { RandomizerTab } from "@/lib/types/randomizer";
import type { PokemonSet, RandomizerSession } from "@/lib/types/session";

/** The ability randomizer already chose this Pokémon's ability. */
export function abilityLockedByRandomizer(session: RandomizerSession): boolean {
  if (session.editingTeamSlot) {
    return false;
  }
  return session.config.randomizeAbilities && Boolean(session.draft.abilityId);
}

/**
 * A move slot filled by the move randomizer cannot be replaced. When the randomizer ran before
 * Pokémon, only the moves it applied are locked: the user may have added other moves by hand in
 * the remaining slots, and those stay editable. When it ran after Pokémon it filled every slot.
 */
export function moveSlotLockedByRandomizer(session: RandomizerSession, slot: number): boolean {
  if (session.editingTeamSlot) {
    return false;
  }
  const current = session.draft.moveIds[slot];
  if (!session.config.randomizeMoves || !current) {
    return false;
  }
  if (!isExtraBeforePokemon(session.config, "move")) {
    return true;
  }
  return appliedMoveIdsForPokemon(session, session.selectedPokemonId)[slot] === current;
}

/**
 * Which parts of the finished set the Recap may send the user back to edit. Anything a randomizer
 * chose stays locked there too, so the Recap offers no link for it. `moves` lines up with the set's
 * moves in order: the Builder slot to open, or null when the randomizer set that move.
 */
export interface RecapEditAccess {
  ability: boolean;
  item: boolean;
  moves: Array<number | null>;
}

export function recapEditAccess(session: RandomizerSession): RecapEditAccess {
  const moves: Array<number | null> = [];
  session.draft.moveIds.forEach((id, slot) => {
    if (id) {
      moves.push(moveSlotLockedByRandomizer(session, slot) ? null : slot);
    }
  });
  return {
    ability: !abilityLockedByRandomizer(session),
    item: !itemLockedByRandomizer(session),
    moves,
  };
}

/** Every part of a saved team Pokémon can be opened in the builder. */
export function savedSetEditAccess(set: PokemonSet): RecapEditAccess {
  return {
    ability: true,
    item: true,
    moves: set.moveIds.map((_, index) => index),
  };
}

/** The item randomizer already chose this Pokémon's held item, including None. */
export function itemLockedByRandomizer(session: RandomizerSession): boolean {
  if (session.editingTeamSlot) {
    return false;
  }
  return session.config.randomizeItems && session.draft.itemId !== undefined;
}

/**
 * Randomizer steps that are turned on but have not given this Pokémon its ability, moves, or item
 * yet, in the order the user set. The builder never lets the user pick these by hand: they finish
 * them in the randomizer first, so a randomized part can not be swapped for a hand-picked one.
 */
export function pendingRandomizerSteps(session: RandomizerSession): RandomizerTab[] {
  if (session.editingTeamSlot) {
    return [];
  }
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
