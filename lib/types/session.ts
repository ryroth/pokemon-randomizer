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
  /** Partial until every stat has a number. Never prefilled. */
  evs?: Partial<StatSpread>;
  /** Defaults to 31 in every stat when the builder opens. */
  ivs?: Partial<StatSpread>;
  natureId?: string;
  teraType?: TeraType;
  gender?: Gender;
  level?: number;
  shiny?: boolean;
  /** Optional. Empty means the Pokémon uses its species name. */
  nickname?: string;
  /** 0–255. Defaults to 255 when the builder opens. */
  happiness?: number;
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
  nickname?: string;
  happiness: number;
}

export type AppStep = "configure" | "results" | "builder" | "recap";

export interface PokemonRoll {
  seed: string;
  pokemonIds: string[];
  /** Ids from `pokemonIds` that rolled shiny. Missing in sessions saved before shiny rolls existed. */
  shinyPokemonIds?: string[];
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
