import { isValidBattlePokemonId } from "@/lib/data/evolution";
import type { AbilityRandomizerResult } from "@/lib/randomizer/abilities";
import {
  MOVES_ASSIGNED_PER_POKEMON,
  requiredMovesPerPokemon,
} from "@/lib/randomizer/applyExtras";
import {
  cloneRandomizerConfig,
  DEFAULT_RANDOMIZER_CONFIG,
} from "@/lib/randomizer/defaults";
import {
  canOpenRandomizerTab,
  firstOpenRandomizerTab,
  isExtraBeforePokemon,
} from "@/lib/randomizer/flow";
import { NONE_ITEM_ID } from "@/lib/randomizer/items";
import type { ItemRandomizerResult } from "@/lib/randomizer/items";
import type { MoveRandomizerResult } from "@/lib/randomizer/moves";
import type { PokemonRandomizerResult } from "@/lib/randomizer/pokemon";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { RandomizerConfig, RandomizerTab } from "@/lib/types/randomizer";
import type {
  PokemonSetDraft,
  PokemonRoll,
  RandomizerSession,
} from "@/lib/types/session";

export function createInitialSession(
  config: RandomizerConfig = DEFAULT_RANDOMIZER_CONFIG,
): RandomizerSession {
  const cloned = cloneRandomizerConfig(config);
  return {
    config: cloned,
    step: "configure",
    tab: firstOpenRandomizerTab(cloned),
    resultPokemonIds: [],
    pokemonRolls: [],
    viewedRollIndex: 0,
    abilityOptions: [],
    moveOptions: [],
    itemOptions: [],
    draft: {
      moveIds: emptyMoveSlots(),
      evsConfirmed: false,
    },
  };
}

export function applyPokemonRoll(
  session: RandomizerSession,
  result: PokemonRandomizerResult,
): RandomizerSession {
  const pokemonIds = result.pokemon.map((form) => form.id);
  const latest: PokemonRoll = {
    seed: result.seed,
    pokemonIds,
  };
  const pokemonRolls = [latest, ...session.pokemonRolls];
  const selectedPokemonId = selectionStillPresent(session.selectedPokemonId, pokemonRolls)
    ? session.selectedPokemonId
    : undefined;
  const evolvedPokemonId = selectedPokemonId
    ? keptEvolutionId(session, selectedPokemonId)
    : undefined;

  return withExtraState(
    {
      ...session,
      config: cloneRandomizerConfig({ ...session.config, seed: result.seed }),
      step: "results",
      resultPokemonIds: latest.pokemonIds,
      pokemonRolls,
      viewedRollIndex: 0,
      selectedPokemonId,
      evolvedPokemonId,
      draft: {
        ...session.draft,
        pokemonId: evolvedPokemonId,
        moveIds: [...session.draft.moveIds],
      },
    },
    session,
  );
}

export function selectRolledPokemon(
  session: RandomizerSession,
  pokemonId: string,
): RandomizerSession {
  if (!rolledPokemonIds(session).includes(pokemonId)) {
    return session;
  }

  if (
    assignsAbilitiesBeforePokemon(session) &&
    !appliedAbilityIdForPokemon(session, pokemonId)
  ) {
    return session;
  }

  if (!pokemonMeetsMoveApplyRequirement(session, pokemonId)) {
    return session;
  }

  if (
    assignsItemsBeforePokemon(session) &&
    appliedItemIdForPokemon(session, pokemonId) === undefined
  ) {
    return session;
  }

  return withExtraState(
    {
      ...session,
      selectedPokemonId: pokemonId,
      evolvedPokemonId: pokemonId,
      draft: {
        ...session.draft,
        pokemonId,
        moveIds: [...session.draft.moveIds],
      },
    },
    session,
  );
}

export function chooseEvolvedPokemon(
  session: RandomizerSession,
  selected: PokemonForm,
  nextBattlePokemonId: string,
): RandomizerSession {
  if (session.selectedPokemonId !== selected.id) {
    return session;
  }

  if (!isValidBattlePokemonId(selected, nextBattlePokemonId)) {
    return session;
  }

  return withExtraState(
    {
      ...session,
      evolvedPokemonId: nextBattlePokemonId,
      draft: {
        ...session.draft,
        pokemonId: nextBattlePokemonId,
        moveIds: [...session.draft.moveIds],
      },
    },
    session,
  );
}

