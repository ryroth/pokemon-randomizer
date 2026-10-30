import type { Gender } from "@/lib/types/taxonomy";
import type { PokemonType, TeraType } from "@/lib/types/pokemon-type";
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
  /** When set, replaces the species typing for this set only. One or two different types. */
  customTypes?: PokemonType[];
  /** When set, replaces the species base stats for this set only. */
  customBaseStats?: StatSpread;
}

/** Parts a randomizer already chose for one drafted Pokémon. A form's required item is not stored here. */
export interface DraftLocks {
  ability: boolean;
  item: boolean;
  /** Four slots. True when the move randomizer filled that slot. */
  moveSlots: boolean[];
}

/** A Pokémon saved onto the draft team before EVs, Nature, and the rest of the build. */
export interface DraftedPokemon {
  draft: PokemonSetDraft;
  locks: DraftLocks;
}

/** The builder is finishing this slot of the draft team. Locks come from `draftLocks`. */
export interface BuildingDraft {
  rosterId: string;
  index: number;
}

export interface PokemonSet {
  pokemonId: string;
  itemId: string | null;
  abilityId: string;
  /** One to four unique moves. */
  moveIds: string[];
  evs: StatSpread;
  ivs: StatSpread;
  natureId: string;
  teraType: TeraType;
  gender: Gender | null;
  level: number;
  shiny: boolean;
  nickname?: string;
  happiness: number;
  /** Absent means the species typing. Never written onto the catalog. */
  customTypes?: PokemonType[];
  /** Absent means the species base stats. Never written onto the catalog. */
  customBaseStats?: StatSpread;
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
  /**
   * Ability, move, or item steps the user has already left for a later randomizer.
   * Those pools can no longer be cleared. Missing on sessions saved before this existed.
   */
  passedExtras?: Array<Exclude<RandomizerTab, "pokemon">>;
  draft: PokemonSetDraft;
  finalizedSet?: PokemonSet;
  /**
   * The builder is changing this saved team slot. Randomizer locks do not apply, and a valid
   * draft is written back onto that slot.
   */
  editingTeamSlot?: { teamId: string; index: number };
  /** The builder is finishing one slot of the in-progress draft team. */
  buildingDraft?: BuildingDraft;
  /** Lock record for `buildingDraft`, captured when that Pokémon was added. */
  draftLocks?: DraftLocks;
}
