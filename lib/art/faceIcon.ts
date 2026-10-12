/**
 * Turns a Pokémon's official render into a small "face icon": a rounded close-up of the head with a dark
 * outline. The Pokémon keeps its own eyes and mouth. Pass `{ eraseFace: true }` and then `drawFace` only for
 * the still Ditto tab icon, which redraws Ditto's face on Ditto himself.
 *
 * Everything here is plain math on pixel arrays so it can be tested without a browser. The only inputs are
 * the official picture's pixels. Nothing about a Pokémon is invented: the head is found by looking for the
 * small dark shapes (eyes, mouth) in the picture itself.
 */

export const ICON_SIZE = 64;
const ICON_MARGIN = 5;
/** When no eyes are found, the close-up is this share of the Pokémon's longest side. */
const HEAD_GUESS_SIZE = 0.55;
/** A head close-up is never larger than this share of the Pokémon's longest side. */
const HEAD_MAX_SIZE = 0.6;
const INNER = ICON_SIZE - ICON_MARGIN * 2;

/** Opacity from 0 to 1 for every pixel of an `ICON_SIZE` square, row by row. */
export type Mask = Float32Array;

export interface RgbaImage {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

export interface Face {
  x: number;
  y: number;
  /** 1 is the full-size Ditto face. Smaller when the head is too narrow for it. */
  scale: number;
}

export type Rgb = readonly [number, number, number];

export interface FaceIcon {
  /** Colors and opacity, `ICON_SIZE` square, with the outline included. Not premultiplied. */
  rgba: Uint8ClampedArray<ArrayBuffer>;
  /** Opacity of the picture itself, without the outline. */
  body: Mask;
  face: Face;
  faceColor: Rgb;
}

/** Where the Ditto face sits on the picture when nothing better is known. */
export const DITTO_FACE: Face = { x: 32, y: 29, scale: 1 };

const EYE_OFFSET = 7.2;
const EYE_RADIUS = 2.1;
const MOUTH_HALF_WIDTH = 12.5;
const MOUTH_DROP = 6.6;
const MOUTH_HALF_THICKNESS = 0.95;
const FACE_SCALES = [1, 0.8, 0.62, 0.5] as const;

const DARK_FACE: Rgb = [43, 33, 66];
const LIGHT_FACE: Rgb = [250, 246, 240];
const OUTLINE: Rgb = [43, 33, 66];
const OUTLINE_RADIUS = 2.4;

export interface FaceAnalysis {
  /** Square piece of the picture to keep, in picture pixels. */
  crop: { cx: number; cy: number; size: number };
  /** True where the Pokémon's own eyes and mouth are, to be painted out. */
  erase: Uint8Array;
  /** Where the middle of the eyes is, in picture pixels. */
  face: { x: number; y: number };
  /** `pair` means two eyes were found, so the icon is a close-up. `none` keeps the whole Pokémon. */
  found: "pair" | "none";
}

interface Blob {
  cx: number;
  cy: number;
  area: number;
  width: number;
  height: number;
  pixels: number[];
}

/** The box around every pixel that is more than faintly visible, or null for an empty picture. */
export function alphaBounds(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
  threshold = 16,
): { x: number; y: number; width: number; height: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((rgba[(y * width + x) * 4 + 3] ?? 0) > threshold) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) {
    return null;
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function luminance(data: ArrayLike<number>, pixel: number): number {
  return (0.299 * data[pixel * 4] + 0.587 * data[pixel * 4 + 1] + 0.114 * data[pixel * 4 + 2]) / 255;
}

function medianLuminance(image: RgbaImage): number {
  const values: number[] = [];
  for (let pixel = 0; pixel < image.width * image.height; pixel += 1) {
    if (image.data[pixel * 4 + 3] > 200) {
      values.push(luminance(image.data, pixel));
    }
  }
  if (values.length === 0) {
    return 0;
  }
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

/** Small dark shapes inside the picture: eyes, mouths, nostrils. Shapes on the outer edge are left out. */
function findDarkBlobs(image: RgbaImage, opaqueCount: number, sensitive: boolean): Blob[] {
  const { data, width, height } = image;
  const median = medianLuminance(image);
  // Ditto's features are only a little darker than his body, so he gets a gentler cut-off.
  const limit = sensitive ? Math.min(0.62, median - 0.07) : Math.min(0.55, median - 0.14);
  const dark = new Uint8Array(width * height);
  for (let pixel = 0; pixel < dark.length; pixel += 1) {
    dark[pixel] = data[pixel * 4 + 3] > 200 && luminance(data, pixel) < limit ? 1 : 0;
  }

  const seen = new Uint8Array(width * height);
  const blobs: Blob[] = [];
  const maxArea = Math.max(8, opaqueCount * 0.03);
  for (let start = 0; start < dark.length; start += 1) {
    if (!dark[start] || seen[start]) {
      continue;
    }
    const pixels: number[] = [];
    const queue = [start];
    seen[start] = 1;
    let touchesEdge = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;
    while (queue.length > 0) {
      const pixel = queue.pop() as number;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      pixels.push(pixel);
      sumX += x;
      sumY += y;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      let edge = false;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || data[(ny * width + nx) * 4 + 3] < 128) {
            edge = true;
          }
        }
      }
      if (edge) {
        touchesEdge += 1;
      }
      for (const [ox, oy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + ox;
        const ny = y + oy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          const next = ny * width + nx;
          if (dark[next] && !seen[next]) {
            seen[next] = 1;
            queue.push(next);
          }
        }
      }
    }
    const area = pixels.length;
    if (area < 3 || area > maxArea || touchesEdge / area > 0.25) {
      continue;
    }
    blobs.push({
      cx: sumX / area,
      cy: sumY / area,
      area,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      pixels,
    });
  }
  return blobs;
}

