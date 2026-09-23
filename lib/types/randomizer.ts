import type {
  EvolutionStage,
  FormType,
  Generation,
} from "@/lib/types/taxonomy";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { ItemCategory, MoveCategory } from "@/lib/types/catalog-entities";

export type TypeMatchMode = "or" | "and";

export type MovePoolMode = "all" | "learnset";

export type AbilityPoolMode = "all" | "legal";

export type RandomizerTab = "pokemon" | "ability" | "move" | "item";

export interface RandomizerConfig {
  pokemonCount: number;
  generations: Generation[];
  types: PokemonType[];
  typeMatchMode: TypeMatchMode;
  formTypes: FormType[];
  evolutionStages: EvolutionStage[];
  allowPseudoLegendary: boolean;
  allowSubLegendary: boolean;
  allowLegendary: boolean;
  allowMythical: boolean;
  allowParadox: boolean;
  allowUltraBeast: boolean;
  showPokedexEntry: boolean;
  randomizeAbilities: boolean;
  abilityCount: number;
  abilityPoolMode: AbilityPoolMode;
  randomizeMoves: boolean;
  moveCount: number;
  movesPerPokemon: number;
  moveCategories: MoveCategory[];
  moveTypes: PokemonType[];
  movePoolMode: MovePoolMode;
  randomizeItems: boolean;
  itemCount: number;
  itemCategories: ItemCategory[];
  randomizerOrder: RandomizerTab[];
  seed?: string;
}
