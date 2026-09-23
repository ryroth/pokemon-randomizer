import {
  DEFAULT_MOVES_PER_POKEMON,
  MAX_MOVES_PER_POKEMON,
  MIN_MOVES_PER_POKEMON,
} from "@/lib/randomizer/defaults";
import { createRng, InsufficientPoolError, pickUnique } from "@/lib/randomizer/randomUtils";

export const MOVES_ASSIGNED_PER_POKEMON = MAX_MOVES_PER_POKEMON;

export type ExtraKind = "ability" | "move" | "item";

export function requiredMovesPerPokemon(movesPerPokemon: number): number {
  if (!Number.isInteger(movesPerPokemon)) {
    return DEFAULT_MOVES_PER_POKEMON;
  }

  return Math.min(MAX_MOVES_PER_POKEMON, Math.max(MIN_MOVES_PER_POKEMON, movesPerPokemon));
}

export function extraSlotsNeeded(
  kind: ExtraKind,
  pokemonCount: number,
  movesPerPokemon: number = DEFAULT_MOVES_PER_POKEMON,
): number {
  if (kind === "move") {
    return pokemonCount * requiredMovesPerPokemon(movesPerPokemon);
  }
  return pokemonCount;
}

export function extrasInsufficientMessage(
  kind: ExtraKind,
  availableCount: number,
  requestedCount: number,
  movesPerPokemon: number = DEFAULT_MOVES_PER_POKEMON,
): string {
  if (kind === "ability") {
    return `You generated ${availableCount} abilities but need ${requestedCount} unique abilities, one for each Pokémon. Generate more abilities or fewer Pokémon.`;
  }
  if (kind === "item") {
    return `You generated ${availableCount} items but need ${requestedCount} unique items, one for each Pokémon. Generate more items or fewer Pokémon.`;
  }
  const perPokemon = requiredMovesPerPokemon(movesPerPokemon);
  return `You generated ${availableCount} moves but need ${requestedCount} unique moves, ${perPokemon} for each Pokémon. Generate more moves or fewer Pokémon.`;
}

export function assignUniqueFromPool(
  pool: readonly string[],
  count: number,
  seed: string,
  kind: ExtraKind,
): string[] {
  const label = extraKindLabel(kind);
  if (pool.length < count) {
    throw new InsufficientPoolError(
      label,
      pool.length,
      count,
      extrasInsufficientMessage(kind, pool.length, count),
    );
  }

  return pickUnique(pool, count, createRng(seed), label);
}

function extraKindLabel(kind: ExtraKind): string {
  switch (kind) {
    case "ability":
      return "abilities";
    case "move":
      return "moves";
    case "item":
      return "items";
  }
}
