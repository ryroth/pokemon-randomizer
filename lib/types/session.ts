import type { Gender } from "@/lib/types/taxonomy";
import type { TeraType } from "@/lib/types/pokemon-type";
import type { StatSpread } from "@/lib/types/stats";
import type { RandomizerConfig, RandomizerTab } from "@/lib/types/randomizer";

export type { RandomizerTab };

export interface PokemonSetDraft {
  pokemonId?: string;
  itemId?: string | null;
  abilityId?: string;
  moveIds: Array<string | undefined>;
  evs?: StatSpread;
  ivs?: StatSpread;
  natureId?: string;
  teraType?: TeraType;
  gender?: Gender;
  level?: number;
  shiny?: boolean;
  evsConfirmed: boolean;
}

export interface PokemonSet {
  pokemonId: string;
  itemId: string | null;
  abilityId: string;
  moveIds: [string, string, string, string];
  evs: StatSpread;
  ivs: StatSpread;
  natureId: string;
  teraType: TeraType;
  gender: Gender | null;
  level: number;
  shiny: boolean;
}

export type AppStep = "configure" | "results" | "builder" | "recap";

export interface PokemonRoll {
  seed: string;
  pokemonIds: string[];
  appliedAbilityIds?: Array<string | undefined>;
  appliedMoveIds?: Array<Array<string | undefined>>;
  appliedItemIds?: Array<string | null | undefined>;
}

export interface RandomizerSession {
  config: RandomizerConfig;
  step: AppStep;
  tab: RandomizerTab;
  resultPokemonIds: string[];
  pokemonRolls: PokemonRoll[];
  viewedRollIndex: number;
  selectedPokemonId?: string;
  evolvedPokemonId?: string;
  abilityOptions: string[];
  moveOptions: string[];
  itemOptions: string[];
  draft: PokemonSetDraft;
  finalizedSet?: PokemonSet;
}
