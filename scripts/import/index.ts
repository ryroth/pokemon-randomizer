import { writeCatalog } from "./writeCatalog";

async function main() {
  const args = new Set(process.argv.slice(2));

  if (args.has("--help") || args.has("-h")) {
    console.log(`Pokémon catalog importer

Usage:
  npm run import:data            Print status (Phase 1)
  npm run import:data -- --help  Show this help

Phase 2 will snapshot PokéAPI + Showdown into data/generated/catalog.json.
No network import runs in Phase 1.
`);
    return;
  }

  if (args.has("--write-empty")) {
    await writeCatalog({
      version: "0.0.0-phase1",
      generatedAt: new Date().toISOString(),
      pokemon: [],
      species: [],
      abilities: [],
      moves: [],
      items: [],
      natures: [],
    });
    console.log("Wrote an empty catalog placeholder to data/generated/catalog.json");
    return;
  }

  console.log(
    "Catalog import is stubbed in Phase 1. Run this again in Phase 2 to snapshot PokéAPI and Showdown data.",
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown importer error";
  console.error(message);
  process.exitCode = 1;
});
