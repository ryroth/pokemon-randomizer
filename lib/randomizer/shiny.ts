import { MAX_SHINY_CHANCE, MIN_SHINY_CHANCE } from "@/lib/randomizer/defaults";
import { createRng } from "@/lib/randomizer/randomUtils";

export class InvalidShinyChanceError extends Error {
  readonly requestedChance: number;

  constructor(requestedChance: number) {
    super(
      `Choose a shiny chance between ${MIN_SHINY_CHANCE}% and ${MAX_SHINY_CHANCE}%. You asked for ${requestedChance}%.`,
    );
    this.name = "InvalidShinyChanceError";
    this.requestedChance = requestedChance;
  }
}

export function assertShinyChance(chance: number): void {
  if (!Number.isFinite(chance) || chance < MIN_SHINY_CHANCE || chance > MAX_SHINY_CHANCE) {
    throw new InvalidShinyChanceError(chance);
  }
}

/**
 * Decide which of the rolled Pokémon are shiny. Each one is a separate roll at `chancePercent`.
 * It uses its own stream from the roll seed, so it never changes which Pokémon were picked and
 * the same seed always gives the same shinies.
 */
export function rollShinyIds(
  pokemon: readonly { id: string }[],
  chancePercent: number,
  seed: string,
): string[] {
  assertShinyChance(chancePercent);
  const next = createRng(`${seed}:shiny`);
  const shinyIds: string[] = [];
  for (const form of pokemon) {
    // Draw for every Pokémon, so one Pokémon's result does not depend on how many came before.
    if (next() * 100 < chancePercent) {
      shinyIds.push(form.id);
    }
  }
  return shinyIds;
}
