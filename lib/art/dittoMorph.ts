/**
 * Frames for the tab icon that starts as Ditto and turns into the selected Pokémon's official artwork, then
 * back to Ditto. This file times the show and blends the pictures.
 */

import {
  ICON_SIZE,
  buildFaceIcon,
  drawFace,
  type FaceIcon,
  type Mask,
  type Rgb,
} from "@/lib/art/faceIcon";

export { alphaBounds } from "@/lib/art/faceIcon";

export const MORPH_SIZE = ICON_SIZE;

export const IDLE_MS = 500;
export const MORPH_MS = 650;
export const HOLD_MS = 950;

/** At most this many Pokémon are shown for one roll, so the whole show stays short. */
export const MAX_MORPH_TARGETS = 6;

const DITTO_COLOR: Rgb = [199, 174, 230];
const PLANES = MORPH_SIZE * MORPH_SIZE;

export interface MorphState {
  /** -1 is Ditto. 0 and up count the Pokémon in order. */
  from: number;
  to: number;
  /** 0 to 1 and eased. 0 means `from`, 1 means `to`. */
  t: number;
  done: boolean;
}

/** Total length of a show for this many Pokémon. */
export function morphDuration(count: number): number {
  const stops = Math.max(0, count);
  return IDLE_MS + stops * (MORPH_MS + HOLD_MS) + MORPH_MS;
}

/** Which two pictures are showing, and how far apart, after `elapsedMs`. Ditto, each Pokémon, then Ditto. */
export function morphState(elapsedMs: number, count: number): MorphState {
  const stops = Math.max(0, count);
  if (stops === 0 || elapsedMs >= morphDuration(stops)) {
    return { from: -1, to: -1, t: 0, done: true };
  }
  if (elapsedMs < IDLE_MS) {
    return { from: -1, to: -1, t: 0, done: false };
  }

  let cursor = elapsedMs - IDLE_MS;
  for (let stop = 0; stop < stops; stop += 1) {
    const from = stop - 1;
    if (cursor < MORPH_MS) {
      return { from, to: stop, t: smoothstep(0, 1, cursor / MORPH_MS), done: false };
    }
    cursor -= MORPH_MS;
    if (cursor < HOLD_MS) {
      return { from: stop, to: stop, t: 0, done: false };
    }
    cursor -= HOLD_MS;
  }
  return { from: stops - 1, to: -1, t: smoothstep(0, 1, cursor / MORPH_MS), done: false };
}

/** A plain Ditto blob, used only when Ditto's own picture cannot be loaded. */
export function fallbackDittoIcon(): FaceIcon {
  const size = 128;
  const rgba = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5 - 64) / 50;
      const dy = (y + 0.5 - 76) / 30;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const radius = 1 + 0.07 * Math.sin(3 * angle + 0.6) + 0.05 * Math.sin(5 * angle - 0.9);
      const lumpX = (x + 0.5 - 50) / 19;
      const lumpY = (y + 0.5 - 52) / 17;
      const inside = distance <= radius || Math.hypot(lumpX, lumpY) <= 1;
      const index = (y * size + x) * 4;
      rgba[index] = DITTO_COLOR[0];
      rgba[index + 1] = DITTO_COLOR[1];
      rgba[index + 2] = DITTO_COLOR[2];
      rgba[index + 3] = inside ? 255 : 0;
    }
  }
  const icon = buildFaceIcon({ data: rgba, width: size, height: size }, "whole");
  const pixels = new Uint8ClampedArray(icon.rgba);
  drawFace(pixels, icon.face, icon.faceColor);
  return { ...icon, rgba: pixels };
}

export interface MorphPlan {
  /** Index 0 is Ditto. The Pokémon follow in order. */
  icons: FaceIcon[];
}

/** Prepares a show: Ditto first, then up to `MAX_MORPH_TARGETS` Pokémon. */
export function prepareMorph(ditto: FaceIcon, targets: readonly FaceIcon[]): MorphPlan {
  return { icons: [ditto, ...targets.slice(0, MAX_MORPH_TARGETS)] };
}

/** The picture to show `elapsedMs` into the show. RGBA, `MORPH_SIZE` square. */
export function morphFrame(
  plan: MorphPlan,
  elapsedMs: number,
): { pixels: Uint8ClampedArray<ArrayBuffer>; done: boolean } {
  const state = morphState(elapsedMs, plan.icons.length - 1);
  const from = plan.icons[state.from + 1];
  const to = plan.icons[state.to + 1];

  if (from === to) {
    return { pixels: new Uint8ClampedArray(from.rgba), done: state.done };
  }

  return { pixels: blendIcons(from, to, state.t), done: state.done };
}

/**
 * Two pictures partway between each other. They cross-fade, and in the middle of the change the outlines
 * soften and run together into one blob, so Ditto seems to melt from one shape into the next.
 */
function blendIcons(a: FaceIcon, b: FaceIcon, t: number): Uint8ClampedArray<ArrayBuffer> {
  const amount = Math.min(1, Math.max(0, t));
  const mixed = [new Float32Array(PLANES), new Float32Array(PLANES), new Float32Array(PLANES), new Float32Array(PLANES)];
  for (let pixel = 0; pixel < PLANES; pixel += 1) {
    const alphaA = a.rgba[pixel * 4 + 3] / 255;
    const alphaB = b.rgba[pixel * 4 + 3] / 255;
    for (let channel = 0; channel < 3; channel += 1) {
      mixed[channel][pixel] =
        a.rgba[pixel * 4 + channel] * alphaA * (1 - amount) + b.rgba[pixel * 4 + channel] * alphaB * amount;
    }
    mixed[3][pixel] = alphaA * (1 - amount) + alphaB * amount;
  }
  const soft = mixed.map((plane) => blurPlane(blurPlane(plane)));

  const melt = Math.sin(Math.PI * amount) ** 0.6;
  const level = 0.5 - 0.22 * Math.sin(Math.PI * amount);
  const pixels = new Uint8ClampedArray(PLANES * 4);
  for (let pixel = 0; pixel < PLANES; pixel += 1) {
    const sharpAlpha = mixed[3][pixel];
    const meltedAlpha = smoothstep(level - 0.12, level + 0.12, soft[3][pixel]);
    const alpha = sharpAlpha + (meltedAlpha - sharpAlpha) * melt;
    if (alpha <= 0.004) {
      continue;
    }
    for (let channel = 0; channel < 3; channel += 1) {
      const sharp = sharpAlpha > 0.004 ? mixed[channel][pixel] / sharpAlpha : DITTO_COLOR[channel];
      const soften = soft[3][pixel] > 0.004 ? soft[channel][pixel] / soft[3][pixel] : sharp;
      pixels[pixel * 4 + channel] = sharp + (soften - sharp) * melt;
    }
    pixels[pixel * 4 + 3] = Math.round(alpha * 255);
  }
  return pixels;
}

function blurPlane(plane: Mask): Mask {
  const out = new Float32Array(plane.length);
  for (let y = 0; y < MORPH_SIZE; y += 1) {
    for (let x = 0; x < MORPH_SIZE; x += 1) {
      let total = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const sx = x + ox;
          const sy = y + oy;
          if (sx >= 0 && sx < MORPH_SIZE && sy >= 0 && sy < MORPH_SIZE) {
            total += plane[sy * MORPH_SIZE + sx];
          }
        }
      }
      out[y * MORPH_SIZE + x] = total / 9;
    }
  }
  return out;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
