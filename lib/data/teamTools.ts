"use server";

import type { TeamMemberInput } from "@/lib/analysis/teamAnalysis";
import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { previewShowdownImport, type ImportPreview } from "@/lib/showdown/importTeam";
import { teamShowdownText } from "@/lib/teams/export";
import { TEAM_SIZE } from "@/lib/teams/teams";
import type { PokemonSet } from "@/lib/types/session";

export type TeamDetails =
  | { ok: true; members: TeamMemberInput[]; showdownText: string }
  | { ok: false; message: string };

const UNREADABLE_TEAM = "This team does not match the current catalog.";

/**
 * Everything the team panel needs that lives in the catalog: each member's types and moves for the
 * coverage matrices, and the Showdown paste for the whole team. The catalog stays on the server.
 */
export async function loadTeamDetails(sets: PokemonSet[]): Promise<TeamDetails> {
  if (!Array.isArray(sets) || sets.length > TEAM_SIZE) {
    return { ok: false, message: UNREADABLE_TEAM };
  }
  if (sets.length === 0) {
    return { ok: true, members: [], showdownText: "" };
  }
  try {
    const catalog = loadGeneratedCatalog();
    const members: TeamMemberInput[] = [];
    for (const set of sets) {
      const pokemon = catalog.pokemon.find((form) => form.id === set.pokemonId);
      const moves = (Array.isArray(set.moveIds) ? set.moveIds : []).map((moveId) =>
        catalog.moves.find((move) => move.id === moveId),
      );
      if (!pokemon || moves.some((move) => !move)) {
        return { ok: false, message: UNREADABLE_TEAM };
      }
      const nickname = typeof set.nickname === "string" ? set.nickname.trim() : "";
      members.push({
        label: nickname ? `${nickname} (${pokemon.displayName})` : pokemon.displayName,
        types: pokemon.types,
        moves: moves.flatMap((move) => (move ? [{ name: move.showdownName, type: move.type, category: move.category }] : [])),
      });
    }
    const exported = teamShowdownText(sets, {
      pokemon: catalog.pokemon,
      abilities: catalog.abilities,
      moves: catalog.moves,
      items: catalog.items,
      natures: catalog.natures,
    });
    if (!exported.ok) {
      return { ok: false, message: exported.message };
    }
    return { ok: true, members, showdownText: exported.text };
  } catch {
    return { ok: false, message: UNREADABLE_TEAM };
  }
}

/** Reads pasted Showdown text against the catalog. Nothing is saved until the player confirms. */
export async function readShowdownPaste(text: string): Promise<ImportPreview> {
  try {
    return previewShowdownImport(text, loadGeneratedCatalog());
  } catch {
    return { ok: false, message: "The Pokémon list could not be loaded. Try again in a moment." };
  }
}
