"use client";

import Image from "next/image";
import { isPixelSprite, pokemonImage } from "@/lib/art/pokemonImage";
import { cn } from "@/lib/utils";
import type { PokemonForm } from "@/lib/types/pokemon";

/**
 * One still picture of the Pokémon in the colors the Shiny choice selects: the newest official
 * artwork, regular or shiny. Nothing is animated, so a shiny Pokémon always looks the way its
 * shiny artwork does.
 */
export function PokemonPortrait({ pokemon, shiny }: { pokemon: PokemonForm; shiny: boolean | undefined }) {
  const imageSrc = pokemonImage(pokemon, shiny === true);
  const label = shiny === true ? `Shiny artwork of ${pokemon.displayName}` : `Artwork of ${pokemon.displayName}`;

  return (
    <section
      aria-label={label}
      className="relative flex size-44 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,var(--muted)_0%,transparent_72%)]"
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="176px"
          className={cn("object-contain", isPixelSprite(imageSrc) && "[image-rendering:pixelated]")}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-xl text-muted-foreground">
          {pokemon.displayName.slice(0, 1)}
        </div>
      )}
    </section>
  );
}
