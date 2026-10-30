import { requiredFormItemId } from "@/lib/data/formItems";
import { applyBuilderDefaults } from "@/lib/builder/draft";
import type { DraftedPokemon, PokemonSet, PokemonSetDraft, RandomizerSession } from "@/lib/types/session";
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
    buildingDraft: undefined,
    draftLocks: undefined,
  };
}

/** Opens the builder on one drafted Pokémon and keeps the locks captured when it was added. */
export function openDraftInBuilder(
  session: RandomizerSession,
  rosterId: string,
  pokemon: DraftedPokemon,
  index: number,
): RandomizerSession {
  const pokemonId = pokemon.draft.pokemonId;
  if (!pokemonId) {
    return session;
  }
  return applyBuilderDefaults({
    ...session,
    step: "builder",
    resultPokemonIds: [],
    pokemonRolls: [],
    viewedRollIndex: 0,
    selectedPokemonId: pokemonId,
    evolvedPokemonId: pokemonId,
    abilityOptions: [],
    moveOptions: [],
    itemOptions: [],
    passedExtras: [],
    draft: draftFromDrafted(pokemon),
    finalizedSet: undefined,
    editingTeamSlot: undefined,
    buildingDraft: { rosterId, index },
    draftLocks: {
      ability: pokemon.locks.ability,
      item: pokemon.locks.item,
      moveSlots: Array.from({ length: MAX_MOVE_COUNT }, (_, slot) => Boolean(pokemon.locks.moveSlots[slot])),
    },
  });
}

function draftFromDrafted(pokemon: DraftedPokemon): PokemonSetDraft {
  return {
    pokemonId: pokemon.draft.pokemonId,
    abilityId: pokemon.draft.abilityId,
    itemId: pokemon.draft.itemId,
    moveIds: Array.from({ length: MAX_MOVE_COUNT }, (_, slot) => pokemon.draft.moveIds[slot]),
    shiny: pokemon.draft.shiny,
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
    customTypes: set.customTypes ? [...set.customTypes] : undefined,
    customBaseStats: set.customBaseStats ? { ...set.customBaseStats } : undefined,
  };
}

function cloneSet(set: PokemonSet): PokemonSet {
  return {
    ...set,
    moveIds: [...set.moveIds],
    evs: { ...set.evs },
    ivs: { ...set.ivs },
    customTypes: set.customTypes ? [...set.customTypes] : undefined,
    customBaseStats: set.customBaseStats ? { ...set.customBaseStats } : undefined,
  };
}
