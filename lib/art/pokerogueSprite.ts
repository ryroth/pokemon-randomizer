import spriteIndex from "@/data/generated/pokerogue-sprites.json";

/**
 * PokéRogue draws each Pokémon from a TexturePacker atlas and plays the frames named
 * `0001.png` through `0400.png` at 10 fps, looping. Shiny colors are a separate sheet,
 * a `_1` sheet, or a palette on the same sheet. Female differences live under `female/`.
 * This file only describes that layout. It does not copy PokéRogue's renderer.
 */

export const POKEROGUE_SPRITE_FPS = 10;
export const POKEROGUE_SPRITE_FRAME_CAP = 400;

export type ShinyKind = "sheet" | "palette" | "variant";

export interface PokerogueSpriteEntry {
  key: string;
  shiny: ShinyKind;
  femaleKey?: string;
  femaleShiny?: ShinyKind;
}

export interface PokerogueSpriteIndex {
  /** `pagefaultgames/pokerogue-assets` commit the atlas URLs are pinned to. */
  commit: string;
  pokemon: Record<string, PokerogueSpriteEntry>;
}

export interface AtlasFrame {
  name: string;
  /** 1-based frame number from the file name, or NaN when the name is not a numbered frame. */
  index: number;
  rotated: boolean;
  /** Rectangle in the atlas image. */
  trim: { x: number; y: number; w: number; h: number };
  /** Where the trimmed pixels sit inside the frame. */
  place: { x: number; y: number; w: number; h: number };
  /** Untrimmed frame size. Shared across a sprite so the animation does not jump. */
  source: { w: number; h: number };
  image: string;
}

export interface ParsedAtlas {
  frames: AtlasFrame[];
}

export interface AtlasAttempt {
  path: string;
  /** Recolor this sheet with PokéRogue's official shiny palette. */
  palette: boolean;
}

const index = spriteIndex as PokerogueSpriteIndex;

export function pokerogueSpriteIndex(): PokerogueSpriteIndex {
  return index;
}

export function pokerogueSpriteEntry(pokemonId: string): PokerogueSpriteEntry | null {
  return index.pokemon[pokemonId] ?? null;
}

export function pokerogueAtlasUrl(atlasPath: string, extension: "json" | "png"): string {
  return `https://cdn.jsdelivr.net/gh/pagefaultgames/pokerogue-assets@${index.commit}/images/pokemon/${atlasPath}.${extension}`;
}

export function pokeroguePaletteUrl(atlasPath: string): string {
  return `https://cdn.jsdelivr.net/gh/pagefaultgames/pokerogue-assets@${index.commit}/images/pokemon/variant/${atlasPath}.json`;
}

/** Sheets to try, best first. A later sheet is the fallback when a shiny or female file is missing. */
export function atlasAttempts(
  entry: PokerogueSpriteEntry,
  shiny: boolean,
  female: boolean,
): AtlasAttempt[] {
  const attempts: AtlasAttempt[] = [];
  const push = (path: string, palette: boolean) => {
    if (attempts.some((item) => item.path === path && item.palette === palette)) {
      return;
    }
    attempts.push({ path, palette });
  };
  const add = (key: string, kind: ShinyKind, wantShiny: boolean) => {
    if (wantShiny && kind === "sheet") {
      push(`shiny/${key}`, false);
    } else if (wantShiny && kind === "variant") {
      push(`${key}_1`, false);
    } else if (wantShiny && kind === "palette") {
      push(key, true);
    } else {
      push(key, false);
    }
    if (wantShiny) {
      push(key, false);
    }
  };

  if (female && entry.femaleKey) {
    add(entry.femaleKey, entry.femaleShiny ?? "sheet", shiny);
  }
  add(entry.key, entry.shiny, shiny);
  return attempts;
}