function findEyePair(
  blobs: Blob[],
  bodyWidth: number,
  imageHeight: number,
  opaqueCount: number,
  lowestEyeY: number,
): [Blob, Blob] | null {
  // Eyes are small, roundish, and come in a matching pair. Big dark patches are markings, not eyes.
  const eyes = blobs.filter((blob) => {
    const aspect = blob.width / blob.height;
    const fill = blob.area / (blob.width * blob.height);
    return (
      blob.area >= 4 &&
      blob.area <= opaqueCount * 0.025 &&
      aspect > 0.4 &&
      aspect < 2.5 &&
      fill >= 0.5 &&
      blob.cy <= lowestEyeY
    );
  });
  let best: [Blob, Blob] | null = null;
  let bestScore = 0;
  for (let i = 0; i < eyes.length; i += 1) {
    for (let j = i + 1; j < eyes.length; j += 1) {
      const a = eyes[i];
      const b = eyes[j];
      const ratio = Math.min(a.area, b.area) / Math.max(a.area, b.area);
      if (ratio < 0.4) {
        continue;
      }
      const dx = Math.abs(a.cx - b.cx);
      const dy = Math.abs(a.cy - b.cy);
      const distance = Math.hypot(dx, dy);
      const diameter = 2 * Math.sqrt((a.area + b.area) / (2 * Math.PI));
      if (distance < 1.8 * diameter || distance > 0.6 * bodyWidth || dy > 0.45 * distance) {
        continue;
      }
      const middleY = (a.cy + b.cy) / 2;
      const fill = Math.min(a.area / (a.width * a.height), b.area / (b.width * b.height));
      const score = (ratio * fill) ** 2 * (1 - 0.6 * (middleY / imageHeight)) * Math.sqrt(Math.min(a.area, b.area));
      if (score > bestScore) {
        bestScore = score;
        best = [a, b];
      }
    }
  }
  return best;
}

/**
 * Finds the face in a picture: where the eyes are, which shapes are the eyes and mouth, and which square to
 * keep for the icon. `whole` keeps the entire Pokémon (for Ditto, who is all face). `head` keeps a close-up.
 */