export function clearPokemonRolls(session: RandomizerSession): RandomizerSession {
  const keepAbilityPool = assignsAbilitiesBeforePokemon(session);
  const keepMovePool = assignsMovesBeforePokemon(session);
  const keepItemPool = assignsItemsBeforePokemon(session);

  return {
    ...session,
    step: "configure",
    tab: "pokemon",
    resultPokemonIds: [],
    pokemonRolls: [],
    viewedRollIndex: 0,
    selectedPokemonId: undefined,
    evolvedPokemonId: undefined,
    abilityOptions: keepAbilityPool ? [...session.abilityOptions] : [],
    moveOptions: keepMovePool ? [...session.moveOptions] : [],
    itemOptions: keepItemPool ? [...session.itemOptions] : [],
    draft: {
      ...session.draft,
      pokemonId: undefined,
      abilityId: undefined,
      itemId: undefined,
      moveIds: emptyMoveSlots(),
    },
  };
}

export function applyAbilityRoll(
  session: RandomizerSession,
  result: AbilityRandomizerResult,
  forPokemonId?: string,
): RandomizerSession {
  const abilityOptions = result.abilities.map((ability) => ability.id);

  if (assignsAbilitiesBeforePokemon(session)) {
    const pokemonRolls = session.pokemonRolls.map((roll) =>
      pruneAppliedAbilities(roll, abilityOptions),
    );
    const next: RandomizerSession = {
      ...session,
      abilityOptions,
      pokemonRolls,
    };
    return withSelectionMatchingAppliedAbility(next);
  }

  if (battlePokemonId(session) !== forPokemonId) {
    return session;
  }

  return {
    ...session,
    abilityOptions,
    draft: withDraftAbility(session.draft, keptAbilityId(session.draft.abilityId, abilityOptions)),
  };
}

export function selectRolledAbility(
  session: RandomizerSession,
  abilityId: string,
): RandomizerSession {
  if (!session.abilityOptions.includes(abilityId)) {
    return session;
  }

  return {
    ...session,
    draft: withDraftAbility(session.draft, abilityId),
  };
}

export function applyItemRoll(
  session: RandomizerSession,
  result: ItemRandomizerResult,
  forPokemonId?: string,
): RandomizerSession {
  const itemOptions = result.items.map((item) => item.id);

  if (assignsItemsBeforePokemon(session)) {
    const pokemonRolls = session.pokemonRolls.map((roll) =>
      pruneAppliedItems(roll, itemOptions),
    );
    const next: RandomizerSession = {
      ...session,
      itemOptions,
      pokemonRolls,
    };
    return withSelectionMatchingAppliedItem(next);
  }

  if (battlePokemonId(session) !== forPokemonId) {
    return session;
  }

  return {
    ...session,
    itemOptions,
    draft: withDraftItem(session.draft, keptItemId(session.draft.itemId, itemOptions)),
  };
}

export function selectRolledItem(
  session: RandomizerSession,
  itemId: string | null,
): RandomizerSession {
  if (assignsItemsBeforePokemon(session)) {
    return session;
  }
  if (itemId === NONE_ITEM_ID) {
    return {
      ...session,
      draft: withDraftItem(session.draft, NONE_ITEM_ID),
    };
  }
  if (!session.itemOptions.includes(itemId)) {
    return session;
  }

  return {
    ...session,
    draft: withDraftItem(session.draft, itemId),
  };
}

export function applyMoveRoll(
  session: RandomizerSession,
  result: MoveRandomizerResult,
  forPokemonId?: string,
): RandomizerSession {
  const moveOptions = result.moves.map((move) => move.id);

  if (assignsMovesBeforePokemon(session)) {
    const pokemonRolls = session.pokemonRolls.map((roll) =>
      pruneAppliedMoves(roll, moveOptions),
    );
    return syncDraftMovesFromSelection({
      ...session,
      moveOptions,
      pokemonRolls,
    });
  }

  if (battlePokemonId(session) !== forPokemonId) {
    return session;
  }

  return {
    ...session,
    moveOptions,
    draft: withDraftMoves(
      session.draft,
      padMoveSlots(session.draft.moveIds).map((id) =>
        id && moveOptions.includes(id) ? id : undefined,
      ),
    ),
  };
}

