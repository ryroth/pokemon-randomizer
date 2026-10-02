import { fixedMovePower } from "@/lib/data/moveDisplay";
import { MOVE_CATEGORY_LABELS, type Move } from "@/lib/types/catalog-entities";
import { TYPE_LABELS } from "@/lib/types/pokemon-type";

export const MOVE_SORT_COLUMNS = ["name", "type", "category", "power", "accuracy", "pp", "effect"] as const;

export type MoveSortColumn = (typeof MOVE_SORT_COLUMNS)[number];
export type MoveSortDirection = "asc" | "desc";

export interface MoveSort {
  column: MoveSortColumn;
  direction: MoveSortDirection;
}

/** First click sorts text A–Z and numbers high-to-low. The next click reverses that column. */
export function nextMoveSort(current: MoveSort | null, column: MoveSortColumn): MoveSort {
  if (current?.column === column) {
    return { column, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { column, direction: defaultDirection(column) };
}

/**
 * Orders the already filtered move list.
 * A power dash is lower than every numbered power. Accuracy and PP keep a dash after numbered rows.
 * Equal values fall back to the move name.
 */
export function sortMoves(moves: readonly Move[], sort: MoveSort): Move[] {
  return [...moves].sort((left, right) => {
    const compared = compareMoves(left, right, sort);
    if (compared !== 0) {
      return compared;
    }
    return left.name.localeCompare(right.name);
  });
}

function defaultDirection(column: MoveSortColumn): MoveSortDirection {
  return column === "power" || column === "accuracy" || column === "pp" ? "desc" : "asc";
}

function compareMoves(left: Move, right: Move, sort: MoveSort): number {
  switch (sort.column) {
    case "name":
      return directed(left.name.localeCompare(right.name), sort.direction);
    case "type":
      return directed(TYPE_LABELS[left.type].localeCompare(TYPE_LABELS[right.type]), sort.direction);
    case "category":
      return directed(
        MOVE_CATEGORY_LABELS[left.category].localeCompare(MOVE_CATEGORY_LABELS[right.category]),
        sort.direction,
      );
    case "power":
      return comparePower(left.power, right.power, sort.direction);
    case "accuracy":
      return compareOptionalNumber(left.accuracy, right.accuracy, sort.direction);
    case "pp":
      return compareOptionalNumber(left.pp, right.pp, sort.direction);
    case "effect":
      return directed(left.description.localeCompare(right.description), sort.direction);
  }
}

function directed(comparison: number, direction: MoveSortDirection): number {
  return direction === "asc" ? comparison : -comparison;
}

function comparePower(left: number | null, right: number | null, direction: MoveSortDirection): number {
  const leftValue = fixedMovePower(left);
  const rightValue = fixedMovePower(right);
  if (leftValue == null && rightValue == null) {
    return 0;
  }
  if (leftValue == null) {
    return direction === "asc" ? -1 : 1;
  }
  if (rightValue == null) {
    return direction === "asc" ? 1 : -1;
  }
  return directed(leftValue - rightValue, direction);
}

function compareOptionalNumber(
  left: number | null,
  right: number | null,
  direction: MoveSortDirection,
): number {
  const leftValue = listedNumber(left);
  const rightValue = listedNumber(right);
  if (leftValue == null && rightValue == null) {
    return 0;
  }
  if (leftValue == null) {
    return 1;
  }
  if (rightValue == null) {
    return -1;
  }
  return directed(leftValue - rightValue, direction);
}

function listedNumber(value: number | null): number | null {
  if (value == null || value <= 0) {
    return null;
  }
  return value;
}
