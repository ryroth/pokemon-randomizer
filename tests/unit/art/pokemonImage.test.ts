import { describe, expect, it } from "vitest";
import { pokemonImage, pokemonImageCandidates } from "@/lib/art/pokemonImage";

const sprites = {
  sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/245.png",
  spriteShiny: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/245.png",
  artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/245.png",
  artworkShiny: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/245.png",
};
const home = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/245.png";
const homeShiny = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/245.png";
const none = { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null };

describe("pokemonImageCandidates", () => {
  it("puts official artwork first, then HOME, then the small sprite", () => {
    expect(pokemonImageCandidates(sprites, false)).toEqual([sprites.artwork, home, sprites.sprite]);
  });

  it("puts the shiny artwork first for a shiny Pokémon", () => {
    expect(pokemonImageCandidates(sprites, true)).toEqual([
      sprites.artworkShiny,
      homeShiny,
      sprites.spriteShiny,
      sprites.artwork,
      sprites.sprite,
    ]);
  });

  it("tries every shiny picture before a regular-colored one", () => {
    const candidates = pokemonImageCandidates(sprites, true);
    expect(candidates.indexOf(sprites.spriteShiny)).toBeLessThan(candidates.indexOf(sprites.artwork));
  });

  it("never offers a shiny picture for a regular Pokémon", () => {
    const regular = pokemonImageCandidates(sprites, false);
    expect(regular).not.toContain(sprites.spriteShiny);
    expect(regular).not.toContain(sprites.artworkShiny);
    expect(regular.every((url) => !url.includes("/shiny/"))).toBe(true);
  });

  it("never offers an animated picture", () => {
    for (const shiny of [false, true]) {
      expect(pokemonImageCandidates(sprites, shiny).every((url) => /\.png$/.test(url))).toBe(true);
    }
  });

  it("skips a HOME picture when the sprite URL has no Pokémon id", () => {
    expect(
      pokemonImageCandidates(
        { sprite: "https://example.test/sprite.png", spriteShiny: null, artwork: sprites.artwork, artworkShiny: null },
        false,
      ),
    ).toEqual([sprites.artwork, "https://example.test/sprite.png"]);
  });
});

describe("pokemonImage", () => {
  it("shows the artwork in the matching colors", () => {
    expect(pokemonImage({ sprites }, false)).toBe(sprites.artwork);
    expect(pokemonImage({ sprites }, true)).toBe(sprites.artworkShiny);
  });

  it("falls to the shiny HOME picture when there is no shiny artwork", () => {
    expect(pokemonImage({ sprites: { ...sprites, artworkShiny: null } }, true)).toBe(homeShiny);
  });

  it("is null when the catalog has no picture", () => {
    expect(pokemonImage({ sprites: none }, false)).toBeNull();
    expect(pokemonImage({ sprites: none }, true)).toBeNull();
  });
});
