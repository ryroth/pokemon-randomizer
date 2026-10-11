import type { PokemonSprites } from "@/lib/types/pokemon";

const SPRITE_ID = /\/sprites\/pokemon\/(?:shiny\/)?(\d+)\.png$/;

/**
 * Every Pokémon is shown as one still picture, never an animation. Official artwork is the
 * newest and most consistent set, so it comes first. Pokémon HOME (derived from the sprite id)
 * and the small game sprite only stand in when a file fails to load. A shiny Pokémon tries every
 * shiny picture before it ever falls back to a regular-colored one.
 */
export function pokemonImageCandidates(sprites: PokemonSprites, shiny: boolean): string[] {
  const idSource = shiny ? (sprites.spriteShiny ?? sprites.sprite) : sprites.sprite;
  const home = homeSpriteUrl(idSource, shiny);
  const ordered = shiny
    ? [sprites.artworkShiny, home, sprites.spriteShiny, sprites.artwork, sprites.sprite]
    : [sprites.artwork, home, sprites.sprite];
  return ordered.filter((url): url is string => typeof url === "string" && url.length > 0);
}

/** True for the small pixel-art game sprites, the only pictures that need crisp scaling. */
export function isPixelSprite(url: string): boolean {
  return SPRITE_ID.test(url);
}

/** The picture to show first for a Pokémon, or null when the catalog has none. */
export function pokemonImage(pokemon: { sprites: PokemonSprites }, shiny: boolean): string | null {
  return pokemonImageCandidates(pokemon.sprites, shiny)[0] ?? null;
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
