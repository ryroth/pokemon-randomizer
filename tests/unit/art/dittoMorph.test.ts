import { describe, expect, it } from "vitest";
import { ICON_SIZE, buildFaceIcon, type RgbaImage } from "@/lib/art/faceIcon";
import {
  HOLD_MS,
  IDLE_MS,
  MAX_MORPH_TARGETS,
  MORPH_MS,
  fallbackDittoIcon,
  morphDuration,
  morphFrame,
  morphState,
  prepareMorph,
} from "@/lib/art/dittoMorph";

const SIZE = 128;

function head(color: [number, number, number], radius = 40): RgbaImage {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const index = (y * SIZE + x) * 4;
      if (Math.hypot(x - 64, y - 64) <= radius) {
        data.set([...color, 255], index);
      }
      const dark = Math.min(Math.hypot(x - 50, y - 56), Math.hypot(x - 78, y - 56)) <= 4;
      if (dark && Math.hypot(x - 64, y - 64) <= radius) {
        data.set([20, 15, 25, 255], index);
      }
    }
  }
  return { data, width: SIZE, height: SIZE };
}

function centre(pixels: Uint8ClampedArray, y = 32) {
  const index = (y * ICON_SIZE + 32) * 4;
  return { r: pixels[index], g: pixels[index + 1], b: pixels[index + 2], a: pixels[index + 3] };
}

const ditto = buildFaceIcon(head([190, 170, 235]), "whole");
const yellow = buildFaceIcon(head([240, 200, 60], 30), "head");
const green = buildFaceIcon(head([60, 180, 90], 36), "head");

describe("show timeline", () => {
  it("rests as Ditto, then moves to each Pokémon in order, then returns to Ditto", () => {
    expect(morphState(0, 2)).toMatchObject({ from: -1, to: -1, done: false });

    const first = morphState(IDLE_MS + MORPH_MS / 2, 2);
    expect(first).toMatchObject({ from: -1, to: 0, done: false });
    expect(first.t).toBeGreaterThan(0);
    expect(first.t).toBeLessThan(1);

    expect(morphState(IDLE_MS + MORPH_MS + HOLD_MS / 2, 2)).toMatchObject({ from: 0, to: 0, t: 0 });

    const second = morphState(IDLE_MS + MORPH_MS + HOLD_MS + MORPH_MS / 2, 2);
    expect(second).toMatchObject({ from: 0, to: 1 });

    const back = morphState(morphDuration(2) - MORPH_MS / 2, 2);
    expect(back).toMatchObject({ from: 1, to: -1, done: false });

    expect(morphState(morphDuration(2), 2)).toMatchObject({ from: -1, to: -1, done: true });
  });

  it("is finished at once when there is nothing to turn into", () => {
    expect(morphState(0, 0).done).toBe(true);
  });

  it("limits how many Pokémon are shown", () => {
    const targets = Array.from({ length: MAX_MORPH_TARGETS + 3 }, () => yellow);
    expect(prepareMorph(ditto, targets).icons).toHaveLength(MAX_MORPH_TARGETS + 1);
  });
});

describe("frames", () => {
  const plan = prepareMorph(ditto, [yellow, green]);

  it("starts as Ditto", () => {
    const { pixels, done } = morphFrame(plan, 0);
    expect(done).toBe(false);
    expect(pixels).toHaveLength(ICON_SIZE * ICON_SIZE * 4);
    expect(centre(pixels).r).toBeLessThan(255);
    expect(centre(pixels).b).toBeGreaterThan(200);
  });

  it("shows the Pokémon's own colors while it rests on that Pokémon", () => {
    const { pixels } = morphFrame(plan, IDLE_MS + MORPH_MS + HOLD_MS / 2);
    const colour = centre(pixels);
    expect(colour.r).toBeGreaterThan(200);
    expect(colour.b).toBeLessThan(120);
  });

  it("blends the colors in between", () => {
    const middle = centre(morphFrame(plan, IDLE_MS + MORPH_MS / 2).pixels, 46);
    expect(middle.a).toBeGreaterThan(200);
    expect(middle.r).toBeGreaterThan(190);
    expect(middle.r).toBeLessThan(240);
    expect(middle.b).toBeGreaterThan(60);
    expect(middle.b).toBeLessThan(235);
  });

  it("does not draw Ditto's face over the Pokémon", () => {
    const { pixels } = morphFrame(plan, IDLE_MS + MORPH_MS + HOLD_MS / 2);
    expect(Array.from(pixels)).toEqual(Array.from(yellow.rgba));
  });

  it("finishes back on Ditto", () => {
    const end = morphFrame(plan, morphDuration(2));
    expect(end.done).toBe(true);
    expect(Array.from(end.pixels)).toEqual(Array.from(morphFrame(plan, 0).pixels));
  });
});

describe("fallback Ditto", () => {
  it("is a lavender blob with a face, for when Ditto's own picture cannot load", () => {
    const icon = fallbackDittoIcon();
    const pixels = new Uint8ClampedArray(icon.rgba);
    expect(pixels[(32 * ICON_SIZE + 32) * 4 + 3]).toBe(255);
    expect(pixels[(32 * ICON_SIZE + 32) * 4 + 2]).toBeGreaterThan(pixels[(32 * ICON_SIZE + 32) * 4 + 1]);
    expect(icon.body[0]).toBe(0);
  });
});
