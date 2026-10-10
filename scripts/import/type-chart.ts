import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Dex } from "@pkmn/dex";
import { POKEMON_TYPES, type PokemonType } from "../../lib/types/pokemon-type";

/** Defending type, then attacking type, then the damage multiplier. */
export type TypeChartData = Record<PokemonType, Record<PokemonType, number>>;

export const GENERATED_TYPE_CHART_PATH = path.join(process.cwd(), "data", "generated", "type-chart.json");

// Pokémon Showdown stores damage taken as a code: 0 normal, 1 super effective, 2 resisted, 3 immune.
const MULTIPLIER_BY_CODE: Record<number, number> = { 0: 1, 1: 2, 2: 0.5, 3: 0 };

export function buildTypeChart(dex = Dex): TypeChartData {
  const chart = {} as TypeChartData;
  for (const defender of POKEMON_TYPES) {
    const type = dex.types.get(defender);
    if (!type.exists) {
      throw new Error(`Pokémon Showdown has no type named ${defender}.`);
    }
    const row = {} as Record<PokemonType, number>;
    for (const attacker of POKEMON_TYPES) {
      const code = type.damageTaken[dex.types.get(attacker).name];
      const multiplier = code === undefined ? undefined : MULTIPLIER_BY_CODE[code];
      if (multiplier === undefined) {
        throw new Error(`Unexpected damage code ${String(code)} for ${attacker} into ${defender}.`);
      }
      row[attacker] = multiplier;
    }
    chart[defender] = row;
  }
  return chart;
}

async function main() {
  await mkdir(path.dirname(GENERATED_TYPE_CHART_PATH), { recursive: true });
  await writeFile(GENERATED_TYPE_CHART_PATH, `${JSON.stringify(buildTypeChart(), null, 2)}\n`, "utf8");
  console.log(`Wrote ${GENERATED_TYPE_CHART_PATH}`);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/import/type-chart.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