export function selectRolledMove(
  session: RandomizerSession,
  moveId: string,
): RandomizerSession {
  if (assignsMovesBeforePokemon(session)) {
    return session;
  }
  if (!session.moveOptions.includes(moveId)) {
    return session;
  }

  const current = padMoveSlots(session.draft.moveIds);
  const existingIndex = current.indexOf(moveId);
  if (existingIndex !== -1) {
    current[existingIndex] = undefined;
    return {
      ...session,
      draft: withDraftMoves(session.draft, current),
    };
  }

  const emptyIndex = current.findIndex((id) => !id);
  if (emptyIndex === -1) {
    return session;
  }

  current[emptyIndex] = moveId;
  return {
    ...session,
    draft: withDraftMoves(session.draft, current),
  };
}

export function openRandomizerTab(
  session: RandomizerSession,
  tab: RandomizerTab,
): RandomizerSession {
  if (!canOpenRandomizerTab(session, tab) || session.tab === tab) {
    return session;
  }

  return {
    ...session,
    tab,
  };
}

export function syncRandomizerTab(session: RandomizerSession): RandomizerSession {
  if (canOpenRandomizerTab(session, session.tab)) {
    return session;
  }

  return {
    ...session,
    tab: firstOpenRandomizerTab(session.config),
  };
}

export function applySessionConfig(
  session: RandomizerSession,
  config: RandomizerConfig,
): RandomizerSession {
  return syncRandomizerTab(
    withSelectionMatchingAppliedMoves(
      trimAppliedMoveSlots({
        ...session,
        config,
      }),
    ),
  );
}

export function showPreviousPokemonRoll(session: RandomizerSession): RandomizerSession {
  const viewedRollIndex = clampViewedRollIndex(session);
  if (viewedRollIndex >= session.pokemonRolls.length - 1) {
    return session;
  }

  return {
    ...session,
    viewedRollIndex: viewedRollIndex + 1,
  };
}

export function showNextPokemonRoll(session: RandomizerSession): RandomizerSession {
  const viewedRollIndex = clampViewedRollIndex(session);
  if (viewedRollIndex <= 0) {
    return session;
  }

  return {
    ...session,
    viewedRollIndex: viewedRollIndex - 1,
  };
}

export function rolledPokemonIds(session: RandomizerSession): string[] {
  if (session.pokemonRolls.length > 0) {
    return session.pokemonRolls.flatMap((roll) => roll.pokemonIds);
  }

  return session.resultPokemonIds;
}

export function viewedPokemonRoll(session: RandomizerSession): PokemonRoll | undefined {
  return session.pokemonRolls[clampViewedRollIndex(session)];
}

export function replaceRolledPokemon(
  session: RandomizerSession,
  previousId: string,
  nextId: string,
): RandomizerSession {
  if (previousId === nextId) {
    return session;
  }

  const viewedIndex = clampViewedRollIndex(session);
  const roll = session.pokemonRolls[viewedIndex];
  if (!roll) {
    return session;
  }

  const slot = roll.pokemonIds.indexOf(previousId);
  if (slot === -1 || roll.pokemonIds.includes(nextId)) {
    return session;
  }

  const pokemonIds = [...roll.pokemonIds];
  pokemonIds[slot] = nextId;
  const pokemonRolls = [...session.pokemonRolls];
  pokemonRolls[viewedIndex] = { ...roll, pokemonIds };

  const next: RandomizerSession = {
    ...session,
    pokemonRolls,
    resultPokemonIds: viewedIndex === 0 ? pokemonIds : session.resultPokemonIds,
  };

  if (session.selectedPokemonId !== previousId) {
    return next;
  }

  return selectRolledPokemon(next, nextId);
}

export function replaceRolledAbility(
  session: RandomizerSession,
  previousId: string,
  nextId: string,
): RandomizerSession {
  if (
    previousId === nextId ||
    !session.abilityOptions.includes(previousId) ||
    session.abilityOptions.includes(nextId)
  ) {
    return session;
  }

  const abilityOptions = session.abilityOptions.map((id) => (id === previousId ? nextId : id));
  const pokemonRolls = session.pokemonRolls.map((roll) => {
    if (!roll.appliedAbilityIds) {
      return roll;
    }
    return {
      ...roll,
      appliedAbilityIds: roll.appliedAbilityIds.map((id) => (id === previousId ? nextId : id)),
    };
  });

  return {
    ...session,
    abilityOptions,
    pokemonRolls,
    draft: withDraftAbility(
      session.draft,
      session.draft.abilityId === previousId ? nextId : session.draft.abilityId,
    ),
  };
}

