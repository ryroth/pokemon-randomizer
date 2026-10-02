import type { Nature } from "@/lib/types/catalog-entities";
import { STAT_LABELS } from "@/lib/types/stats";

export function natureChoiceLabel(nature: Nature): string {
  if (!nature.plusStat || !nature.minusStat || nature.plusStat === nature.minusStat) {
    return nature.name;
  }
  return `${nature.name} (+${STAT_LABELS[nature.plusStat]}, −${STAT_LABELS[nature.minusStat]})`;
}
