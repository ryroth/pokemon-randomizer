import type { Ability, Item, Move } from "@/lib/types/catalog-entities";

/** Ability, moves, and item already on a Pokémon while another randomizer is open. */
export interface SetSoFar {
  /** Set when an earlier randomizer chose one ability. Replaces the species list in the UI. */
  chosenAbility?: Ability;
  /**
   * The abilities the species already has, in catalog order.
   * Empty while the ability randomizer is on, until that randomizer chooses one.
   */
  speciesAbilities: Ability[];
  moves: Move[];
  item?: Item;
  /** True when the user chose None and the form does not require an item. */
  itemIsNone: boolean;
}

/**
 * Resolves the parts to show beside a Pokémon on an Ability, Move, or Item step.
 * An unset item stays blank. None is explicit. A required form item fills the blank.
 */
export function setSoFar(input: {
  speciesAbilityIds: readonly string[];
  /** When true, the species list stays hidden until `abilityId` is set. */
  randomizingAbilities?: boolean;
  abilityId?: string;
  moveIds?: readonly (string | undefined)[];
  /** Undefined means no item choice yet. Null means None. */
  itemId?: string | null;
  requiredItemId?: string;
  abilitiesById: ReadonlyMap<string, Ability>;
  movesById: ReadonlyMap<string, Move>;
  itemsById: ReadonlyMap<string, Item>;
}): SetSoFar {
  const chosenAbility = input.abilityId
    ? input.abilitiesById.get(input.abilityId)
    : undefined;
  const speciesAbilities =
    input.randomizingAbilities
      ? []
      : input.speciesAbilityIds.flatMap((id) => {
          const ability = input.abilitiesById.get(id);
          return ability ? [ability] : [];
        });
  const moves = (input.moveIds ?? []).flatMap((id) => {
    if (!id) {
      return [];
    }
    const move = input.movesById.get(id);
    return move ? [move] : [];
  });
  const chosenItem =
    typeof input.itemId === "string" ? input.itemsById.get(input.itemId) : undefined;
  const requiredItem = input.requiredItemId
    ? input.itemsById.get(input.requiredItemId)
    : undefined;
  const item = chosenItem ?? requiredItem;
  return {
    chosenAbility,
    speciesAbilities,
    moves,
    item,
    itemIsNone: !item && input.itemId === null,
  };
}
