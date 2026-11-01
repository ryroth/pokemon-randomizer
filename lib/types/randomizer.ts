import type {
  EggGroup,
  EvolutionProgress,
  EvolutionStage,
  FormType,
  Generation,
  MeasurementSystem,
  NameInitial,
  PokedexColor,
  PokedexShape,
  TypeCountFilter,
} from "@/lib/types/taxonomy";
import type { StatId } from "@/lib/types/stats";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { ItemCategory, MoveCategory } from "@/lib/types/catalog-entities";
import type { CardFact } from "@/lib/types/card-facts";

export type TypeMatchMode = "or" | "and";

export type MovePoolMode = "all" | "learnset";

export type AbilityPoolMode = "all" | "legal";

export type RandomizerTab = "pokemon" | "ability" | "move" | "item";

export interface RandomizerConfig {
  pokemonCount: number;
  /** Percent chance (0–100) that each rolled Pokémon is shiny. */
  shinyChance: number;
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
  /** Letters the display name may start with. Empty matches nothing. Every letter is the default. */
  nameInitials: NameInitial[];
  /** Inclusive lower bound. Null means no minimum. */
  bstMin: number | null;
  /** Inclusive upper bound. Null means no maximum. */
  bstMax: number | null;
  typeCount: TypeCountFilter;
  evolutionProgress: EvolutionProgress;
  /** Empty matches nothing. Every stat is the default. A tie matches each stat that shares the top number. */
  highestStats: StatId[];
  /** Empty matches nothing. Every stat is the default. A tie matches each stat that shares the bottom number. */
  lowestStats: StatId[];
  /** Exact official English genus, such as Mouse Pokémon. Blank means any species. */
  genusQuery: string;
  /** How height and weight are shown. Filter numbers are still stored in meters and kilograms. */
  measurementSystem: MeasurementSystem;
  /** Empty matches nothing. Every color is the default. */
  pokedexColors: PokedexColor[];
  /** Inclusive lower bound in meters. Null means no minimum. */
  heightMinM: number | null;
  /** Inclusive upper bound in meters. Null means no maximum. */
  heightMaxM: number | null;
  /** Inclusive lower bound in kilograms. Null means no minimum. */
  weightMinKg: number | null;
  /** Inclusive upper bound in kilograms. Null means no maximum. */
  weightMaxKg: number | null;
  /** Empty matches nothing. Every shape is the default. */
  shapes: PokedexShape[];
  /** Empty matches nothing. Every egg group is the default. A form matches if it has any selected group. */
  eggGroups: EggGroup[];
  /** Facts drawn on a generated card. Every fact is the default, so the usual card stays. */
  shownCardFacts: CardFact[];
  /** Kept in step with the Pokédex entry fact for sessions saved before that fact existed. */
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
