import { requiredFormItemId } from "@/lib/data/formItems";
import type { PokemonSet, PokemonSetDraft, RandomizerSession } from "@/lib/types/session";
import { MAX_MOVE_COUNT } from "@/lib/validation/moves";

/** Opens the builder on a saved team Pokémon without treating its parts as randomizer locks. */
export function openSavedSetInBuilder(
  session: RandomizerSession,
  set: PokemonSet,
  teamId: string,
  index: number,
): RandomizerSession {
  const requiredItemId = requiredFormItemId(set.pokemonId);
  const source = requiredItemId ? { ...set, itemId: requiredItemId } : set;
  return {
    ...session,
    step: "builder",
    selectedPokemonId: set.pokemonId,
    evolvedPokemonId: set.pokemonId,
    draft: draftFromPokemonSet(source),
    finalizedSet: cloneSet(source),
    editingTeamSlot: { teamId, index },
  };
}

export function draftFromPokemonSet(set: PokemonSet): PokemonSetDraft {
  return {
    pokemonId: set.pokemonId,
    itemId: set.itemId,
    abilityId: set.abilityId,
    moveIds: Array.from({ length: MAX_MOVE_COUNT }, (_, slot) => set.moveIds[slot]),
    evs: { ...set.evs },
    ivs: { ...set.ivs },
    natureId: set.natureId,
    teraType: set.teraType,
    gender: set.gender ?? undefined,
    level: set.level,
    shiny: set.shiny,
    nickname: set.nickname,
    happiness: set.happiness,
  };
}

function cloneSet(set: PokemonSet): PokemonSet {
  return {
    ...set,
    moveIds: [...set.moveIds],
    evs: { ...set.evs },
    ivs: { ...set.ivs },
  };
}
