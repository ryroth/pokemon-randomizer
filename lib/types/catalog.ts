import type { Ability, Item, Move, Nature } from "@/lib/types/catalog-entities";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonSpecies } from "@/lib/types/species";

export interface Catalog {
  version: string;
  generatedAt: string;
  pokemon: PokemonForm[];
  species: PokemonSpecies[];
  abilities: Ability[];
  moves: Move[];
  items: Item[];
  natures: Nature[];
}
