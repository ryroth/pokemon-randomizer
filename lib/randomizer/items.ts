import { filterItems, type ItemFilterConfig } from "@/lib/filters/items";
import {
  MAX_ITEM_COUNT,
  MIN_ITEM_COUNT,
} from "@/lib/randomizer/defaults";
import { createRng, InsufficientPoolError, pickUnique, rerollUnique } from "@/lib/randomizer/randomUtils";
import type { Item } from "@/lib/types/catalog-entities";
import type { RandomizerConfig } from "@/lib/types/randomizer";

/**
 * Explicit no-item outcome. Not a catalog id. Stored as `draft.itemId === null`
 * and on `PokemonRoll.appliedItemIds` as `null`. The UI may use a local select
 * sentinel; never persist that sentinel on the session.
 */
export const NONE_ITEM_ID = null;

/** UI-only `<select>` value for explicit None. Never stored on the session. */
export const NONE_ITEM_SELECT_VALUE = "__none__";

export class InvalidItemCountError extends Error {
  readonly requestedCount: number;

  constructor(requestedCount: number) {
    super(
      `Choose between ${MIN_ITEM_COUNT} and ${MAX_ITEM_COUNT} items. You asked for ${requestedCount}.`,
    );
    this.name = "InvalidItemCountError";
    this.requestedCount = requestedCount;
  }
}

export interface ItemRandomizerResult {
  seed: string;
  poolSize: number;
  items: Item[];
}

export function assertItemCount(count: number): void {
  if (!Number.isInteger(count) || count < MIN_ITEM_COUNT || count > MAX_ITEM_COUNT) {
    throw new InvalidItemCountError(count);
  }
}

/**
 * Catalog holdables in the selected Showdown teambuilder categories.
 * Explicit None is always offered as an extra selectable choice and is not
 * part of the generated unique pool.
 */
export function matchingItemPool(
  items: readonly Item[],
  config: ItemFilterConfig,
): Item[] {
  return filterItems(items, config);
}

export function matchingItemPoolSize(
  items: readonly Item[],
  config: ItemFilterConfig,
): number {
  return matchingItemPool(items, config).length;
}

export function randomizeItems(
  items: readonly Item[],
  config: RandomizerConfig,
  seed: string,
): ItemRandomizerResult {
  assertItemCount(config.itemCount);

  const pool = matchingItemPool(items, config);
  const poolSize = pool.length;
  if (config.itemCount > poolSize) {
    throw new InsufficientPoolError("items", poolSize, config.itemCount);
  }

  return {
    seed,
    poolSize,
    items: pickUnique(pool, config.itemCount, createRng(seed), "items"),
  };
}

export function rerollItem(
  items: readonly Item[],
  config: RandomizerConfig,
  currentIds: readonly string[],
  replaceId: string,
  seed: string,
): ItemRandomizerResult {
  const pool = matchingItemPool(items, config);
  const picked = rerollUnique(pool, currentIds, replaceId, seed, "items");
  return {
    seed,
    poolSize: pool.length,
    items: [picked],
  };
}