export function replaceRolledMove(
  session: RandomizerSession,
  previousId: string,
  nextId: string,
): RandomizerSession {
  if (
    previousId === nextId ||
    !session.moveOptions.includes(previousId) ||
    session.moveOptions.includes(nextId)
  ) {
    return session;
  }

  const moveOptions = session.moveOptions.map((id) => (id === previousId ? nextId : id));
  const pokemonRolls = session.pokemonRolls.map((roll) => {
    if (!roll.appliedMoveIds) {
      return roll;
    }
    return {
      ...roll,
      appliedMoveIds: roll.appliedMoveIds.map((slots) =>
        padMoveSlots(slots).map((id) => (id === previousId ? nextId : id)),
      ),
    };
  });

  return {
    ...session,
    moveOptions,
    pokemonRolls,
    draft: withDraftMoves(
      session.draft,
      padMoveSlots(session.draft.moveIds).map((id) => (id === previousId ? nextId : id)),
    ),
  };
}

export function replaceRolledItem(
  session: RandomizerSession,
  previousId: string,
  nextId: string,
): RandomizerSession {
  if (
    previousId === nextId ||
    !session.itemOptions.includes(previousId) ||
    session.itemOptions.includes(nextId)
  ) {
    return session;
  }

  const itemOptions = session.itemOptions.map((id) => (id === previousId ? nextId : id));
  const pokemonRolls = session.pokemonRolls.map((roll) => {
    if (!roll.appliedItemIds) {
      return roll;
    }
    return {
      ...roll,
      appliedItemIds: roll.appliedItemIds.map((id) => (id === previousId ? nextId : id)),
    };
  });

  return {
    ...session,
    itemOptions,
    pokemonRolls,
    draft: withDraftItem(
      session.draft,
      session.draft.itemId === previousId ? nextId : session.draft.itemId,
    ),
  };
}

export function clampViewedRollIndex(session: RandomizerSession): number {
  if (session.pokemonRolls.length === 0) {
    return 0;
  }

  return Math.min(Math.max(session.viewedRollIndex, 0), session.pokemonRolls.length - 1);
}

export function battlePokemonId(session: RandomizerSession): string | undefined {
  return session.evolvedPokemonId ?? session.selectedPokemonId;
}

export function appliedAbilityIdForPokemon(
  session: RandomizerSession,
  pokemonId: string | undefined,
): string | undefined {
  if (!pokemonId) {
    return undefined;
  }

  for (const roll of session.pokemonRolls) {
    const index = roll.pokemonIds.indexOf(pokemonId);
    if (index === -1) {
      continue;
    }
    return roll.appliedAbilityIds?.[index];
  }

  return undefined;
}

export function appliedItemIdForPokemon(
  session: RandomizerSession,
  pokemonId: string | undefined,
): string | null | undefined {
  if (!pokemonId) {
    return undefined;
  }

  for (const roll of session.pokemonRolls) {
    const index = roll.pokemonIds.indexOf(pokemonId);
    if (index === -1) {
      continue;
    }
    return roll.appliedItemIds?.[index];
  }

  return undefined;
}

export function appliedMoveIdsForPokemon(
  session: RandomizerSession,
  pokemonId: string | undefined,
): Array<string | undefined> {
  if (!pokemonId) {
    return emptyMoveSlots();
  }

  for (const roll of session.pokemonRolls) {
    const index = roll.pokemonIds.indexOf(pokemonId);
    if (index === -1) {
      continue;
    }
    return padMoveSlots(roll.appliedMoveIds?.[index]);
  }

  return emptyMoveSlots();
}

