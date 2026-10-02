import type { Move } from "@/lib/types/catalog-entities";

/** Letters and digits only, matching how Showdown compares a typed search to a move id. */
export function moveSearchId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Where the typed letters sit in the display name.
 * Spaces and punctuation are skipped, so "iceb" covers "Ice B" in "Ice Beam".
 */
export function moveNameMatchSpan(name: string, query: string): { start: number; end: number } | null {
  const needle = moveSearchId(query);
  if (!needle) {
    return null;
  }

  const indexes: number[] = [];
  let id = "";
  for (let index = 0; index < name.length; index += 1) {
    const character = name[index]?.toLowerCase() ?? "";
    if (/[a-z0-9]/.test(character)) {
      indexes.push(index);
      id += character;
    }
  }

  const start = id.indexOf(needle);
  if (start === -1) {
    return null;
  }
  const endIndex = indexes[start + needle.length - 1];
  const startIndex = indexes[start];
  if (startIndex === undefined || endIndex === undefined) {
    return null;
  }
  return { start: startIndex, end: endIndex + 1 };
}

/**
 * Moves whose names contain the typed letters, in Showdown's order:
 * the letters sit earlier in the name first, then shorter names.
 * An empty search returns the whole list, alphabetical.
 */
export function searchMovesByName(moves: readonly Move[], query: string): { matches: Move[]; total: number } {
  const needle = moveSearchId(query);
  if (!needle) {
    const sorted = [...moves].sort((left, right) => left.name.localeCompare(right.name));
    return { matches: sorted, total: sorted.length };
  }

  const ranked = moves.flatMap((move) => {
    const index = moveSearchId(move.name).indexOf(needle);
    if (index === -1) {
      return [];
    }
    return [{ move, index, length: moveSearchId(move.name).length }];
  });
  ranked.sort((left, right) => {
    if (left.index !== right.index) {
      return left.index - right.index;
    }
    if (left.length !== right.length) {
      return left.length - right.length;
    }
    return left.move.name.localeCompare(right.move.name);
  });
  return { matches: ranked.map((entry) => entry.move), total: ranked.length };
}
