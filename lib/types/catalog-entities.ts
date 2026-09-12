import type { PokemonType } from "@/lib/types/pokemon-type";
import type { StatId } from "@/lib/types/stats";

export interface Ability {
  id: string;
  pokeApiSlug: string;
  name: string;
  showdownName: string;
  description: string;
}

export type MoveCategory = "physical" | "special" | "status";

export interface Move {
  id: string;
  pokeApiSlug: string;
  name: string;
  showdownName: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  description: string;
}

export type ItemCategory =
  | "held"
  | "berry"
  | "mega-stone"
  | "z-crystal"
  | "other";

export interface Item {
  id: string;
  pokeApiSlug: string;
  name: string;
  showdownName: string;
  description: string;
  category: ItemCategory;
}

export interface Nature {
  id: string;
  name: string;
  showdownName: string;
  plusStat: StatId | null;
  minusStat: StatId | null;
}