export function applyAbilityToRolledPokemon(
  session: RandomizerSession,
  pokemonId: string,
  abilityId: string | undefined,
): RandomizerSession {
  if (!assignsAbilitiesBeforePokemon(session)) {
    return session;
  }
  if (abilityId && !session.abilityOptions.includes(abilityId)) {
    return session;
  }
  if (!rolledPokemonIds(session).includes(pokemonId)) {
    return session;
  }

  const pokemonRolls = session.pokemonRolls.map((roll) => {
    const index = roll.pokemonIds.indexOf(pokemonId);
    if (index === -1) {
      return roll;
    }

    const appliedAbilityIds = appliedAbilitySlots(roll);
    if (abilityId) {
      for (let slot = 0; slot < appliedAbilityIds.length; slot += 1) {
        if (appliedAbilityIds[slot] === abilityId) {
          appliedAbilityIds[slot] = undefined;
        }
      }
    }
    appliedAbilityIds[index] = abilityId;
    return { ...roll, appliedAbilityIds };
  });

  return withItemState(
    withMoveState(
      withSelectionMatchingAppliedAbility({
        ...session,
        pokemonRolls,
      }),
      session,
    ),
    session,
  );
}

export function applyMoveToRolledPokemon(
  session: RandomizerSession,
  pokemonId: string,
  slotIndex: number,
  moveId: string | undefined,
): RandomizerSession {
  if (!assignsMovesBeforePokemon(session)) {
    return session;
  }
  if (slotIndex < 0 || slotIndex >= moveApplyLimit(session)) {
    return session;
  }
  if (moveId && !session.moveOptions.includes(moveId)) {
    return session;
  }
  if (!rolledPokemonIds(session).includes(pokemonId)) {
    return session;
  }

  const pokemonRolls = session.pokemonRolls.map((roll) => {
    const pokemonIndex = roll.pokemonIds.indexOf(pokemonId);
    if (pokemonIndex === -1) {
      return roll;
    }

    const appliedMoveIds = appliedMoveSlots(roll);
    if (moveId) {
      for (const slots of appliedMoveIds) {
        for (let slot = 0; slot < slots.length; slot += 1) {
          if (slots[slot] === moveId) {
            slots[slot] = undefined;
          }
        }
      }
    }
    const currentSlots = padMoveSlots(appliedMoveIds[pokemonIndex]);
    currentSlots[slotIndex] = moveId;
    appliedMoveIds[pokemonIndex] = currentSlots;
    return { ...roll, appliedMoveIds };
  });

  return withItemState(
    withSelectionMatchingAppliedMoves({
      ...session,
      pokemonRolls,
    }),
    session,
  );
}

export function applyItemToRolledPokemon(
  session: RandomizerSession,
  pokemonId: string,
  itemId: string | null | undefined,
): RandomizerSession {
  if (!assignsItemsBeforePokemon(session)) {
    return session;
  }
  if (itemId && !session.itemOptions.includes(itemId)) {
    return session;
  }
  if (!rolledPokemonIds(session).includes(pokemonId)) {
    return session;
  }

  const pokemonRolls = session.pokemonRolls.map((roll) => {
    const index = roll.pokemonIds.indexOf(pokemonId);
    if (index === -1) {
      return roll;
    }

    const appliedItemIds = appliedItemSlots(roll);
    if (itemId) {
      for (let slot = 0; slot < appliedItemIds.length; slot += 1) {
        if (appliedItemIds[slot] === itemId) {
          appliedItemIds[slot] = undefined;
        }
      }
    }
    appliedItemIds[index] = itemId;
    return { ...roll, appliedItemIds };
  });

  return withMoveState(
    withAbilityState(
      withSelectionMatchingAppliedItem({
        ...session,
        pokemonRolls,
      }),
      session,
    ),
    session,
  );
}

export function abilityChoicesForPokemon(
  session: RandomizerSession,
  pokemonId: string,
): string[] {
  const current = appliedAbilityIdForPokemon(session, pokemonId);
  const used = new Set(
    appliedAbilityIdsOnSameRoll(session, pokemonId).filter((id) => id !== current),
  );
  return session.abilityOptions.filter((id) => !used.has(id));
}

export function moveChoicesForPokemon(
  session: RandomizerSession,
  pokemonId: string,
  slotIndex: number,
): string[] {
  const current = appliedMoveIdsForPokemon(session, pokemonId)[slotIndex];
  const used = new Set(
    appliedMoveIdsOnSameRoll(session, pokemonId).filter((id) => id !== current),
  );
  return session.moveOptions.filter((id) => !used.has(id));
}

export function itemChoicesForPokemon(
  session: RandomizerSession,
  pokemonId: string,
): string[] {
  const current = appliedItemIdForPokemon(session, pokemonId);
  const used = new Set(
    appliedItemIdsOnSameRoll(session, pokemonId).filter((id) => id !== current),
  );
  return session.itemOptions.filter((id) => !used.has(id));
}

