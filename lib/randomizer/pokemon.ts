import {
  evolutionConflictContext,
  evolutionFormsConflict,
  maximumCompatiblePokemonCount,
  type EvolutionConflictContext,
} from "@/lib/data/evolution";
import { filterPokemonForms } from "@/lib/filters/pokemon";
import {
  MAX_POKEMON_COUNT,
  MIN_POKEMON_COUNT,
} from "@/lib/randomizer/defaults";
import { InvalidAbilityCountError } from "@/lib/randomizer/abilities";
import { InvalidItemCountError } from "@/lib/randomizer/items";
import { InvalidMoveCountError } from "@/lib/randomizer/moves";
import {
  createRng,
  InsufficientPoolError,
  rerollEmptyMessage,
  shuffle,
} from "@/lib/randomizer/randomUtils";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export class InvalidPokemonCountError extends Error {
  readonly requestedCount: number;

  constructor(requestedCount: number) {
    super(
      `Choose between ${MIN_POKEMON_COUNT} and ${MAX_POKEMON_COUNT} Pokémon. You asked for ${requestedCount}.`,
    );
    this.name = "InvalidPokemonCountError";
    this.requestedCount = requestedCount;
  }
}

export interface PokemonRandomizerResult {
  seed: string;
  poolSize: number;
  pokemon: PokemonForm[];
}

export function assertPokemonCount(count: number): void {
  if (!Number.isInteger(count) || count < MIN_POKEMON_COUNT || count > MAX_POKEMON_COUNT) {
    throw new InvalidPokemonCountError(count);
  }
}

export function matchingPokemonPoolSize(
  pokemon: readonly PokemonForm[],
  config: RandomizerConfig,
): number {
  const context = evolutionConflictContext(pokemon);
  return maximumCompatiblePokemonCount(filterPokemonForms(pokemon, config), context);
}

export function randomizePokemon(
  pokemon: readonly PokemonForm[],
  config: RandomizerConfig,
  seed: string,
): PokemonRandomizerResult {
  assertPokemonCount(config.pokemonCount);

  const context = evolutionConflictContext(pokemon);
  const pool = filterPokemonForms(pokemon, config);
  const poolSize = maximumCompatiblePokemonCount(pool, context);
  const rolled = pickCompatiblePokemon(pool, config.pokemonCount, createRng(seed), context);

  return {
    seed,
    poolSize,
    pokemon: rolled,
  };
}

export function rerollPokemon(
  pokemon: readonly PokemonForm[],
  config: RandomizerConfig,
  currentIds: readonly string[],
  replaceId: string,
  seed: string,
): PokemonRandomizerResult {
  assertPokemonCount(config.pokemonCount);

  const context = evolutionConflictContext(pokemon);
  const pool = filterPokemonForms(pokemon, config);
  const formById = new Map(pokemon.map((form) => [form.id, form]));
  const kept = currentIds.flatMap((id) => {
    if (id === replaceId) {
      return [];
    }
    const form = formById.get(id);
    return form ? [form] : [];
  });
  const candidates = pool.filter(
    (form) =>
      form.id !== replaceId &&
      kept.every((keptForm) => !evolutionFormsConflict(form, keptForm, context)),
  );
  if (candidates.length === 0) {
    throw new InsufficientPoolError("Pokémon", 0, 1, rerollEmptyMessage("Pokémon"));
  }

  const [replacement] = pickCompatiblePokemon(candidates, 1, createRng(seed), context);
  if (!replacement) {
    throw new InsufficientPoolError("Pokémon", 0, 1, rerollEmptyMessage("Pokémon"));
  }

  return {
    seed,
    poolSize: candidates.length,
    pokemon: [replacement],
  };
}

function pickCompatiblePokemon(
  pool: readonly PokemonForm[],
  count: number,
  next: () => number,
  context: EvolutionConflictContext,
): PokemonForm[] {
  const availableCount = maximumCompatiblePokemonCount(pool, context);
  if (count > availableCount) {
    throw new InsufficientPoolError("Pokémon", availableCount, count);
  }

  const picked: PokemonForm[] = [];
  const remaining = new Map(pool.map((form) => [form.id, form]));

  for (const candidate of shuffle(pool, next)) {
    if (!remaining.has(candidate.id)) {
      continue;
    }

    const leftover: PokemonForm[] = [];
    for (const form of remaining.values()) {
      if (form.id !== candidate.id && !evolutionFormsConflict(candidate, form, context)) {
        leftover.push(form);
      }
    }

    if (picked.length + 1 + maximumCompatiblePokemonCount(leftover, context) < count) {
      continue;
    }

    picked.push(candidate);
    remaining.clear();
    for (const form of leftover) {
      remaining.set(form.id, form);
    }

    if (picked.length === count) {
      return picked;
    }
  }

  throw new InsufficientPoolError("Pokémon", availableCount, count);
}

export function userFacingRandomizerMessage(error: unknown): string {
  if (
    error instanceof InvalidPokemonCountError ||
    error instanceof InvalidAbilityCountError ||
    error instanceof InvalidItemCountError ||
    error instanceof InvalidMoveCountError
  ) {
    return error.message;
  }

  if (error instanceof InsufficientPoolError) {
    return error.message;
  }

  return "Something went wrong while generating. Please try again.";
}
