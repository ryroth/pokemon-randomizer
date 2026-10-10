"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { fallbackImage } from "@/lib/recap/entries";
import { idleModelPlan } from "@/lib/recap/model";
import { cn } from "@/lib/utils";
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

/**
 * Official art until shiny is chosen, then the 3D idle model. A shiny Pokémon shows its shiny 3D
 * model when one exists, otherwise the shiny sprite, otherwise the shiny artwork. It never shows
 * regular colors.
 */
export function PokemonPortrait({ pokemon, shiny }: { pokemon: PokemonForm; shiny: boolean | undefined }) {
  const choice = shiny === undefined ? "unset" : shiny ? "yes" : "no";
  return <Portrait key={choice} pokemon={pokemon} shiny={shiny} />;
}

function Portrait({ pokemon, shiny }: { pokemon: PokemonForm; shiny: boolean | undefined }) {
  const chosen = shiny === true || shiny === false;
  const form = { id: pokemon.id, nationalDexNumber: pokemon.nationalDexNumber, form: pokemon.form };
  const plan = chosen ? idleModelPlan(form, shiny === true) : null;
  const animatedUrl = plan?.src ?? null;
  const shinySrc = plan?.shinySrc ?? null;
  const [unavailable, setUnavailable] = useState(false);
  const imageSrc = fallbackImage(pokemon, shiny === true);
  const showModel = Boolean(animatedUrl) && !unavailable;
  const label = !chosen
    ? `Artwork of ${pokemon.displayName}`
    : showModel
      ? `${shiny ? "Shiny 3D idle animation" : "3D idle animation"} of ${pokemon.displayName}`
      : `${shiny ? "Shiny picture" : "Artwork"} of ${pokemon.displayName}`;

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
          className={cn("object-contain", !imageSrc.includes("/official-artwork/") && "[image-rendering:pixelated]")}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-xl text-muted-foreground">
          {pokemon.displayName.slice(0, 1)}
        </div>
      )}
    </section>
  );
}