export function analyseFace(image: RgbaImage, mode: "whole" | "head"): FaceAnalysis {
  const { width, height, data } = image;
  const bounds = alphaBounds(data, width, height) ?? { x: 0, y: 0, width, height };
  const boundsMax = Math.max(bounds.width, bounds.height);
  let opaqueCount = 0;
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (data[pixel * 4 + 3] > 200) {
      opaqueCount += 1;
    }
  }

  const blobs = findDarkBlobs(image, opaqueCount, mode === "whole");
  // Eyes are in the upper part of a Pokémon, so dark spots lower down (feet, tail, belly) are ignored.
  const pair = findEyePair(blobs, bounds.width, height, opaqueCount, bounds.y + bounds.height * 0.6);
  const erase = new Uint8Array(width * height);

  const wholeCrop = {
    cx: bounds.x + bounds.width / 2,
    cy: bounds.y + bounds.height / 2,
    size: boundsMax * 1.02,
  };

  if (pair) {
    const [a, b] = pair;
    const middle = { x: (a.cx + b.cx) / 2, y: (a.cy + b.cy) / 2 };
    const gap = Math.hypot(a.cx - b.cx, a.cy - b.cy);
    for (const blob of blobs) {
      const near = Math.hypot(blob.cx - middle.x, blob.cy - middle.y) <= 1.9 * gap;
      if (near && blob.cy >= middle.y - 0.6 * gap) {
        for (const pixel of blob.pixels) {
          erase[pixel] = 1;
        }
      }
    }
    if (mode === "whole") {
      // Ditto is all face and his mouth is barely darker than his body, so wipe the whole middle of the face.
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const inside = ((x - middle.x) / (1.5 * gap)) ** 2 + ((y - (middle.y + 0.5 * gap)) / (0.9 * gap)) ** 2 <= 1;
          if (inside && data[(y * width + x) * 4 + 3] > 200) {
            erase[y * width + x] = 1;
          }
        }
      }
    }
    const size = Math.min(boundsMax * HEAD_MAX_SIZE, Math.max(boundsMax * 0.28, gap * 3.4));
    return {
      crop: mode === "whole" ? wholeCrop : { cx: middle.x, cy: middle.y + size * 0.08, size },
      erase,
      face: middle,
      found: "pair",
    };
  }

  // No convincing pair of eyes. Keep the whole Pokémon and guess the head is near the top.
  let bandWeight = 0;
  let bandSum = 0;
  const bandEnd = bounds.y + bounds.height * 0.45;
  for (let y = bounds.y; y < bandEnd; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 200) {
        bandWeight += 1;
        bandSum += x;
      }
    }
  }
  const head = {
    x: bandWeight > 0 ? bandSum / bandWeight : bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height * 0.3,
  };
  const reach = boundsMax * 0.22;
  for (const blob of blobs) {
    if (Math.hypot(blob.cx - head.x, blob.cy - head.y) <= reach) {
      for (const pixel of blob.pixels) {
        erase[pixel] = 1;
      }
    }
  }
  if (!erase.some((flag) => flag === 1)) {
    for (let y = Math.max(0, Math.floor(head.y - reach * 0.8)); y < Math.min(height, head.y + reach * 0.8); y += 1) {
      for (let x = Math.max(0, Math.floor(head.x - reach)); x < Math.min(width, head.x + reach); x += 1) {
        const inside = ((x - head.x) / reach) ** 2 + ((y - head.y) / (reach * 0.8)) ** 2 <= 1;
        if (inside && data[(y * width + x) * 4 + 3] > 200) {
          erase[y * width + x] = 1;
        }
      }
    }
  }
  return {
    crop: mode === "whole" ? wholeCrop : { cx: head.x, cy: head.y, size: boundsMax * HEAD_GUESS_SIZE },
    erase,
    face: head,
    found: "none",
  };
}
/**
 * Paints out the marked pixels by spreading the colors around them inwards, so the eyes and mouth
 * disappear into the surface they were on.
 */