interface RawRect {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface RawFrame {
  filename?: string;
  rotated?: boolean;
  frame?: RawRect;
  spriteSourceSize?: RawRect;
  sourceSize?: RawRect;
}

function rect(value: RawRect | undefined, fallbackW = 0, fallbackH = 0): { x: number; y: number; w: number; h: number } {
  return {
    x: value?.x ?? 0,
    y: value?.y ?? 0,
    w: value?.w ?? fallbackW,
    h: value?.h ?? fallbackH,
  };
}

function frameFrom(raw: RawFrame, image: string): AtlasFrame | null {
  const name = raw.filename;
  if (!name) {
    return null;
  }
  const numbered = /^(\d+)\.png$/i.exec(name);
  const box = rect(raw.frame);
  const place = rect(raw.spriteSourceSize, box.w, box.h);
  const source = rect(raw.sourceSize, place.w, place.h);
  return {
    name,
    index: numbered ? Number(numbered[1]) : Number.NaN,
    rotated: raw.rotated === true,
    trim: box,
    place,
    source: { w: source.w, h: source.h },
    image,
  };
}

function framesFromTexture(texture: { image?: string; frames?: RawFrame[] | Record<string, RawFrame> }): AtlasFrame[] {
  const image = texture.image ?? "";
  const rawFrames = texture.frames;
  if (!rawFrames) {
    return [];
  }
  if (Array.isArray(rawFrames)) {
    return rawFrames.flatMap((frame) => {
      const parsed = frameFrom(frame, image);
      return parsed ? [parsed] : [];
    });
  }
  return Object.entries(rawFrames).flatMap(([name, frame]) => {
    const parsed = frameFrom({ ...frame, filename: frame.filename ?? name }, image);
    return parsed ? [parsed] : [];
  });
}

/** Reads a Phaser multi-atlas or a single TexturePacker atlas. */
export function parseAtlas(atlas: unknown): ParsedAtlas {
  if (!atlas || typeof atlas !== "object") {
    return { frames: [] };
  }
  const record = atlas as {
    textures?: Array<{ image?: string; frames?: RawFrame[] | Record<string, RawFrame> }>;
    frames?: RawFrame[] | Record<string, RawFrame>;
    meta?: { image?: string };
  };
  if (Array.isArray(record.textures)) {
    return { frames: record.textures.flatMap((texture) => framesFromTexture(texture)) };
  }
  return {
    frames: framesFromTexture({ image: record.meta?.image, frames: record.frames }),
  };
}

/**
 * Playback order matches PokéRogue: numbered frames from 1 through 400, ascending.
 * Any other names are used only when the sheet has no numbered frames.
 */
export function playbackFrames(atlas: ParsedAtlas): AtlasFrame[] {
  const numbered = atlas.frames.filter(
    (frame) => frame.index >= 1 && frame.index <= POKEROGUE_SPRITE_FRAME_CAP,
  );
  if (numbered.length === 0) {
    return atlas.frames;
  }
  return [...numbered].sort((left, right) => left.index - right.index);
}

export function spriteBounds(frames: readonly AtlasFrame[]): { w: number; h: number } {
  let w = 1;
  let h = 1;
  for (const frame of frames) {
    w = Math.max(w, frame.source.w, frame.place.x + frame.place.w);
    h = Math.max(h, frame.source.h, frame.place.y + frame.place.h);
  }
  return { w, h };
}

/** Draws one atlas frame. Rotated frames are stored 90° clockwise, which is TexturePacker's layout. */
export function drawAtlasFrame(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  frame: AtlasFrame,
): void {
  const { trim, place } = frame;
  if (!frame.rotated) {
    context.drawImage(image, trim.x, trim.y, trim.w, trim.h, place.x, place.y, place.w, place.h);
    return;
  }
  context.save();
  context.translate(place.x + place.h, place.y);
  context.rotate(Math.PI / 2);
  context.drawImage(image, trim.x, trim.y, trim.w, trim.h, 0, 0, place.h, place.w);
  context.restore();
}
