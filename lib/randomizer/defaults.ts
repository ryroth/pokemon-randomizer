import { GENERATIONS } from "@/lib/types/taxonomy";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import { EVOLUTION_STAGES } from "@/lib/types/taxonomy";
import { POKEMON_TYPES } from "@/lib/types/pokemon-type";

export const MIN_POKEMON_COUNT = 1;
export const MAX_POKEMON_COUNT = 12;
export const DEFAULT_POKEMON_COUNT = 6;

export const DEFAULT_RANDOMIZER_CONFIG: RandomizerConfig = {
  pokemonCount: DEFAULT_POKEMON_COUNT,
  generations: [...GENERATIONS],
  types: [...POKEMON_TYPES],
  typeMatchMode: "or",
  formTypes: ["base"],
  evolutionStages: [...EVOLUTION_STAGES],
  allowPseudoLegendary: true,
  allowSubLegendary: true,
  allowLegendary: true,
  allowMythical: true,
  allowParadox: true,
  allowUltraBeast: true,
  showPokedexEntry: true,
  randomizeAbilities: false,
  abilityCount: 3,
  abilityPoolMode: "all",
  randomizeMoves: false,
  moveCount: 8,
  movePoolMode: "all",
  randomizeItems: false,
  itemCount: 3,
};
