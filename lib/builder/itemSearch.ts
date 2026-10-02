import { moveSearchId } from "@/lib/builder/moveSearch";
import { ITEM_CATEGORIES, type Item, type ItemCategory } from "@/lib/types/catalog-entities";

export interface ItemSearchSection {
  category: ItemCategory;
  items: Item[];
}

/**
 * Holdable items grouped the way Pokémon Showdown's teambuilder lists them.
 * An empty search keeps every item, alphabetical inside each category.
 * A typed search keeps names whose letters contain the query, earlier matches first.
 */
export function searchItemSections(items: readonly Item[], query: string): ItemSearchSection[] {
  const needle = moveSearchId(query);
  const ranked = needle ? rankItems(items, needle) : [...items].sort(byName);
  const byCategory = new Map<ItemCategory, Item[]>();
  for (const item of ranked) {
    const group = byCategory.get(item.category) ?? [];
    group.push(item);
    byCategory.set(item.category, group);
  }

  return ITEM_CATEGORIES.flatMap((category) => {
    const group = byCategory.get(category);
    return group && group.length > 0 ? [{ category, items: group }] : [];
  });
}

/** Showdown's item-search row stays available when the query matches "None". */
export function noneMatchesItemQuery(query: string): boolean {
  const needle = moveSearchId(query);
  return needle.length === 0 || "none".includes(needle);
}

function rankItems(items: readonly Item[], needle: string): Item[] {
  const ranked = items.flatMap((item) => {
    const index = moveSearchId(item.name).indexOf(needle);
    if (index === -1) {
      return [];
    }
    return [{ item, index, length: moveSearchId(item.name).length }];
  });
  ranked.sort((left, right) => {
    if (left.index !== right.index) {
      return left.index - right.index;
    }
    if (left.length !== right.length) {
      return left.length - right.length;
    }
    return left.item.name.localeCompare(right.item.name);
  });
  return ranked.map((entry) => entry.item);
}

function byName(left: Item, right: Item): number {
  return left.name.localeCompare(right.name);
}
