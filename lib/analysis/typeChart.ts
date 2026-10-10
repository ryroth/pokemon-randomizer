import chartData from "@/data/generated/type-chart.json";
import { POKEMON_TYPES, type PokemonType } from "@/lib/types/pokemon-type";

/** Defending type, then attacking type. Generated from Pokémon Showdown by `npm run import:type-chart`. */
const chart = chartData as Record<PokemonType, Record<PokemonType, number>>;

/** How hard one attacking type hits a Pokémon with these types: 0, 0.25, 0.5, 1, 2, or 4. */
export function damageMultiplier(attacker: PokemonType, defenderTypes: readonly PokemonType[]): number {
  return defenderTypes.reduce((total, defender) => total * chart[defender][attacker], 1);
}

/** Every attacking type that is super effective (above 1x) against a single defending type. */
export function typesSuperEffectiveAgainst(defender: PokemonType): PokemonType[] {
  return POKEMON_TYPES.filter((attacker) => chart[defender][attacker] > 1);
}

/** "4×", "2×", "½×", "¼×", "0×" for the matrix. Plain 1× is shown as a dash by the caller. */
export function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) {
    return "0×";
  }
  if (multiplier === 0.25) {
    return "¼×";
  }
  if (multiplier === 0.5) {
    return "½×";
  }
  return `${multiplier}×`;
}

/** Words for a screen reader: "4 times damage", "half damage", "no damage". */
export function describeMultiplier(multiplier: number): string {
  if (multiplier === 0) {
    return "no damage";
  }
  if (multiplier === 0.25) {
    return "one quarter damage";
  }
  if (multiplier === 0.5) {
    return "half damage";
  }
  if (multiplier === 1) {
    return "normal damage";
  }
  return `${multiplier} times damage`;
}
