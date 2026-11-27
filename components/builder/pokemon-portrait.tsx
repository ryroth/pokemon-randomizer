"use client";

import { AnimatedPokemon } from "@/components/art/animated-pokemon";
import { pokemonImage } from "@/lib/art/pokemonImage";
import type { PokemonForm } from "@/lib/types/pokemon";

/** The Pokémon's PokéRogue sprite in the colors and gender the builder has selected. */
export function PokemonPortrait({
  pokemon,
  shiny,
  female = false,
}: {
  pokemon: PokemonForm;
  shiny: boolean | undefined;
  female?: boolean;
}) {
  const shinyOn = shiny === true;
  const label = shinyOn ? `Shiny sprite of ${pokemon.displayName}` : `Sprite of ${pokemon.displayName}`;

  return (
    <section
      aria-label={label}
      className="relative flex size-44 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,var(--muted)_0%,transparent_72%)]"
    >
      <AnimatedPokemon
        pokemonId={pokemon.id}
        name={pokemon.displayName}
        shiny={shinyOn}
        female={female}
        fallbackSrc={pokemonImage(pokemon, shinyOn)}
        className="size-36"
      />
    </section>
  );
}
