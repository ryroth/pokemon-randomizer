"use server";

import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { previewDraftSlot, type DraftSlotPreview } from "@/lib/teams/draftPreview";
import type { PokemonSetDraft } from "@/lib/types/session";

const MAX_PREVIEWS = 24;

/** Names, types, and base stats for unbuilt draft slots. The dock does not hold the whole catalog. */
export async function loadDraftPreviews(drafts: PokemonSetDraft[]): Promise<Array<DraftSlotPreview | null>> {
  if (!Array.isArray(drafts)) {
    return [];
  }
  const catalog = loadGeneratedCatalog();
  return drafts.slice(0, MAX_PREVIEWS).map((draft) =>
    previewDraftSlot({ draft, locks: { ability: false, item: false, moveSlots: [] } }, catalog),
  );
}
