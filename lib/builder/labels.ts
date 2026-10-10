import type { Nature } from "@/lib/types/catalog-entities";
import { SHOWDOWN_STAT_LABELS } from "@/lib/types/stats";

/** Plain-language raised and lowered stats, or null for a neutral Nature. */
export function natureEffect(nature: Nature): { plus: string; minus: string } | null {
  if (!nature.plusStat || !nature.minusStat || nature.plusStat === nature.minusStat) {
    return null;
  }
  return { plus: SHOWDOWN_STAT_LABELS[nature.plusStat], minus: SHOWDOWN_STAT_LABELS[nature.minusStat] };
}

/** Showdown-style label, for example "Jolly (+Spe, −SpA)". */
export function natureChoiceLabel(nature: Nature): string {
  const effect = natureEffect(nature);
  if (!effect) {
    return nature.name;
  }
  return `${nature.name} (+${effect.plus}, −${effect.minus})`;
}
