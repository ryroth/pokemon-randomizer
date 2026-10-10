import type { PokemonForm } from "@/lib/types/pokemon";
import type { StatSpread } from "@/lib/types/stats";

/**
 * The ball a rolled Pokémon comes out of. This is presentation only and never changes a roll.
 *
 * - Master Ball: Restricted Legendary, Sub-Legendary, Mythical, Paradox, and Ultra Beast.
 * - Luxury Ball: Pseudo-legendary, which is a special group but not a rare one.
 * - Everything else goes by base stat total: Poké Ball, Great Ball, then Ultra Ball.
 */
export type BallKind = "poke" | "great" | "ultra" | "master" | "luxury";

/** A base stat total at or above this is a Great Ball. */
export const GREAT_BALL_MIN_BST = 400;
/** A base stat total at or above this is an Ultra Ball. */
export const ULTRA_BALL_MIN_BST = 500;

export const BALL_LABELS: Record<BallKind, string> = {
  poke: "Poké Ball",
  great: "Great Ball",
  ultra: "Ultra Ball",
  master: "Master Ball",
  luxury: "Luxury Ball",
};

export type BallInput = Pick<
  PokemonForm,
  | "baseStats"
  | "isLegendary"
  | "isSubLegendary"
  | "isMythical"
  | "isParadox"
  | "isUltraBeast"
  | "isPseudoLegendary"
>;

export function baseStatTotal(stats: StatSpread): number {
  return stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe;
}

export function ballForPokemon(form: BallInput): BallKind {
  if (
    form.isLegendary ||
    form.isSubLegendary ||
    form.isMythical ||
    form.isParadox ||
    form.isUltraBeast
  ) {
    return "master";
  }
  if (form.isPseudoLegendary) {
    return "luxury";
  }
  const total = baseStatTotal(form.baseStats);
  if (total >= ULTRA_BALL_MIN_BST) {
    return "ultra";
  }
  if (total >= GREAT_BALL_MIN_BST) {
    return "great";
  }
  return "poke";
}
