"use client";

import {
  atlasAttempts,
  parseAtlas,
  playbackFrames,
  pokerogueAtlasUrl,
  pokeroguePaletteUrl,
  pokerogueSpriteEntry,
  spriteBounds,
  type AtlasFrame,
} from "@/lib/art/pokerogueSprite";

export interface LoadedSheet {
  bounds: { w: number; h: number };
  frames: AtlasFrame[];
  images: Map<string, CanvasImageSource>;
}

const cache = new Map<string, Promise<LoadedSheet | null>>();

/** Loads one atlas, or the first sheet PokéRogue would use for this Pokémon. */
export function loadPokemonSheet(
  pokemonId: string,
  shiny: boolean,
  female: boolean,
): Promise<LoadedSheet | null> {
  const entry = pokerogueSpriteEntry(pokemonId);
  if (!entry) {
    return Promise.resolve(null);
  }
  return loadFirst(atlasAttempts(entry, shiny, female));
}

async function loadFirst(attempts: ReadonlyArray<{ path: string; palette: boolean }>): Promise<LoadedSheet | null> {
  for (const attempt of attempts) {
    const sheet = await loadSheet(attempt.path, attempt.palette);
    if (sheet && sheet.frames.length > 0) {
      return sheet;
    }
  }
  return null;
}

function loadSheet(atlasPath: string, palette: boolean): Promise<LoadedSheet | null> {
  const cacheKey = `${atlasPath}:${palette ? "palette" : "plain"}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const pending = fetchSheet(atlasPath, palette).catch(() => null);
  cache.set(cacheKey, pending);
  return pending;
}

async function fetchSheet(atlasPath: string, palette: boolean): Promise<LoadedSheet | null> {
  const response = await fetch(pokerogueAtlasUrl(atlasPath, "json"));
  if (!response.ok) {
    return null;
  }
  const frames = playbackFrames(parseAtlas(await response.json()));
  if (frames.length === 0) {
    return null;
  }
  const names = [...new Set(frames.map((frame) => frame.image).filter((name) => name.length > 0))];
  if (names.length === 0) {
    names.push(`${atlasPath.slice(atlasPath.lastIndexOf("/") + 1)}.png`);
  }
  const loaded = await Promise.all(names.map(async (name) => [name, await loadImage(imageUrl(atlasPath, name))] as const));
  const images = new Map<string, CanvasImageSource>();
  const colors = palette ? await loadPalette(atlasPath) : null;
  for (const [name, image] of loaded) {
    if (!image) {
      return null;
    }
    images.set(name, colors ? recolor(image, colors) : image);
  }
  return { bounds: spriteBounds(frames), frames, images };
}

function imageUrl(atlasPath: string, imageName: string): string {
  const jsonUrl = pokerogueAtlasUrl(atlasPath, "json");
  return `${jsonUrl.slice(0, jsonUrl.lastIndexOf("/") + 1)}${imageName}`;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function loadPalette(atlasPath: string): Promise<Record<string, string> | null> {
  const response = await fetch(pokeroguePaletteUrl(atlasPath));
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as Record<string, unknown>;
  const official = body["0"];
  if (!official || typeof official !== "object") {
    return null;
  }
  return official as Record<string, string>;
}

function recolor(image: HTMLImageElement, map: Record<string, string>): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return canvas;
  }
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }
    const hex = [data[index], data[index + 1], data[index + 2]]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("");
    const next = map[hex];
    if (!next || next.length !== 6) {
      continue;
    }
    data[index] = Number.parseInt(next.slice(0, 2), 16);
    data[index + 1] = Number.parseInt(next.slice(2, 4), 16);
    data[index + 2] = Number.parseInt(next.slice(4, 6), 16);
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}
