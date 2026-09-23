import { filterMoves, type MoveFilterConfig } from "@/lib/filters/moves";
import {
  MAX_MOVE_COUNT,
  MIN_MOVE_COUNT,
} from "@/lib/randomizer/defaults";
import { createRng, InsufficientPoolError, pickUnique, rerollUnique } from "@/lib/randomizer/randomUtils";
import type { Move } from "@/lib/types/catalog-entities";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export class InvalidMoveCountError extends Error {
  readonly requestedCount: number;

  constructor(requestedCount: number) {
    super(
      `Choose between ${MIN_MOVE_COUNT} and ${MAX_MOVE_COUNT} moves. You asked for ${requestedCount}.`,
    );
    this.name = "InvalidMoveCountError";
    this.requestedCount = requestedCount;
  }
}

export interface MoveRandomizerResult {
  seed: string;
  poolSize: number;
  moves: Move[];
}

export function assertMoveCount(count: number): void {
  if (!Number.isInteger(count) || count < MIN_MOVE_COUNT || count > MAX_MOVE_COUNT) {
    throw new InvalidMoveCountError(count);
  }
}

export function matchingMovePool(
  moves: readonly Move[],
  config: MoveFilterConfig,
): Move[] {
  return filterMoves(moves, config);
}

export function matchingMovePoolSize(
  moves: readonly Move[],
  config: MoveFilterConfig,
): number {
  return matchingMovePool(moves, config).length;
}

export function randomizeMoves(
  moves: readonly Move[],
  config: RandomizerConfig,
  seed: string,
): MoveRandomizerResult {
  assertMoveCount(config.moveCount);

  // V1 Move ON always uses the standard catalog, then filters by selected
  // damage classes and move types. Learnset-only mode is not implemented.
  const pool = matchingMovePool(moves, config);
  const poolSize = pool.length;
  if (config.moveCount > poolSize) {
    throw new InsufficientPoolError("moves", poolSize, config.moveCount);
  }

  return {
    seed,
    poolSize,
    moves: pickUnique(pool, config.moveCount, createRng(seed), "moves"),
  };
}

export function rerollMove(
  moves: readonly Move[],
  config: RandomizerConfig,
  currentIds: readonly string[],
  replaceId: string,
  seed: string,
): MoveRandomizerResult {
  const pool = matchingMovePool(moves, config);
  const picked = rerollUnique(pool, currentIds, replaceId, seed, "moves");
  return {
    seed,
    poolSize: pool.length,
    moves: [picked],
  };
}
