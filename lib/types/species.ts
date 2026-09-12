import type { Generation } from "@/lib/types/taxonomy";
import type { EvolutionStage, GenderRule } from "@/lib/types/taxonomy";

export interface PokemonSpecies {
  id: string;
  pokeApiId: number;
  pokeApiSlug: string;
  displayName: string;
  showdownName: string;
  nationalDexNumber: number;
  generation: Generation;
  isBaby: boolean;
  genderRule: GenderRule;
  evolutionChainId: number;
  evolutionStage: EvolutionStage;
}
