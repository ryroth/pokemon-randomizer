import { Dex } from "@pkmn/dex";
import type { Ability, Item, Move, Nature, Species } from "@pkmn/dex";
import { toShowdownId } from "./mapping";

export { toShowdownId };

const EXCLUDED_NONSTANDARD = new Set(["CAP", "Custom", "Future", "LGPE"]);

export interface ShowdownCatalogSources {
  species: Species[];
  abilities: Ability[];
  moves: Move[];
  items: Item[];
  natures: Nature[];
}

export function isExcludedNonstandard(value: string | null): boolean {
  return value !== null && EXCLUDED_NONSTANDARD.has(value);
}

export function isCatalogSpecies(species: Species): boolean {
  if (!species.exists || species.num <= 0 || species.isCosmeticForme) {
    return false;
  }
  if (isExcludedNonstandard(species.isNonstandard)) {
    return false;
  }
  return !species.forme.toLowerCase().includes("totem");
}

export function isCatalogAbility(ability: Ability): boolean {
  if (!ability.exists || ability.id === "noability" || ability.num <= 0) {
    return false;
  }
  return !isExcludedNonstandard(ability.isNonstandard);
}

export function isCatalogMove(move: Move): boolean {
  if (!move.exists || move.num <= 0 || move.isZ || move.isMax) {
    return false;
  }
  return !isExcludedNonstandard(move.isNonstandard);
}

export function isCatalogItem(item: Item): boolean {
  if (!item.exists || item.num <= 0 || item.isPokeball) {
    return false;
  }
  return !isExcludedNonstandard(item.isNonstandard);
}

export function collectShowdownSources(dex = Dex): ShowdownCatalogSources {
  return {
    species: dex.species.all().filter(isCatalogSpecies),
    abilities: dex.abilities.all().filter(isCatalogAbility),
    moves: dex.moves.all().filter(isCatalogMove),
    items: dex.items.all().filter(isCatalogItem),
    natures: dex.natures.all().filter((nature) => nature.exists),
  };
}

export function itemCategory(item: Item): "held" | "berry" | "mega-stone" | "z-crystal" | "other" {
  if (item.isBerry) {
    return "berry";
  }
  if (item.zMove) {
    return "z-crystal";
  }
  if (item.megaStone) {
    return "mega-stone";
  }
  return "held";
}

export function showdownAbilityIds(species: Species): string[] {
  const names = [species.abilities[0], species.abilities[1], species.abilities.H, species.abilities.S];
  const ids: string[] = [];
  for (const name of names) {
    if (!name) {
      continue;
    }
    const id = toShowdownId(name);
    if (!ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}