export function paintOut(image: RgbaImage, erase: Uint8Array, grow = 2): Uint8ClampedArray<ArrayBuffer> {
  const { width, height } = image;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < out.length; index += 1) {
    out[index] = image.data[index];
  }

  const hole = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!erase[y * width + x]) {
        continue;
      }
      for (let oy = -grow; oy <= grow; oy += 1) {
        for (let ox = -grow; ox <= grow; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height && out[(ny * width + nx) * 4 + 3] > 200) {
            hole[ny * width + nx] = 1;
          }
        }
      }
    }
  }

  const pixels: number[] = [];
  for (let pixel = 0; pixel < hole.length; pixel += 1) {
    if (hole[pixel]) {
      pixels.push(pixel);
    }
  }
  if (pixels.length === 0) {
    return out;
  }

  const value = new Float32Array(width * height * 3);
  const known = (pixel: number) => !hole[pixel] && out[pixel * 4 + 3] > 200;
  const neighbours = (pixel: number): number[] => {
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const list: number[] = [];
    if (x > 0) list.push(pixel - 1);
    if (x < width - 1) list.push(pixel + 1);
    if (y > 0) list.push(pixel - width);
    if (y < height - 1) list.push(pixel + width);
    return list;
  };

  // Start from the average color of the ring around the hole.
  const ring = [0, 0, 0];
  let ringCount = 0;
  for (const pixel of pixels) {
    for (const next of neighbours(pixel)) {
      if (known(next)) {
        for (let channel = 0; channel < 3; channel += 1) {
          ring[channel] += out[next * 4 + channel];
        }
        ringCount += 1;
      }
    }
  }
  for (const pixel of pixels) {
    for (let channel = 0; channel < 3; channel += 1) {
      value[pixel * 3 + channel] = ringCount > 0 ? ring[channel] / ringCount : out[pixel * 4 + channel];
    }
  }

  const neighbourLists = new Map<number, number[]>();
  for (const pixel of pixels) {
    neighbourLists.set(pixel, neighbours(pixel));
  }
  for (let round = 0; round < 90; round += 1) {
    for (const pixel of pixels) {
      const sum = [0, 0, 0];
      let count = 0;
      for (const next of neighbourLists.get(pixel) ?? []) {
        if (hole[next]) {
          for (let channel = 0; channel < 3; channel += 1) {
            sum[channel] += value[next * 3 + channel];
          }
          count += 1;
        } else if (known(next)) {
          for (let channel = 0; channel < 3; channel += 1) {
            sum[channel] += out[next * 4 + channel];
          }
          count += 1;
        }
      }
      if (count > 0) {
        for (let channel = 0; channel < 3; channel += 1) {
          value[pixel * 3 + channel] = sum[channel] / count;
        }
      }
    }
  }
  for (const pixel of pixels) {
    for (let channel = 0; channel < 3; channel += 1) {
      out[pixel * 4 + channel] = value[pixel * 3 + channel];
    }
  }
  return out;
}

/** Builds the icon for a picture: a close-up of the head with an outline around it. The Pokémon's own face stays. */
export function buildFaceIcon(
  image: RgbaImage,
  mode: "whole" | "head",
  options?: { eraseFace?: boolean },
): FaceIcon {
  const analysis = analyseFace(image, mode);
  const clean = options?.eraseFace ? paintOut(image, analysis.erase) : image.data;
  const { crop } = analysis;
  const left = crop.cx - crop.size / 2;
  const top = crop.cy - crop.size / 2;
  const step = crop.size / INNER;

  const body = new Float32Array(ICON_SIZE * ICON_SIZE);
  const color = new Float32Array(ICON_SIZE * ICON_SIZE * 3);
  const samples = 3;
  for (let v = 0; v < INNER; v += 1) {
    for (let u = 0; u < INNER; u += 1) {
      let alphaSum = 0;
      const sum = [0, 0, 0];
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = left + (u + (sx + 0.5) / samples) * step;
          const py = top + (v + (sy + 0.5) / samples) * step;
          const [r, g, b, a] = sampleBilinearSized(clean, image.width, image.height, px, py);
          alphaSum += a;
          sum[0] += r * a;
          sum[1] += g * a;
          sum[2] += b * a;
        }
      }
      let alpha = alphaSum / (samples * samples);
      if (mode === "head") {
        alpha *= windowCoverage(u + 0.5, v + 0.5);
      }
      const target = (v + ICON_MARGIN) * ICON_SIZE + (u + ICON_MARGIN);
      body[target] = alpha;
      if (alphaSum > 0) {
        for (let channel = 0; channel < 3; channel += 1) {
          color[target * 3 + channel] = sum[channel] / alphaSum;
        }
      }
    }
  }

  const rgba = new Uint8ClampedArray(ICON_SIZE * ICON_SIZE * 4);
  for (let y = 0; y < ICON_SIZE; y += 1) {
    for (let x = 0; x < ICON_SIZE; x += 1) {
      const index = y * ICON_SIZE + x;
      const inner = body[index];
      const outline = inner >= 1 ? 0 : outlineCoverage(body, x, y);
      const alpha = inner + (1 - inner) * outline;
      if (alpha <= 0) {
        continue;
      }
      for (let channel = 0; channel < 3; channel += 1) {
        rgba[index * 4 + channel] =
          (color[index * 3 + channel] * inner + OUTLINE[channel] * (1 - inner) * outline) / alpha;
      }
      rgba[index * 4 + 3] = Math.round(alpha * 255);
    }
  }

  const mapped = {
    x: (analysis.face.x - left) / step + ICON_MARGIN,
    y: (analysis.face.y - top) / step + ICON_MARGIN,
  };
  const face = fitFace(body, mapped, 1);
  return { rgba, body, face, faceColor: faceColorFor(rgba, face) };
}

