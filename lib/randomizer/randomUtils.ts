export class InsufficientPoolError extends Error {
  readonly availableCount: number;
  readonly requestedCount: number;
  readonly kind: string;

  constructor(kind: string, availableCount: number, requestedCount: number) {
    super(
      `Only ${availableCount} ${kind} match your current filters. Please reduce the requested amount or broaden your filters.`,
    );
    this.name = "InsufficientPoolError";
    this.kind = kind;
    this.availableCount = availableCount;
    this.requestedCount = requestedCount;
  }
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string): () => number {
  let state = hashSeed(seed) || 1;

  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], next: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(next() * (index + 1));
    const current = copy[index];
    const swap = copy[swapIndex];
    if (current === undefined || swap === undefined) {
      continue;
    }
    copy[index] = swap;
    copy[swapIndex] = current;
  }
  return copy;
}

export function pickUnique<T>(
  pool: readonly T[],
  count: number,
  next: () => number,
  kind = "options",
): T[] {
  if (count > pool.length) {
    throw new InsufficientPoolError(kind, pool.length, count);
  }

  return shuffle(pool, next).slice(0, count);
}
