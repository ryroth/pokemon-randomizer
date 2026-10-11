import { createRng } from "@/lib/randomizer/randomUtils";
import type { Gender } from "@/lib/types/taxonomy";

/**
 * Picks Male or Female for a Pokémon that has both and was left blank in the builder. It is an
 * even coin flip from its own seeded stream, so the same seed gives the same gender.
 */
export function rollGender(seed: string): Gender {
  return createRng(`${seed}:gender`)() < 0.5 ? "M" : "F";
}
