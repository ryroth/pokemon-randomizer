import type { Item, ItemCategory } from "@/lib/types/catalog-entities";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export type ItemFilterConfig = Pick<RandomizerConfig, "itemCategories">;

/**
 * Returns catalog holdables whose Showdown teambuilder category is in
 * `itemCategories`. An empty list matches nothing.
 */
export function filterItems(
  items: readonly Item[],
  config: ItemFilterConfig,
): Item[] {
  const categories = new Set<ItemCategory>(config.itemCategories);
  if (categories.size === 0) {
    return [];
  }

  return items.filter((item) => categories.has(item.category));
}
