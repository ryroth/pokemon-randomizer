import type { PokemonSprites } from "@/lib/types/pokemon";

const SPRITE_ID = /\/sprites\/pokemon\/(?:shiny\/)?(\d+)\.png$/;

/**
 * Pokémon HOME is the latest sprite set. Official art and the default sprite follow
 * when a HOME file is missing. A shiny set tries every shiny picture (HOME, sprite, then
 * artwork) before it ever falls back to a regular-colored one.
 */
export function latestSpriteCandidates(sprites: PokemonSprites, shiny: boolean): string[] {
  const idSource = shiny ? (sprites.spriteShiny ?? sprites.sprite) : sprites.sprite;
  const home = homeSpriteUrl(idSource, shiny);
  const ordered = shiny
    ? [home, sprites.spriteShiny, sprites.artworkShiny, sprites.artwork, sprites.sprite]
    : [home, sprites.artwork, sprites.sprite];
  return ordered.filter((url): url is string => typeof url === "string" && url.length > 0);
}

function homeSpriteUrl(spriteUrl: string | null, shiny: boolean): string | null {
  if (!spriteUrl) {
    return null;
  }
  const id = SPRITE_ID.exec(spriteUrl)?.[1];
  if (!id) {
    return null;
  }
  const folder = shiny ? "other/home/shiny" : "other/home";
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${folder}/${id}.png`;
}
