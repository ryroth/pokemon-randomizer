import { collectShowdownSources } from "./showdown";
import { loadPokeApiSnapshot } from "./pokeapi";
import { buildCatalog } from "./normalize";
import { writeCatalog } from "./writeCatalog";
import { writeJoinReport } from "./joinReport";

async function main() {
  const args = new Set(process.argv.slice(2));

  if (args.has("--help") || args.has("-h")) {
    console.log(`Pokémon catalog importer

Usage:
  npm run import:data              Snapshot PokéAPI + Showdown into catalog.json
  npm run import:data -- --fresh   Ignore the local HTTP cache and refetch
  npm run import:data -- --offline Fail if a resource is not already cached
  npm run import:data -- --help    Show this help

Writes:
  data/generated/catalog.json
  data/generated/join-report.json

The app never calls PokéAPI at runtime. Re-run this script when source data changes.
`);
    return;
  }

  const fresh = args.has("--fresh");
  const offline = args.has("--offline");
  if (fresh && offline) {
    throw new Error("Use either --fresh or --offline, not both.");
  }

  const sources = collectShowdownSources();
  console.log(
    `Showdown sources: ${sources.species.length} Pokémon, ${sources.abilities.length} abilities, ${sources.moves.length} moves, ${sources.items.length} items, ${sources.natures.length} natures`,
  );

  const snapshot = await loadPokeApiSnapshot(sources, {
    fresh,
    offline,
    onProgress: (message) => {
      console.log(message);
    },
  });

  const { catalog, report } = buildCatalog(snapshot, sources);
  await writeCatalog(catalog);
  await writeJoinReport(report);

  console.log(`Wrote data/generated/catalog.json`);
  console.log(
    `  ${catalog.pokemon.length} Pokémon, ${catalog.species.length} species, ${catalog.abilities.length} abilities, ${catalog.moves.length} moves, ${catalog.items.length} items, ${catalog.natures.length} natures`,
  );
  console.log(`Wrote data/generated/join-report.json`);
  printUnmatched("Pokémon", report.unmatched.pokemon.pokeApi.length, report.unmatched.pokemon.showdown.length);
  printUnmatched("abilities", report.unmatched.abilities.pokeApi.length, report.unmatched.abilities.showdown.length);
  printUnmatched("moves", report.unmatched.moves.pokeApi.length, report.unmatched.moves.showdown.length);
  printUnmatched("items", report.unmatched.items.pokeApi.length, report.unmatched.items.showdown.length);
  printUnmatched("natures", report.unmatched.natures.pokeApi.length, report.unmatched.natures.showdown.length);
  if (report.mythicalMismatches.length > 0) {
    console.log(`Mythical tag mismatches: ${report.mythicalMismatches.length}`);
  }
}

function printUnmatched(label: string, pokeApi: number, showdown: number) {
  console.log(`  unmatched ${label}: ${pokeApi} PokéAPI, ${showdown} Showdown`);
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error("Unknown importer error");
  }
  process.exitCode = 1;
});
