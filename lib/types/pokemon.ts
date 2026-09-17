import type { PokemonType } from "@/lib/types/pokemon-type";
import type { StatSpread } from "@/lib/types/stats";
import type {
  EvolutionStage,
  FormType,
  GenderRule,
  Generation,
} from "@/lib/types/taxonomy";

export interface DexEntry {
  version: string;
  text: string;
}

export interface PokemonSprites {
  sprite: string | null;
  spriteShiny: string | null;
  artwork: string | null;
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
}
