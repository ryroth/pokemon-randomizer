import type { Metadata } from "next";
import { SetBuilder } from "@/components/builder/set-builder";
import { loadGeneratedCatalog, slimPokemonForClient } from "@/lib/data/loadCatalog";

export const metadata: Metadata = {
  title: "Builder",
};

export default function BuilderPage() {
  const catalog = loadGeneratedCatalog();

  return (
    <SetBuilder
      pokemon={slimPokemonForClient(catalog.pokemon)}
      abilities={catalog.abilities}
      moves={catalog.moves}
      items={catalog.items}
      natures={catalog.natures}
    />
  );
}
