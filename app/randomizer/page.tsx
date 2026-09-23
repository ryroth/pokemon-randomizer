import type { Metadata } from "next";
import { PokemonRandomizer } from "@/components/randomizer/pokemon-randomizer";
import { loadGeneratedCatalog, slimPokemonForClient } from "@/lib/data/loadCatalog";

export const metadata: Metadata = {
  title: "Randomizer",
};

export default function RandomizerPage() {
  const catalog = loadGeneratedCatalog();

  return (
    <PokemonRandomizer
      pokemon={slimPokemonForClient(catalog.pokemon)}
      abilities={catalog.abilities}
      moves={catalog.moves}
      items={catalog.items}
    />
  );
}
