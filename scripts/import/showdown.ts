/**
 * Showdown / @pkmn join points used during catalog generation.
 * Phase 2 will load Dex data here and attach showdownName plus tags.
 */
export interface ShowdownSpeciesJoin {
  showdownId: string;
  showdownName: string;
  tags: string[];
}

export function toShowdownId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
