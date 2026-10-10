import { moveSearchId } from "@/lib/builder/moveSearch";
import type { Ability } from "@/lib/types/catalog-entities";

/**
 * Abilities whose names contain the typed letters, earlier matches first, then shorter names.
 * An empty search keeps the order it was given.
 */
export function searchAbilitiesByName<T extends Pick<Ability, "name">>(abilities: readonly T[], query: string): T[] {
  const needle = moveSearchId(query);
  if (!needle) {
    return [...abilities];
  }
  const ranked = abilities.flatMap((ability) => {
    const id = moveSearchId(ability.name);
    const index = id.indexOf(needle);
    return index === -1 ? [] : [{ ability, index, length: id.length }];
  });
  ranked.sort(
    (left, right) =>
      left.index - right.index ||
      left.length - right.length ||
      left.ability.name.localeCompare(right.ability.name),
  );
  return ranked.map((entry) => entry.ability);
}
