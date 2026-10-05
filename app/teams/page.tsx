import type { Metadata } from "next";
import { TeamScreen } from "@/components/teams/team-screen";
import { loadGeneratedCatalog, slimPokemonForClient } from "@/lib/data/loadCatalog";

export const metadata: Metadata = {
  title: "Teams",
};

export default function TeamsPage() {
  const catalog = loadGeneratedCatalog();

  return (
    <TeamScreen
      catalog={{
        pokemon: slimPokemonForClient(catalog.pokemon),
        abilities: catalog.abilities,
        moves: catalog.moves,
        items: catalog.items,
        natures: catalog.natures,
      }}
    />
  );
}
