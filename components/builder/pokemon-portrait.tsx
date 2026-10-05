"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { pokemonIdleModelUrl } from "@/lib/recap/model";
import type { PokemonForm } from "@/lib/types/pokemon";

const PokemonIdleModel = dynamic(
  () => import("@/components/recap/pokemon-idle-model").then((mod) => mod.PokemonIdleModel),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="px-2 text-center text-sm text-muted-foreground">
        Loading the 3D model…
      </p>
    ),
  },
);

/** Official art until shiny is chosen, then the regular 3D idle model. Shiny colors are painted on when the files share materials. */
export function PokemonPortrait({ pokemon, shiny }: { pokemon: PokemonForm; shiny: boolean | undefined }) {
  const choice = shiny === undefined ? "unset" : shiny ? "yes" : "no";
  return <Portrait key={choice} pokemon={pokemon} shiny={shiny} />;
}

function Portrait({ pokemon, shiny }: { pokemon: PokemonForm; shiny: boolean | undefined }) {
  const chosen = shiny === true || shiny === false;
  const form = { id: pokemon.id, nationalDexNumber: pokemon.nationalDexNumber, form: pokemon.form };
  const appearanceUrl = chosen ? pokemonIdleModelUrl(form, shiny) : null;
  const regularUrl = chosen ? pokemonIdleModelUrl(form, false) : null;
  const animatedUrl = regularUrl ?? appearanceUrl;
  const shinySrc = shiny && appearanceUrl && animatedUrl && appearanceUrl !== animatedUrl ? appearanceUrl : null;
  const [unavailable, setUnavailable] = useState(false);
  const imageSrc = shiny
    ? (pokemon.sprites.spriteShiny ?? pokemon.sprites.artwork ?? pokemon.sprites.sprite)
    : (pokemon.sprites.artwork ?? pokemon.sprites.sprite);
  const showModel = Boolean(animatedUrl) && !unavailable;
  const label = !chosen
    ? `Artwork of ${pokemon.displayName}`
    : showModel
      ? `${shiny ? "Shiny 3D idle animation" : "3D idle animation"} of ${pokemon.displayName}`
      : `${shiny ? "Shiny artwork" : "Artwork"} of ${pokemon.displayName}`;

  return (
    <section
      aria-label={label}
      className="relative flex size-44 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,var(--muted)_0%,transparent_72%)]"
    >
      {showModel && animatedUrl ? (
        <PokemonIdleModel
          src={animatedUrl}
          shinySrc={shinySrc}
          name={pokemon.displayName}
          onUnavailable={() => setUnavailable(true)}
          onMotion={() => undefined}
          statusClassName="px-2 text-center text-sm text-muted-foreground"
        />
      ) : imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="176px"
          className="object-contain [image-rendering:pixelated]"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-xl text-muted-foreground">
          {pokemon.displayName.slice(0, 1)}
        </div>
      )}
    </section>
  );
}