export function unassignedAbilityIds(session: RandomizerSession): string[] {
  const roll = viewedPokemonRoll(session);
  const used = new Set(
    (roll?.appliedAbilityIds ?? []).filter((id): id is string => Boolean(id)),
  );
  return session.abilityOptions.filter((id) => !used.has(id));
}

export function unassignedMoveIds(session: RandomizerSession): string[] {
  const roll = viewedPokemonRoll(session);
  const used = new Set(
    (roll?.appliedMoveIds ?? []).flat().filter((id): id is string => Boolean(id)),
  );
  return session.moveOptions.filter((id) => !used.has(id));
}

export function unassignedItemIds(session: RandomizerSession): string[] {
  const roll = viewedPokemonRoll(session);
  const used = new Set(
    (roll?.appliedItemIds ?? []).filter((id): id is string => typeof id === "string"),
  );
  return session.itemOptions.filter((id) => !used.has(id));
}

export function filledMoveCount(moveIds: readonly (string | undefined)[]): number {
  return moveIds.filter((id): id is string => Boolean(id)).length;
}

function withExtraState(
  next: RandomizerSession,
  previous: RandomizerSession,
): RandomizerSession {
  return withItemState(withMoveState(withAbilityState(next, previous), previous), previous);
}

function withAbilityState(
  next: RandomizerSession,
  previous: RandomizerSession,
): RandomizerSession {
  if (assignsAbilitiesBeforePokemon(next)) {
    const samePick = next.selectedPokemonId === previous.selectedPokemonId;
    const abilityId =
      samePick && previous.draft.abilityId
        ? previous.draft.abilityId
        : appliedAbilityIdForPokemon(next, next.selectedPokemonId);

    return {
      ...next,
      abilityOptions: [...previous.abilityOptions],
      draft: withDraftAbility(next.draft, abilityId),
    };
  }

  const keepAbilities = Boolean(
    battlePokemonId(next) && battlePokemonId(next) === battlePokemonId(previous),
  );

  return {
    ...next,
    abilityOptions: keepAbilities ? previous.abilityOptions : [],
    draft: withDraftAbility(next.draft, keepAbilities ? previous.draft.abilityId : undefined),
  };
}

function withMoveState(
  next: RandomizerSession,
  previous: RandomizerSession,
): RandomizerSession {
  if (assignsMovesBeforePokemon(next)) {
    const samePick = next.selectedPokemonId === previous.selectedPokemonId;
    const moveIds =
      samePick && filledMoveCount(previous.draft.moveIds) > 0
        ? padMoveSlots(previous.draft.moveIds)
        : appliedMoveIdsForPokemon(next, next.selectedPokemonId);

    return {
      ...next,
      moveOptions: [...previous.moveOptions],
      draft: withDraftMoves(next.draft, moveIds),
    };
  }

  const keepMoves = Boolean(
    battlePokemonId(next) && battlePokemonId(next) === battlePokemonId(previous),
  );

  return {
    ...next,
    moveOptions: keepMoves ? previous.moveOptions : [],
    draft: withDraftMoves(next.draft, keepMoves ? previous.draft.moveIds : emptyMoveSlots()),
  };
}

function withItemState(
  next: RandomizerSession,
  previous: RandomizerSession,
): RandomizerSession {
  if (assignsItemsBeforePokemon(next)) {
    const samePick = next.selectedPokemonId === previous.selectedPokemonId;
    const itemId =
      samePick && previous.draft.itemId !== undefined
        ? previous.draft.itemId
        : appliedItemIdForPokemon(next, next.selectedPokemonId);

    return {
      ...next,
      itemOptions: [...previous.itemOptions],
      draft: withDraftItem(next.draft, itemId),
    };
  }

  const keepItems = Boolean(
    battlePokemonId(next) && battlePokemonId(next) === battlePokemonId(previous),
  );

  return {
    ...next,
    itemOptions: keepItems ? previous.itemOptions : [],
    draft: withDraftItem(next.draft, keepItems ? previous.draft.itemId : undefined),
  };
}

function assignsAbilitiesBeforePokemon(session: RandomizerSession): boolean {
  return (
    session.config.randomizeAbilities && isExtraBeforePokemon(session.config, "ability")
  );
}

