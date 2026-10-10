import type { Move } from "@/lib/types/catalog-entities";
import type { PokemonType } from "@/lib/types/pokemon-type";

/**
 * Same-type attack bonus from the Pokémon's own types. Status moves never get it.
 * Tera type and abilities that change types are not considered.
 */
export function isStabMove(move: Pick<Move, "type" | "category">, pokemonTypes: readonly PokemonType[]): boolean {
  return move.category !== "status" && pokemonTypes.includes(move.type);
}
