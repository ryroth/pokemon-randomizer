import { describe, expect, it } from "vitest";
import {
  atlasAttempts,
  parseAtlas,
  playbackFrames,
  pokerogueSpriteEntry,
  spriteBounds,
} from "@/lib/art/pokerogueSprite";

describe("pokerogue sprite index", () => {
  it("uses PokéRogue's species and form keys", () => {
    expect(pokerogueSpriteEntry("bulbasaur")?.key).toBe("1");
    expect(pokerogueSpriteEntry("charizardmegax")?.key).toBe("6-mega-x");
    expect(pokerogueSpriteEntry("raichualola")?.key).toBe("2026");
    expect(pokerogueSpriteEntry("swampert")?.key).toBe("260");
    expect(pokerogueSpriteEntry("ogerponhearthflame")?.key).toBe("1017-hearthflame-mask");
    expect(pokerogueSpriteEntry("pikachu")?.femaleKey).toBe("female/25");
  });

  it("tries the shiny sheet, then the regular sheet", () => {
    const entry = pokerogueSpriteEntry("bulbasaur");
    expect(entry).not.toBeNull();
    expect(atlasAttempts(entry!, true, false).map((attempt) => attempt.path)).toEqual(["shiny/1", "1"]);
  });

  it("tries a female shiny sheet before the other sheets", () => {
    const entry = pokerogueSpriteEntry("pikachu");
    expect(entry).not.toBeNull();
    expect(atlasAttempts(entry!, true, true)[0]).toEqual({ path: "shiny/female/25", palette: false });
  });
});

describe("playbackFrames", () => {
  it("plays numbered frames from 1 through 400 in order and skips the rest", () => {
    const atlas = parseAtlas({
      textures: [
        {
          image: "1.png",
          frames: [
            frame("0096.png", 10, 0),
            frame("0002.png", 20, 0),
            frame("0401.png", 30, 0),
            frame("0001.png", 0, 0),
            frame("shadow.png", 40, 0),
          ],
        },
      ],
    });

    expect(playbackFrames(atlas).map((item) => item.name)).toEqual(["0001.png", "0002.png", "0096.png"]);
  });

  it("uses the shared frame size so the sprite stays put", () => {
    const frames = playbackFrames(
      parseAtlas({
        frames: [frame("0001.png", 0, 0, 36, 38, 40, 40)],
        meta: { image: "1.png" },
      }),
    );
    expect(spriteBounds(frames)).toEqual({ w: 40, h: 40 });
  });
});

function frame(
  name: string,
  x: number,
  y: number,
  w = 10,
  h = 10,
  sourceW = 10,
  sourceH = 10,
) {
  return {
    filename: name,
    rotated: false,
    trimmed: true,
    frame: { x, y, w, h },
    spriteSourceSize: { x: 0, y: 0, w, h },
    sourceSize: { w: sourceW, h: sourceH },
  };
}
