import type { PokemonType } from "@/lib/types/pokemon-type";
import type { StatSpread } from "@/lib/types/stats";
import type {
  EggGroup,
  EvolutionStage,
  FormType,
  GenderRule,
  Generation,
  PokedexColor,
  PokedexShape,
} from "@/lib/types/taxonomy";

export interface DexEntry {
  version: string;
  text: string;
}

export interface PokemonSprites {
  sprite: string | null;
  spriteShiny: string | null;
  artwork: string | null;
  /** Official artwork in the shiny colors. */
  artworkShiny: string | null;
}

export interface PokemonForm {
  id: string;
  pokeApiId: number;
  pokeApiSlug: string;
  name: string;
  displayName: string;
  showdownName: string;
  nationalDexNumber: number;
  generation: Generation;
  types: PokemonType[];
  abilityIds: string[];
  speciesId: string;
  form: string;
  formType: FormType;
  evolutionStage: EvolutionStage;
  isBasic: boolean;
  isStage1: boolean;
  isStage2: boolean;
  isPseudoLegendary: boolean;
  isSubLegendary: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  isParadox: boolean;
  isUltraBeast: boolean;
  isBaby: boolean;
  dexEntries: DexEntry[];
  sprites: PokemonSprites;
  baseStats: StatSpread;
  genderRule: GenderRule;
  /** Official Pokédex species color. Forms of one species share it. Null when PokéAPI has none. */
  pokedexColor: PokedexColor | null;
  /** Official Pokédex body shape. Forms of one species share it. Null when PokéAPI has none. */
  shape: PokedexShape | null;
  /** Official Pokédex height in meters for this form. A plate, memory, or drive form uses the base form. Null when neither has one. */
  heightM: number | null;
  /** Official Pokédex weight in kilograms for this form. A plate, memory, or drive form uses the base form. Null when neither has one. */
  weightKg: number | null;
  /** Showdown egg groups for this form. A plate, memory, or drive form uses the base form. Empty when Showdown lists none. */
  eggGroups: EggGroup[];
  /** Later-stage forms in this Pokémon's evolution line, excluding Mega, Primal, and Gigantamax. */
  evolutionTargetIds: string[];
}
