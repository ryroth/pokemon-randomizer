import { describe, expect, it } from "vitest";
import { latestSpriteCandidates } from "@/lib/teams/sprites";

const sprites = {
  sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/245.png",
  spriteShiny: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/245.png",
  artwork: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/245.png",
};

describe("latest team sprites", () => {
  it("prefers the HOME sprite, then official art", () => {
    expect(latestSpriteCandidates(sprites, false)).toEqual([
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/245.png",
      sprites.artwork,
      sprites.sprite,
    ]);
  });

  it("prefers the shiny HOME sprite when the set is shiny", () => {
    expect(latestSpriteCandidates(sprites, true)[0]).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/245.png",
    );
    expect(latestSpriteCandidates(sprites, true)).toContain(sprites.spriteShiny);
  });

  it("skips a HOME sprite when the catalog URL has no Pokémon id", () => {
    expect(latestSpriteCandidates({ sprite: "https://example.test/sprite.png", spriteShiny: null, artwork: sprites.artwork }, false)).toEqual([
      sprites.artwork,
      "https://example.test/sprite.png",
    ]);
  });
});