/**
 * Fits a still picture into the tab icon: the whole opaque drawing, contain-fitted, no head crop and no
 * outline. Used when Ditto turns into the selected Pokémon's official artwork.
 */
export function fitStillPicture(image: RgbaImage): FaceIcon {
  const bounds = alphaBounds(image.data, image.width, image.height) ?? {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  };
  const scale = ICON_SIZE / Math.max(bounds.width, bounds.height);
  const destWidth = bounds.width * scale;
  const destHeight = bounds.height * scale;
  const originX = (ICON_SIZE - destWidth) / 2;
  const originY = (ICON_SIZE - destHeight) / 2;

  const rgba = new Uint8ClampedArray(ICON_SIZE * ICON_SIZE * 4);
  const body = new Float32Array(ICON_SIZE * ICON_SIZE);
  const samples = 3;
  for (let y = 0; y < ICON_SIZE; y += 1) {
    for (let x = 0; x < ICON_SIZE; x += 1) {
      let alphaSum = 0;
      const sum = [0, 0, 0];
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = bounds.x + (x + (sx + 0.5) / samples - originX) / scale;
          const py = bounds.y + (y + (sy + 0.5) / samples - originY) / scale;
          const [r, g, b, a] = sampleBilinearSized(image.data, image.width, image.height, px, py);
          alphaSum += a;
          sum[0] += r * a;
          sum[1] += g * a;
          sum[2] += b * a;
        }
      }
      const alpha = alphaSum / (samples * samples);
      const index = y * ICON_SIZE + x;
      body[index] = alpha;
      if (alphaSum <= 0) {
        continue;
      }
      rgba[index * 4] = sum[0] / alphaSum;
      rgba[index * 4 + 1] = sum[1] / alphaSum;
      rgba[index * 4 + 2] = sum[2] / alphaSum;
      rgba[index * 4 + 3] = Math.round(alpha * 255);
    }
  }

  const face = { ...DITTO_FACE };
  return { rgba, body, face, faceColor: faceColorFor(rgba, face) };
}


function sampleBilinearSized(
  data: ArrayLike<number>,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const fx = x - 0.5;
  const fy = y - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  for (const [ox, oy, weight] of [
    [0, 0, (1 - tx) * (1 - ty)],
    [1, 0, tx * (1 - ty)],
    [0, 1, (1 - tx) * ty],
    [1, 1, tx * ty],
  ]) {
    const sx = x0 + ox;
    const sy = y0 + oy;
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) {
      continue;
    }
    const index = (sy * width + sx) * 4;
    const alpha = data[index + 3] / 255;
    r += data[index] * alpha * weight;
    g += data[index + 1] * alpha * weight;
    b += data[index + 2] * alpha * weight;
    a += alpha * weight;
  }
  return a > 0 ? [r / a, g / a, b / a, a] : [0, 0, 0, 0];
}

/** A rounded-square window, so a close-up looks like a badge instead of a cut-off photo. */
function windowCoverage(u: number, v: number): number {
  const half = INNER / 2;
  const nx = Math.abs(u - half) / half;
  const ny = Math.abs(v - half) / half;
  const edge = (nx ** 4 + ny ** 4) ** 0.25;
  return Math.min(1, Math.max(0, 0.5 + (1 - edge) * half * 0.9));
}

function outlineCoverage(body: Mask, x: number, y: number): number {
  const reach = Math.ceil(OUTLINE_RADIUS);
  let best = 0;
  for (let oy = -reach; oy <= reach; oy += 1) {
    for (let ox = -reach; ox <= reach; ox += 1) {
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= ICON_SIZE || ny >= ICON_SIZE) {
        continue;
      }
      const alpha = body[ny * ICON_SIZE + nx];
      if (alpha <= 0) {
        continue;
      }
      const distance = Math.hypot(ox, oy);
      best = Math.max(best, alpha * Math.min(1, Math.max(0, 0.5 + (OUTLINE_RADIUS - distance))));
    }
  }
  return best;
}

