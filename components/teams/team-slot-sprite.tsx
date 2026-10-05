"use client";

import Image from "next/image";
import { useState } from "react";
import { latestSpriteCandidates } from "@/lib/teams/sprites";
import type { PokemonSprites } from "@/lib/types/pokemon";

export function TeamSlotSprite({
  sprites,
  shiny,
  name,
}: {
  sprites: PokemonSprites;
  shiny: boolean;
  name: string;
}) {
  const candidates = latestSpriteCandidates(sprites, shiny);
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  if (!src) {
    return <span className="size-12 shrink-0" aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt={shiny ? `Shiny sprite of ${name}` : ""}
      width={48}
      height={48}
      className="size-12 shrink-0 object-contain"
      onError={() => setIndex((current) => current + 1)}
    />
  );
}
