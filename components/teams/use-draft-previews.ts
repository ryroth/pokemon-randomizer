"use client";

import { useEffect, useState } from "react";
import { loadDraftPreviews } from "@/lib/data/draftPreviews";
import type { DraftSlotPreview } from "@/lib/teams/draftPreview";
import type { PokemonSetDraft } from "@/lib/types/session";

const cache = new Map<string, DraftSlotPreview | null>();

function draftKey(draft: PokemonSetDraft): string {
  return JSON.stringify({
    pokemonId: draft.pokemonId ?? "",
    abilityId: draft.abilityId ?? "",
    itemId: draft.itemId === undefined ? "" : draft.itemId,
    moveIds: draft.moveIds,
    shiny: Boolean(draft.shiny),
  });
}

/** Loads unbuilt-slot details for the dock. The same draft is requested once. */
export function useDraftPreviews(drafts: readonly PokemonSetDraft[]): Record<string, DraftSlotPreview | null> {
  const [, setVersion] = useState(0);
  const key = drafts.map(draftKey).join("||");

  useEffect(() => {
    const missing = drafts.filter((draft) => draft.pokemonId && !cache.has(draftKey(draft)));
    if (missing.length === 0) {
      return;
    }
    loadDraftPreviews(missing.map((draft) => ({ ...draft, moveIds: [...draft.moveIds] })))
      .then((found) => {
        missing.forEach((draft, index) => {
          cache.set(draftKey(draft), found[index] ?? null);
        });
        setVersion((version) => version + 1);
      })
      .catch(() => {
        // The slot still shows the species name from the other lookup.
      });
  }, [drafts, key]);

  const found: Record<string, DraftSlotPreview | null> = {};
  for (const draft of drafts) {
    const id = draftKey(draft);
    if (cache.has(id)) {
      found[id] = cache.get(id) ?? null;
    }
  }
  return found;
}

export { draftKey };