function assignsMovesBeforePokemon(session: RandomizerSession): boolean {
  return session.config.randomizeMoves && isExtraBeforePokemon(session.config, "move");
}

function assignsItemsBeforePokemon(session: RandomizerSession): boolean {
  return session.config.randomizeItems && isExtraBeforePokemon(session.config, "item");
}

function withSelectionMatchingAppliedAbility(session: RandomizerSession): RandomizerSession {
  const assigned = appliedAbilityIdForPokemon(session, session.selectedPokemonId);
  if (session.selectedPokemonId && !assigned) {
    return {
      ...session,
      selectedPokemonId: undefined,
      evolvedPokemonId: undefined,
      draft: {
        ...withDraftAbility(session.draft, undefined),
        pokemonId: undefined,
        itemId: undefined,
      },
    };
  }

  return {
    ...session,
    draft: withDraftAbility(session.draft, assigned),
  };
}

function withSelectionMatchingAppliedMoves(session: RandomizerSession): RandomizerSession {
  if (!assignsMovesBeforePokemon(session) || !session.selectedPokemonId) {
    return session;
  }

  if (pokemonMeetsMoveApplyRequirement(session, session.selectedPokemonId)) {
    return syncDraftMovesFromSelection(session);
  }

  return {
    ...session,
    selectedPokemonId: undefined,
    evolvedPokemonId: undefined,
    draft: {
      ...withDraftMoves(session.draft, emptyMoveSlots()),
      pokemonId: undefined,
      abilityId: undefined,
      itemId: undefined,
    },
  };
}

function withSelectionMatchingAppliedItem(session: RandomizerSession): RandomizerSession {
  const assigned = appliedItemIdForPokemon(session, session.selectedPokemonId);
  if (session.selectedPokemonId && assigned === undefined) {
    return {
      ...session,
      selectedPokemonId: undefined,
      evolvedPokemonId: undefined,
      draft: {
        ...withDraftItem(session.draft, undefined),
        pokemonId: undefined,
      },
    };
  }

  return {
    ...session,
    draft: withDraftItem(session.draft, assigned),
  };
}

function syncDraftMovesFromSelection(session: RandomizerSession): RandomizerSession {
  if (!assignsMovesBeforePokemon(session) || !session.selectedPokemonId) {
    return session;
  }

  return {
    ...session,
    draft: withDraftMoves(
      session.draft,
      appliedMoveIdsForPokemon(session, session.selectedPokemonId),
    ),
  };
}

function trimAppliedMoveSlots(session: RandomizerSession): RandomizerSession {
  if (!assignsMovesBeforePokemon(session)) {
    return session;
  }

  const limit = moveApplyLimit(session);
  const pokemonRolls = session.pokemonRolls.map((roll) => {
    if (!roll.appliedMoveIds) {
      return roll;
    }

    return {
      ...roll,
      appliedMoveIds: appliedMoveSlots(roll).map((slots) =>
        padMoveSlots(slots.map((id, index) => (index < limit ? id : undefined))),
      ),
    };
  });

  return {
    ...session,
    pokemonRolls,
    draft: withDraftMoves(
      session.draft,
      padMoveSlots(session.draft.moveIds).map((id, index) => (index < limit ? id : undefined)),
    ),
  };
}

function pokemonMeetsMoveApplyRequirement(
  session: RandomizerSession,
  pokemonId: string,
): boolean {
  if (!assignsMovesBeforePokemon(session)) {
    return true;
  }

  return filledMoveCount(appliedMoveIdsForPokemon(session, pokemonId)) >= moveApplyLimit(session);
}

function moveApplyLimit(session: RandomizerSession): number {
  return requiredMovesPerPokemon(session.config.movesPerPokemon);
}

function pruneAppliedAbilities(
  roll: PokemonRoll,
  abilityOptions: readonly string[],
): PokemonRoll {
  if (!roll.appliedAbilityIds) {
    return roll;
  }

  return {
    ...roll,
    appliedAbilityIds: roll.appliedAbilityIds.map((id) =>
      id && abilityOptions.includes(id) ? id : undefined,
    ),
  };
}

function pruneAppliedItems(roll: PokemonRoll, itemOptions: readonly string[]): PokemonRoll {
  if (!roll.appliedItemIds) {
    return roll;
  }

  return {
    ...roll,
    appliedItemIds: roll.appliedItemIds.map((id) =>
      id === NONE_ITEM_ID ? NONE_ITEM_ID : id && itemOptions.includes(id) ? id : undefined,
    ),
  };
}

