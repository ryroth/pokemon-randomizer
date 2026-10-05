import type { Metadata } from "next";
import { RecapScreen } from "@/components/recap/recap-screen";
import { loadGeneratedCatalog, slimPokemonForClient } from "@/lib/data/loadCatalog";

export const metadata: Metadata = {
  title: "Recap",
};

export default function RecapPage() {
  const catalog = loadGeneratedCatalog();

  return (
    <RecapScreen
      pokemon={slimPokemonForClient(catalog.pokemon)}
      abilities={catalog.abilities}
      moves={catalog.moves}
      items={catalog.items}
      natures={catalog.natures}
    />
  );
}
