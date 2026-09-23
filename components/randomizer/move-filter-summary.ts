import {
  MOVE_CATEGORIES,
  MOVE_CATEGORY_LABELS,
} from "@/lib/types/catalog-entities";
import { POKEMON_TYPES, TYPE_LABELS } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export function describeMoveCategoryFilter(config: RandomizerConfig): string {
  if (config.moveCategories.length === 0) {
    return "No categories";
  }

  if (config.moveCategories.length === MOVE_CATEGORIES.length) {
    return "All categories";
  }

  return MOVE_CATEGORIES.filter((category) => config.moveCategories.includes(category))
    .map((category) => MOVE_CATEGORY_LABELS[category])
    .join(", ");
}

export function describeMoveTypeFilter(config: RandomizerConfig): string {
  if (config.moveTypes.length === 0) {
    return "No types";
  }

  if (config.moveTypes.length === POKEMON_TYPES.length) {
    return "All types";
  }

  return POKEMON_TYPES.filter((type) => config.moveTypes.includes(type))
    .map((type) => TYPE_LABELS[type])
    .join(", ");
}