function pruneAppliedMoves(roll: PokemonRoll, moveOptions: readonly string[]): PokemonRoll {
  if (!roll.appliedMoveIds) {
    return roll;
  }

  return {
    ...roll,
    appliedMoveIds: appliedMoveSlots(roll).map((slots) =>
      slots.map((id) => (id && moveOptions.includes(id) ? id : undefined)),
    ),
  };
}

function appliedAbilitySlots(roll: PokemonRoll): Array<string | undefined> {
  return roll.pokemonIds.map((_, index) => roll.appliedAbilityIds?.[index]);
}

function appliedItemSlots(roll: PokemonRoll): Array<string | null | undefined> {
  return roll.pokemonIds.map((_, index) => roll.appliedItemIds?.[index]);
}

function appliedMoveSlots(roll: PokemonRoll): Array<Array<string | undefined>> {
  return roll.pokemonIds.map((_, index) => padMoveSlots(roll.appliedMoveIds?.[index]));
}

function appliedAbilityIdsOnSameRoll(
  session: RandomizerSession,
  pokemonId: string,
): Array<string | undefined> {
  for (const roll of session.pokemonRolls) {
    if (roll.pokemonIds.includes(pokemonId)) {
      return appliedAbilitySlots(roll);
    }
  }
  return [];
}

function appliedItemIdsOnSameRoll(
  session: RandomizerSession,
  pokemonId: string,
): Array<string | null | undefined> {
  for (const roll of session.pokemonRolls) {
    if (roll.pokemonIds.includes(pokemonId)) {
      return appliedItemSlots(roll);
    }
  }
  return [];
}

function appliedMoveIdsOnSameRoll(session: RandomizerSession, pokemonId: string): string[] {
  for (const roll of session.pokemonRolls) {
    if (roll.pokemonIds.includes(pokemonId)) {
      return appliedMoveSlots(roll)
        .flat()
        .filter((id): id is string => Boolean(id));
    }
  }
  return [];
}

function withDraftAbility(draft: PokemonSetDraft, abilityId: string | undefined): PokemonSetDraft {
  return {
    ...draft,
    abilityId,
    moveIds: padMoveSlots(draft.moveIds),
  };
}

function withDraftMoves(
  draft: PokemonSetDraft,
  moveIds: readonly (string | undefined)[],
): PokemonSetDraft {
  return {
    ...draft,
    moveIds: padMoveSlots(moveIds),
  };
}

function withDraftItem(
  draft: PokemonSetDraft,
  itemId: string | null | undefined,
): PokemonSetDraft {
  return {
    ...draft,
    itemId,
    moveIds: padMoveSlots(draft.moveIds),
  };
}

function emptyMoveSlots(): Array<string | undefined> {
  return Array.from({ length: MOVES_ASSIGNED_PER_POKEMON }, () => undefined);
}

function padMoveSlots(slots?: readonly (string | undefined)[]): Array<string | undefined> {
  return Array.from({ length: MOVES_ASSIGNED_PER_POKEMON }, (_, index) => slots?.[index]);
}

function keptAbilityId(
  abilityId: string | undefined,
  abilityOptions: readonly string[],
): string | undefined {
  return abilityId && abilityOptions.includes(abilityId) ? abilityId : undefined;
}

function keptItemId(
  itemId: string | null | undefined,
  itemOptions: readonly string[],
): string | null | undefined {
  if (itemId === undefined) {
    return undefined;
  }
  if (itemId === NONE_ITEM_ID) {
    return NONE_ITEM_ID;
  }
  return itemOptions.includes(itemId) ? itemId : undefined;
}

function keptEvolutionId(session: RandomizerSession, selectedPokemonId: string): string {
  if (session.evolvedPokemonId && session.selectedPokemonId === selectedPokemonId) {
    return session.evolvedPokemonId;
  }

  return selectedPokemonId;
}

function selectionStillPresent(
  selectedPokemonId: string | undefined,
  rolls: readonly PokemonRoll[],
): selectedPokemonId is string {
  return Boolean(
    selectedPokemonId && rolls.some((roll) => roll.pokemonIds.includes(selectedPokemonId)),
  );
}
