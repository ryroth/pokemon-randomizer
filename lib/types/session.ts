import type { Gender } from "@/lib/types/taxonomy";
import type { TeraType } from "@/lib/types/pokemon-type";
import type { StatSpread } from "@/lib/types/stats";
import type { RandomizerConfig } from "@/lib/types/randomizer";

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

export interface RandomizerSession {
  config: RandomizerConfig;
  step: AppStep;
  resultPokemonIds: string[];
  selectedPokemonId?: string;
  abilityOptions: string[];
  moveOptions: string[];
  itemOptions: string[];
  draft: PokemonSetDraft;
  finalizedSet?: PokemonSet;
}
