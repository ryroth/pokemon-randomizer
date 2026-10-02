import analyses from "@/data/smogon/gen9-analyses.json";
import type { Nature } from "@/lib/types/catalog-entities";
import { SHOWDOWN_STAT_LABELS, STAT_IDS, type StatSpread } from "@/lib/types/stats";

export interface EvSuggestion {
  pokemonName: string;
  format: string;
  name: string;
  nature?: string;
  evs: Partial<StatSpread>;
  matchedMoves: number;
}

interface AnalysisSet {
  format: string;
  name: string;
  moves: string[];
  evs: Partial<StatSpread>;
  nature?: string;
}

const FORMAT_RANK = ["ou", "uu", "ru", "nu", "pu", "zu", "monotype", "doublesou", "vgc2025", "nationaldex"];

/**
 * Best Smogon analysis spread for this Pokémon and moveset.
 * Move overlap wins. A current-tier format breaks ties.
 */
export function suggestEvSpread(
  pokemonName: string,
  moveNames: readonly string[],
): EvSuggestion | undefined {
  const sets = (analyses as Record<string, AnalysisSet[]>)[pokemonName];
  if (!sets?.length || moveNames.length === 0) {
    return undefined;
  }

  const chosen = new Set(moveNames.map((name) => name.toLowerCase()));
  let best: EvSuggestion | undefined;

  for (const set of sets) {
    const matchedMoves = set.moves.filter((move) => chosen.has(move.toLowerCase())).length;
    if (matchedMoves === 0) {
      continue;
    }
    const candidate: EvSuggestion = {
      pokemonName,
      format: set.format,
      name: set.name,
      nature: set.nature,
      evs: set.evs,
      matchedMoves,
    };
    if (!best || candidate.matchedMoves > best.matchedMoves || (candidate.matchedMoves === best.matchedMoves && formatRank(candidate.format) < formatRank(best.format))) {
      best = candidate;
    }
  }

  return best;
}

export function formatGuessedSpread(suggestion: EvSuggestion, nature: Nature | undefined): string {
  const invested = STAT_IDS.filter((stat) => (suggestion.evs[stat] ?? 0) > 0).map(
    (stat) => `${suggestion.evs[stat]} ${SHOWDOWN_STAT_LABELS[stat]}`,
  );
  const signs =
    nature?.plusStat && nature.minusStat && nature.plusStat !== nature.minusStat
      ? `(+${SHOWDOWN_STAT_LABELS[nature.plusStat]}, −${SHOWDOWN_STAT_LABELS[nature.minusStat]})`
      : undefined;
  const spread = [...invested, signs].filter(Boolean).join(" / ");
  return spread ? `${suggestion.name}: ${spread}` : suggestion.name;
}

function formatRank(format: string): number {
  const index = FORMAT_RANK.indexOf(format);
  return index === -1 ? FORMAT_RANK.length : index;
}
