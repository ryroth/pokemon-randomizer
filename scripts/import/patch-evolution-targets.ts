import { collectShowdownSources } from "./showdown";
import { applyEvolutionTargetsToPokemon } from "./evolutionTargets";
import { writeCatalog } from "./writeCatalog";
import { loadGeneratedCatalog } from "../../lib/data/loadCatalog";

async function main() {
  const catalog = loadGeneratedCatalog();
  const sources = collectShowdownSources();
  const pokemon = applyEvolutionTargetsToPokemon(catalog.pokemon, sources.species);
  const withTargets = pokemon.filter((form) => form.evolutionTargetIds.length > 0).length;

  await writeCatalog({
    ...catalog,
    version: "2.1.0",
    generatedAt: new Date().toISOString(),
    pokemon,
  });

  console.log(
    `Wrote evolution targets for ${pokemon.length} Pokémon (${withTargets} can evolve further).`,
  );
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error("Unknown evolution-target patch error");
  }
  process.exitCode = 1;
});
