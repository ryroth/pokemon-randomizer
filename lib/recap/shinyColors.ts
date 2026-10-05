export interface ColorSlot {
  materialName: string;
  imageName: string;
  bytes: Uint8Array;
  mimeType: string;
}

export interface ShinyColorPaint {
  materialName: string;
  bytes: Uint8Array;
  mimeType: string;
}

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const ROLE_KEYS = ["bodya", "bodyb", "leye", "reye", "iris", "mouth", "face", "fire", "eye", "body"] as const;

interface GlbImage {
  name?: string;
  mimeType?: string;
  bufferView?: number;
}

interface GlbBufferView {
  byteOffset?: number;
  byteLength: number;
}

interface GlbTexture {
  source?: number;
  extensions?: {
    EXT_texture_webp?: { source?: number };
  };
}

interface GlbMaterial {
  name?: string;
  pbrMetallicRoughness?: {
    baseColorTexture?: { index?: number };
  };
}

interface GlbJson {
  images?: GlbImage[];
  bufferViews?: GlbBufferView[];
  textures?: GlbTexture[];
  materials?: GlbMaterial[];
}

/** Base-color images from a GLB, including WebP textures stored in EXT_texture_webp. */
export function colorSlotsFromGlb(buffer: ArrayBuffer): ColorSlot[] {
  const parsed = parseGlb(buffer);
  if (!parsed) {
    return [];
  }
  const { json, bin } = parsed;
  const slots: ColorSlot[] = [];
  for (const material of json.materials ?? []) {
    const textureIndex = material.pbrMetallicRoughness?.baseColorTexture?.index;
    if (textureIndex == null || !material.name) {
      continue;
    }
    const image = imageForTexture(json, textureIndex);
    const bytes = image ? imageBytes(json, bin, image) : null;
    if (!image || !bytes) {
      continue;
    }
    slots.push({
      materialName: material.name,
      imageName: image.name ?? "",
      bytes,
      mimeType: image.mimeType ?? "image/png",
    });
  }
  return slots;
}

/** Image name for a loaded material, so role matching can use BodyA-style filenames. */
export function imageNameForMaterial(gltf: unknown, materialIndex: number): string {
  if (!isGlbJson(gltf) || materialIndex < 0) {
    return "";
  }
  const image = imageForTexture(gltf, gltf.materials?.[materialIndex]?.pbrMetallicRoughness?.baseColorTexture?.index ?? -1);
  return image?.name ?? "";
}

/**
 * Maps shiny base-color images onto the regular model's materials.
 * Returns null when the files do not share material names or body/eye roles,
 * so a mismatched mesh is left on its original textures.
 */
export function pairShinyColors(
  regular: readonly Pick<ColorSlot, "materialName" | "imageName">[],
  shiny: readonly ColorSlot[],
): ShinyColorPaint[] | null {
  if (regular.length === 0 || shiny.length === 0) {
    return null;
  }
  return pairBy(regular, shiny, nameKey) ?? pairBy(regular, shiny, roleOf);
}

function pairBy(
  regular: readonly Pick<ColorSlot, "materialName" | "imageName">[],
  shiny: readonly ColorSlot[],
  keyOf: (slot: Pick<ColorSlot, "materialName" | "imageName">) => string | null,
): ShinyColorPaint[] | null {
  const shinyByKey = new Map<string, ColorSlot>();
  for (const slot of shiny) {
    const key = keyOf(slot);
    if (key && !shinyByKey.has(key)) {
      shinyByKey.set(key, slot);
    }
  }
  const paints: ShinyColorPaint[] = [];
  for (const slot of regular) {
    const key = keyOf(slot);
    const match = key ? shinyByKey.get(key) : undefined;
    if (!match) {
      return null;
    }
    paints.push({ materialName: slot.materialName, bytes: match.bytes, mimeType: match.mimeType });
  }
  return paints;
}

function nameKey(slot: Pick<ColorSlot, "materialName">): string | null {
  const name = normalize(slot.materialName);
  return name.length > 0 ? name : null;
}

function roleOf(slot: Pick<ColorSlot, "materialName" | "imageName">): string | null {
  return roleKey(slot.materialName) ?? roleKey(slot.imageName);
}

function roleKey(name: string): string | null {
  const normalized = normalize(name);
  return ROLE_KEYS.find((role) => normalized.includes(role)) ?? null;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isGlbJson(value: unknown): value is GlbJson {
  return typeof value === "object" && value !== null;
}

function parseGlb(buffer: ArrayBuffer): { json: GlbJson; bin: Uint8Array } | null {
  if (buffer.byteLength < 20) {
    return null;
  }
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    return null;
  }
  let json: GlbJson | null = null;
  let bin: Uint8Array | null = null;
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (length < 0 || start + length > buffer.byteLength) {
      return null;
    }
    if (type === JSON_CHUNK) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, start, length)));
      } catch {
        return null;
      }
      if (!isGlbJson(parsed)) {
        return null;
      }
      json = parsed;
    } else if (type === BIN_CHUNK) {
      bin = new Uint8Array(buffer, start, length);
    }
    offset = start + length;
  }
  if (!json || !bin) {
    return null;
  }
  return { json, bin };
}

function imageForTexture(json: GlbJson, textureIndex: number): GlbImage | null {
  const texture = json.textures?.[textureIndex];
  const source = texture?.source ?? texture?.extensions?.EXT_texture_webp?.source;
  if (source == null) {
    return null;
  }
  return json.images?.[source] ?? null;
}

function imageBytes(json: GlbJson, bin: Uint8Array, image: GlbImage): Uint8Array | null {
  if (image.bufferView == null) {
    return null;
  }
  const bufferView = json.bufferViews?.[image.bufferView];
  if (!bufferView) {
    return null;
  }
  const start = bufferView.byteOffset ?? 0;
  const end = start + bufferView.byteLength;
  if (start < 0 || end > bin.byteLength) {
    return null;
  }
  return bin.slice(start, end);
}
