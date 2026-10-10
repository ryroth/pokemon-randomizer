import { describe, expect, it } from "vitest";
import { cardImage, fallbackImage } from "@/lib/recap/entries";

const sprites = {
  sprite: "sprite.png",
  spriteShiny: "sprite-shiny.png",
  artwork: "artwork.png",
  artworkShiny: "artwork-shiny.png",
};
const none = { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null };

describe("fallbackImage", () => {
  it("shows the regular artwork for a regular Pokémon", () => {
    expect(fallbackImage({ sprites }, false)).toBe("artwork.png");
  });

  it("shows the shiny sprite first for a shiny Pokémon", () => {
    expect(fallbackImage({ sprites }, true)).toBe("sprite-shiny.png");
  });

  it("uses the shiny artwork when there is no shiny sprite", () => {
    expect(fallbackImage({ sprites: { ...sprites, spriteShiny: null } }, true)).toBe("artwork-shiny.png");
  });

  it("only uses a regular-colored picture when no shiny picture exists", () => {
    expect(fallbackImage({ sprites: { ...sprites, spriteShiny: null, artworkShiny: null } }, true)).toBe(
      "artwork.png",
    );
  });

  it("never offers a shiny picture for a regular Pokémon", () => {
    expect(fallbackImage({ sprites: { ...none, spriteShiny: "s.png", artworkShiny: "a.png" } }, false)).toBeNull();
  });

  it("falls back to the small sprite when there is no artwork at all", () => {
    expect(fallbackImage({ sprites: { ...sprites, artwork: null } }, false)).toBe("sprite.png");
    expect(fallbackImage({ sprites: none }, true)).toBeNull();
  });
});

describe("cardImage", () => {
  it("shows large artwork first, in the matching colors", () => {
    expect(cardImage({ sprites }, false)).toBe("artwork.png");
    expect(cardImage({ sprites }, true)).toBe("artwork-shiny.png");
    expect(cardImage({ sprites: { ...sprites, artworkShiny: null } }, true)).toBe("sprite-shiny.png");
  });
});
