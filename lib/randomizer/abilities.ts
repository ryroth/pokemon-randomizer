import {
  MAX_ABILITY_COUNT,
  MIN_ABILITY_COUNT,
} from "@/lib/randomizer/defaults";
import {
  createRng,
  InsufficientPoolError,
  pickUnique,
  rerollUnique,
} from "@/lib/randomizer/randomUtils";
import type { Ability } from "@/lib/types/catalog-entities";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export class InvalidAbilityCountError extends Error {
  readonly requestedCount: number;

  constructor(requestedCount: number) {
    super(
      `Choose between ${MIN_ABILITY_COUNT} and ${MAX_ABILITY_COUNT} abilities. You asked for ${requestedCount}.`,
    );
    this.name = "InvalidAbilityCountError";
    this.requestedCount = requestedCount;
  }
}

export interface AbilityRandomizerResult {
  seed: string;
  poolSize: number;
  abilities: Ability[];
}

export function assertAbilityCount(count: number): void {
  if (!Number.isInteger(count) || count < MIN_ABILITY_COUNT || count > MAX_ABILITY_COUNT) {
    throw new InvalidAbilityCountError(count);
  }
}

export function matchingAbilityPoolSize(abilities: readonly Ability[]): number {
  return abilities.length;
}

export function randomizeAbilities(
  abilities: readonly Ability[],
  config: RandomizerConfig,
  seed: string,
): AbilityRandomizerResult {
  assertAbilityCount(config.abilityCount);

  // V1 Ability ON always uses the full standard catalog. Legal-only mode is not implemented.
  const pool = abilities;
  const poolSize = matchingAbilityPoolSize(pool);
  if (config.abilityCount > poolSize) {
    throw new InsufficientPoolError("abilities", poolSize, config.abilityCount);
  }

  return {
    seed,
    poolSize,
    abilities: pickUnique(pool, config.abilityCount, createRng(seed), "abilities"),
  };
}

export function rerollAbility(
  abilities: readonly Ability[],
  currentIds: readonly string[],
  replaceId: string,
  seed: string,
): AbilityRandomizerResult {
  const picked = rerollUnique(abilities, currentIds, replaceId, seed, "abilities");
  return {
    seed,
    poolSize: abilities.length,
    abilities: [picked],
  };
}
