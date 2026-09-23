export class InsufficientPoolError extends Error {
  readonly availableCount: number;
  readonly requestedCount: number;
  readonly kind: string;

  constructor(
    kind: string,
    availableCount: number,
    requestedCount: number,
    message?: string,
  ) {
    super(
      message ??
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

export function createSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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

export function rerollEmptyMessage(kind: string): string {
  return `No other matching ${kind} are left to re-roll this one. Broaden your filters or generate a new set.`;
}

/**
 * Pick a replacement that is still in `pool`, is not `replaceId`, and does not
 * duplicate any other current id. The replaced id can appear again on a later
 * re-roll of a different option.
 */
export function rerollUnique<T extends { id: string }>(
  pool: readonly T[],
  currentIds: readonly string[],
  replaceId: string,
  seed: string,
  kind: string,
): T {
  const keptIds = new Set(currentIds.filter((id) => id !== replaceId));
  const candidates = pool.filter((item) => item.id !== replaceId && !keptIds.has(item.id));
  if (candidates.length === 0) {
    throw new InsufficientPoolError(kind, 0, 1, rerollEmptyMessage(kind));
  }

  const [picked] = pickUnique(candidates, 1, createRng(seed), kind);
  if (!picked) {
    throw new InsufficientPoolError(kind, 0, 1, rerollEmptyMessage(kind));
  }

  return picked;
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

export function pickUniqueBy<T>(
  pool: readonly T[],
  count: number,
  keyOf: (item: T) => string,
  next: () => number,
  kind = "options",
): T[] {
  const uniqueKeyCount = new Set(pool.map(keyOf)).size;
  if (count > uniqueKeyCount) {
    throw new InsufficientPoolError(kind, uniqueKeyCount, count);
  }

  const picked: T[] = [];
  const seen = new Set<string>();
  for (const item of shuffle(pool, next)) {
    const key = keyOf(item);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    picked.push(item);
    if (picked.length === count) {
      return picked;
    }
  }

  throw new InsufficientPoolError(kind, uniqueKeyCount, count);
}
