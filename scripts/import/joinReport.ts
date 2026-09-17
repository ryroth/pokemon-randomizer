import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface UnmatchedJoin {
  pokeApi: string[];
  showdown: string[];
}

export interface MythicalMismatch {
  pokeApiSlug: string;
  showdownName: string;
  pokeApiIsMythical: boolean;
  showdownIsMythical: boolean;
}

export interface CatalogJoinReport {
  generatedAt: string;
  catalogCounts: {
    pokemon: number;
    species: number;
    abilities: number;
    moves: number;
    items: number;
    natures: number;
  };
  unmatched: {
    pokemon: UnmatchedJoin;
    abilities: UnmatchedJoin;
    moves: UnmatchedJoin;
    items: UnmatchedJoin;
    natures: UnmatchedJoin;
  };
  mythicalMismatches: MythicalMismatch[];
}

export const GENERATED_JOIN_REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "generated",
  "join-report.json",
);

export async function writeJoinReport(report: CatalogJoinReport): Promise<void> {
  await mkdir(path.dirname(GENERATED_JOIN_REPORT_PATH), { recursive: true });
  await writeFile(GENERATED_JOIN_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export function sortUnmatched(join: UnmatchedJoin): UnmatchedJoin {
  return {
    pokeApi: [...join.pokeApi].sort(),
    showdown: [...join.showdown].sort(),
  };
}
