import { requiredFormItemId } from "@/lib/data/formItems";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { DraftedPokemon } from "@/lib/types/session";
import { SHOWDOWN_STAT_LABELS, STAT_IDS, type StatSpread } from "@/lib/types/stats";

/** The slice of the catalog a draft preview needs. The page already has this, or the server loads it. */
export interface DraftPreviewCatalog {
  pokemon: readonly {
    id: string;
    displayName: string;
    types: readonly PokemonType[];
    baseStats: StatSpread;
  }[];
  abilities: readonly { id: string; showdownName: string }[];
  moves: readonly { id: string; showdownName: string }[];
  items: readonly { id: string; showdownName: string }[];
}

/** What is already chosen for one unbuilt Pokémon, plus the species base stats. */
export interface DraftSlotPreview {
  pokemonId: string;
  displayName: string;
  types: readonly PokemonType[];
  baseStats: StatSpread;
  statLine: string;
  shiny: boolean;
  abilityName: string | null;
  /** Undefined when no item has been chosen. Null is explicit None. */
  itemName: string | null | undefined;
  moves: readonly string[];
}

export function previewDraftSlot(
  pokemon: DraftedPokemon,
  catalog: DraftPreviewCatalog,
): DraftSlotPreview | null {
  const pokemonId = pokemon.draft.pokemonId;
  if (!pokemonId) {
    return null;
  }
  const form = catalog.pokemon.find((candidate) => candidate.id === pokemonId);
  if (!form) {
    return null;
  }
  const requiredItemId = requiredFormItemId(form.id);
  const itemId = requiredItemId ?? pokemon.draft.itemId;
  const moves = pokemon.draft.moveIds.flatMap((moveId) => {
    if (!moveId) {
      return [];
    }
    return [catalog.moves.find((move) => move.id === moveId)?.showdownName ?? moveId];
  });
  return {
    pokemonId: form.id,
    displayName: form.displayName,
    types: form.types,
    baseStats: form.baseStats,
    statLine: STAT_IDS.map((stat) => `${SHOWDOWN_STAT_LABELS[stat]} ${form.baseStats[stat]}`).join(" · "),
    shiny: Boolean(pokemon.draft.shiny),
    abilityName: pokemon.draft.abilityId
      ? (catalog.abilities.find((ability) => ability.id === pokemon.draft.abilityId)?.showdownName ?? null)
      : null,
    itemName:
      itemId === undefined
        ? undefined
        : itemId === null
          ? null
          : (catalog.items.find((item) => item.id === itemId)?.showdownName ?? null),
    moves,
  };
}
