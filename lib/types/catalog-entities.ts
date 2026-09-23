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

export const MOVE_CATEGORIES: MoveCategory[] = ["physical", "special", "status"];

export const MOVE_CATEGORY_LABELS: Record<MoveCategory, string> = {
  physical: "Physical",
  special: "Special",
  status: "Status",
};

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

export type ItemKind = "held" | "berry" | "mega-stone" | "z-crystal" | "other";

export type ItemCategory =
  | "popular"
  | "items"
  | "pokemon-specific"
  | "usually-useless"
  | "useless";

export const ITEM_CATEGORIES: ItemCategory[] = [
  "popular",
  "items",
  "pokemon-specific",
  "usually-useless",
  "useless",
];

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  popular: "Popular Items",
  items: "Items",
  "pokemon-specific": "Pokémon-Specific Items",
  "usually-useless": "Usually Useless Items",
  useless: "Useless Items",
};

export interface Item {
  id: string;
  pokeApiSlug: string;
  name: string;
  showdownName: string;
  description: string;
  kind: ItemKind;
  category: ItemCategory;
}

export interface Nature {
  id: string;
  pokeApiSlug: string;
  name: string;
  showdownName: string;
  plusStat: StatId | null;
  minusStat: StatId | null;
}