function faceOnBody(mask: Mask, x: number, y: number, scale: number): boolean {
  const eye = EYE_OFFSET * scale;
  const mouthY = y + MOUTH_DROP * scale;
  const mouth = MOUTH_HALF_WIDTH * scale;
  return [
    [x - eye, y],
    [x + eye, y],
    [x - mouth, mouthY],
    [x + mouth, mouthY],
    [x, mouthY],
  ].every(([px, py]) => {
    const cx = Math.floor(px);
    const cy = Math.floor(py);
    return cx >= 0 && cx < ICON_SIZE && cy >= 0 && cy < ICON_SIZE && mask[cy * ICON_SIZE + cx] >= 0.5;
  });
}

/**
 * The spot closest to `target` where the whole face fits on the picture. Narrow heads get a smaller face.
 * If it fits nowhere, it goes on the nearest solid pixel at the smallest size.
 */
export function fitFace(mask: Mask, target: { x: number; y: number }, largest = 1): Face {
  const scales = FACE_SCALES.filter((scale) => scale <= largest);
  for (const scale of scales) {
    let best: Face | null = null;
    let bestDistance = Infinity;
    for (let y = 0; y < ICON_SIZE; y += 1) {
      for (let x = 0; x < ICON_SIZE; x += 1) {
        const distance = Math.hypot(x + 0.5 - target.x, y + 0.5 - target.y);
        if (distance < bestDistance && faceOnBody(mask, x + 0.5, y + 0.5, scale)) {
          bestDistance = distance;
          best = { x: x + 0.5, y: y + 0.5, scale };
        }
      }
    }
    if (best) {
      return best;
    }
  }

  const scale = scales[scales.length - 1] ?? FACE_SCALES[FACE_SCALES.length - 1];
  let nearest: Face | null = null;
  let nearestDistance = Infinity;
  for (let y = 0; y < ICON_SIZE; y += 1) {
    for (let x = 0; x < ICON_SIZE; x += 1) {
      const distance = Math.hypot(x + 0.5 - target.x, y + 0.5 - target.y);
      if (mask[y * ICON_SIZE + x] >= 0.5 && distance < nearestDistance) {
        nearestDistance = distance;
        nearest = { x: x + 0.5, y: y + 0.5, scale };
      }
    }
  }
  return nearest ?? { ...DITTO_FACE };
}

/** Dark features on a light surface, light features on a dark one, so the face is always readable. */
export function faceColorFor(rgba: ArrayLike<number>, face: Face): Rgb {
  let total = 0;
  let count = 0;
  for (let y = 0; y < ICON_SIZE; y += 1) {
    for (let x = 0; x < ICON_SIZE; x += 1) {
      if (Math.hypot(x + 0.5 - face.x, y + 0.5 - (face.y + 3)) <= 11 * face.scale + 2 && rgba[(y * ICON_SIZE + x) * 4 + 3] > 200) {
        total += luminance(rgba, y * ICON_SIZE + x);
        count += 1;
      }
    }
  }
  return count > 0 && total / count < 0.34 ? LIGHT_FACE : DARK_FACE;
}

/** Draws the Ditto face (two dot eyes and a flat mouth) over an RGBA picture, only where the picture is solid. */
export function drawFace(rgba: Uint8ClampedArray, face: Face, color: Rgb): void {
  const scale = face.scale;
  const eyeRadius = EYE_RADIUS * (0.6 + 0.4 * scale);
  const mouthY = face.y + MOUTH_DROP * scale;
  const mouthHalf = MOUTH_HALF_WIDTH * scale;
  for (let y = 0; y < ICON_SIZE; y += 1) {
    for (let x = 0; x < ICON_SIZE; x += 1) {
      const index = y * ICON_SIZE + x;
      const alpha = rgba[index * 4 + 3];
      if (alpha === 0) {
        continue;
      }
      const px = x + 0.5;
      const py = y + 0.5;
      const mouthX = Math.min(face.x + mouthHalf, Math.max(face.x - mouthHalf, px));
      const amount = Math.max(
        cover(eyeRadius - Math.hypot(px - (face.x - EYE_OFFSET * scale), py - face.y)),
        cover(eyeRadius - Math.hypot(px - (face.x + EYE_OFFSET * scale), py - face.y)),
        cover(MOUTH_HALF_THICKNESS - Math.hypot(px - mouthX, py - mouthY)),
      );
      if (amount > 0) {
        for (let channel = 0; channel < 3; channel += 1) {
          rgba[index * 4 + channel] += (color[channel] - rgba[index * 4 + channel]) * amount;
        }
      }
    }
  }
}

function cover(distance: number): number {
  return Math.min(1, Math.max(0, 0.5 + distance));
}
