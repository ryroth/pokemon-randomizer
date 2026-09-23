import type { Species } from "@pkmn/dex";
import { collectEvolutionTargetIds } from "../../lib/data/evolution";
import type { PokemonForm } from "../../lib/types/pokemon";
import { toShowdownId } from "./mapping";

export function evolutionEdgesFromShowdown(
  species: readonly Species[],
): Map<string, readonly string[]> {
  const edges = new Map<string, readonly string[]>();
  for (const entry of species) {
    edges.set(
      entry.id,
      (entry.evos ?? []).map((name) => toShowdownId(name)).filter((id) => id.length > 0),
    );
  }
  return edges;
}

export function applyEvolutionTargetsToPokemon(
  pokemon: readonly PokemonForm[],
  species: readonly Species[],
): PokemonForm[] {
  const evosById = evolutionEdgesFromShowdown(species);
  const formById = new Map(pokemon.map((form) => [form.id, form]));

  return pokemon.map((form) => ({
    ...form,
    evolutionTargetIds: collectEvolutionTargetIds(form.id, evosById, formById),
  }));
}
