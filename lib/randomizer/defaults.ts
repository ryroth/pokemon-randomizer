import { GENERATIONS } from "@/lib/types/taxonomy";
import type { RandomizerConfig, RandomizerTab } from "@/lib/types/randomizer";
import { EVOLUTION_STAGES } from "@/lib/types/taxonomy";
import { POKEMON_TYPES } from "@/lib/types/pokemon-type";
import { ITEM_CATEGORIES, MOVE_CATEGORIES } from "@/lib/types/catalog-entities";

export const TYPICAL_RANDOMIZER_ORDER: RandomizerTab[] = [
  "pokemon",
  "ability",
  "move",
  "item",
];

export const MIN_POKEMON_COUNT = 1;
export const MAX_POKEMON_COUNT = 12;
export const DEFAULT_POKEMON_COUNT = 6;

export const MIN_ABILITY_COUNT = 1;
export const MAX_ABILITY_COUNT = 12;
export const DEFAULT_ABILITY_COUNT = 3;

export const MIN_MOVE_COUNT = 4;
export const MAX_MOVE_COUNT = 12;
export const DEFAULT_MOVE_COUNT = 8;

export const MIN_MOVES_PER_POKEMON = 1;
export const MAX_MOVES_PER_POKEMON = 4;
export const DEFAULT_MOVES_PER_POKEMON = 4;

export const MIN_ITEM_COUNT = 1;
export const MAX_ITEM_COUNT = 12;
export const DEFAULT_ITEM_COUNT = 3;

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
  abilityCount: DEFAULT_ABILITY_COUNT,
  abilityPoolMode: "all",
  randomizeMoves: false,
  moveCount: DEFAULT_MOVE_COUNT,
  movesPerPokemon: DEFAULT_MOVES_PER_POKEMON,
  moveCategories: [...MOVE_CATEGORIES],
  moveTypes: [...POKEMON_TYPES],
  movePoolMode: "all",
  randomizeItems: false,
  itemCount: DEFAULT_ITEM_COUNT,
  itemCategories: [...ITEM_CATEGORIES],
  randomizerOrder: [...TYPICAL_RANDOMIZER_ORDER],
};

export function cloneRandomizerConfig(config: RandomizerConfig): RandomizerConfig {
  return {
    ...config,
    generations: [...config.generations],
    types: [...config.types],
    formTypes: [...config.formTypes],
    evolutionStages: [...config.evolutionStages],
    moveCategories: [...config.moveCategories],
    moveTypes: [...config.moveTypes],
    itemCategories: [...config.itemCategories],
    randomizerOrder: [...config.randomizerOrder],
  };
}

export function restoreTypicalRandomizerOrder(config: RandomizerConfig): RandomizerConfig {
  return cloneRandomizerConfig({
    ...config,
    randomizerOrder: [...TYPICAL_RANDOMIZER_ORDER],
  });
}

export function resetPokemonFilters(config: RandomizerConfig): RandomizerConfig {
  return cloneRandomizerConfig({
    ...config,
    pokemonCount: DEFAULT_RANDOMIZER_CONFIG.pokemonCount,
    generations: DEFAULT_RANDOMIZER_CONFIG.generations,
    types: DEFAULT_RANDOMIZER_CONFIG.types,
    typeMatchMode: DEFAULT_RANDOMIZER_CONFIG.typeMatchMode,
    formTypes: DEFAULT_RANDOMIZER_CONFIG.formTypes,
    evolutionStages: DEFAULT_RANDOMIZER_CONFIG.evolutionStages,
    allowPseudoLegendary: DEFAULT_RANDOMIZER_CONFIG.allowPseudoLegendary,
    allowSubLegendary: DEFAULT_RANDOMIZER_CONFIG.allowSubLegendary,
    allowLegendary: DEFAULT_RANDOMIZER_CONFIG.allowLegendary,
    allowMythical: DEFAULT_RANDOMIZER_CONFIG.allowMythical,
    allowParadox: DEFAULT_RANDOMIZER_CONFIG.allowParadox,
    allowUltraBeast: DEFAULT_RANDOMIZER_CONFIG.allowUltraBeast,
    showPokedexEntry: DEFAULT_RANDOMIZER_CONFIG.showPokedexEntry,
  });
}
