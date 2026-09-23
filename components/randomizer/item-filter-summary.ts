import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
} from "@/lib/types/catalog-entities";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export function describeItemCategoryFilter(config: RandomizerConfig): string {
  if (config.itemCategories.length === 0) {
    return "No categories";
  }

  if (config.itemCategories.length === ITEM_CATEGORIES.length) {
    return "All categories";
  }

  return ITEM_CATEGORIES.filter((category) => config.itemCategories.includes(category))
    .map((category) => ITEM_CATEGORY_LABELS[category])
    .join(", ");
}
