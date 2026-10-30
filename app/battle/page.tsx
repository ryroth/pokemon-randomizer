import type { Metadata } from "next";
import { BattleLab } from "@/components/formats/battle-lab";
import { loadGeneratedCatalog, slimPokemonForClient } from "@/lib/data/loadCatalog";

export const metadata: Metadata = {
  title: "Battle Lab",
};

export default async function BattlePage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string; customize?: string }>;
}) {
  const params = await searchParams;
  const catalog = loadGeneratedCatalog();
  const pokemon = slimPokemonForClient(catalog.pokemon).map((form) => ({
    id: form.id,
    displayName: form.displayName,
    speciesId: form.speciesId,
    types: form.types,
    baseStats: form.baseStats,
  }));
  const moves = catalog.moves.flatMap((move) =>
    move.power && move.category !== "status"
      ? [
          {
            id: move.id,
            name: move.name,
            type: move.type,
            category: move.category,
            power: move.power,
            pp: move.pp ?? 1,
          },
        ]
      : [],
  );
  const statusMoves = catalog.moves.flatMap((move) =>
    move.category === "status" ? [{ id: move.id, name: move.name }] : [],
  );

  return (
    <BattleLab
      initialFormatId={typeof params.format === "string" ? params.format : ""}
      customize={params.customize === "1"}
      species={pokemon}
      moves={moves}
      statusMoves={statusMoves}
      abilities={catalog.abilities.map((ability) => ({ id: ability.id, name: ability.name }))}
      items={catalog.items.map((item) => ({ id: item.id, name: item.name }))}
      natures={catalog.natures}
    />
  );
}
