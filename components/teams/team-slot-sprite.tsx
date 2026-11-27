"use client";

import { AnimatedPokemon } from "@/components/art/animated-pokemon";
import { pokemonImage } from "@/lib/art/pokemonImage";
import type { PokemonSprites } from "@/lib/types/pokemon";

export function TeamSlotSprite({
  pokemonId,
  sprites,
  shiny,
  female = false,
  name,
}: {
  pokemonId: string;
  sprites: PokemonSprites;
  shiny: boolean;
  female?: boolean;
  name: string;
}) {
  return (
    <AnimatedPokemon
      pokemonId={pokemonId}
      name={name}
      shiny={shiny}
      female={female}
      fallbackSrc={pokemonImage({ sprites }, shiny)}
      label={shiny ? `Shiny sprite of ${name}` : undefined}
      className="size-12 shrink-0"
    />
  );
}
