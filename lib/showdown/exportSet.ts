import type { PokemonSet } from "@/lib/types/session";
import { SHOWDOWN_STAT_LABELS, STAT_IDS, type StatSpread } from "@/lib/types/stats";
import { TYPE_LABELS } from "@/lib/types/pokemon-type";

export interface ExportNames {
  pokemon: string;
  ability: string;
  item: string | null;
  nature: string;
  moves: [string, string, string, string];
}

function formatStatLine(prefix: string, spread: StatSpread, includeStat: (value: number) => boolean) {
  const parts = STAT_IDS.filter((stat) => includeStat(spread[stat])).map(
    (stat) => `${spread[stat]} ${SHOWDOWN_STAT_LABELS[stat]}`,
  );
  return parts.length > 0 ? `${prefix}: ${parts.join(" / ")}` : null;
}

export function exportShowdownSet(set: PokemonSet, names: ExportNames): string {
  const lines: string[] = [];

  let header = names.pokemon;
  if (set.gender === "M" || set.gender === "F") {
    header += ` (${set.gender})`;
  }
  if (names.item) {
    header += ` @ ${names.item}`;
  }
  lines.push(header);

  lines.push(`Ability: ${names.ability}`);

  if (set.level !== 100) {
    lines.push(`Level: ${set.level}`);
  }

  if (set.shiny) {
    lines.push("Shiny: Yes");
  }

  lines.push(`Tera Type: ${TYPE_LABELS[set.teraType]}`);

  const evs = formatStatLine("EVs", set.evs, (value) => value > 0);
  if (evs) {
    lines.push(evs);
  }

  lines.push(`${names.nature} Nature`);

  const ivs = formatStatLine("IVs", set.ivs, (value) => value !== 31);
  if (ivs) {
    lines.push(ivs);
  }

  for (const move of names.moves) {
    lines.push(`- ${move}`);
  }

  return `${lines.join("\n")}\n`;
}
