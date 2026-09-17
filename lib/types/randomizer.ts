import type {
  EvolutionStage,
  FormType,
  Generation,
} from "@/lib/types/taxonomy";
import type { PokemonType } from "@/lib/types/pokemon-type";

export type TypeMatchMode = "or" | "and";

export type MovePoolMode = "all" | "learnset";

export type AbilityPoolMode = "all" | "legal";

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
  movePoolMode: MovePoolMode;
  randomizeItems: boolean;
  itemCount: number;
  seed?: string;
}
