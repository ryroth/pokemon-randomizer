import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ICON_SIZE, buildFaceIcon, drawFace } from "../../lib/art/faceIcon";
import { faceIconImageCandidates } from "../../lib/art/pokemonImage";
import type { PokemonSprites } from "../../lib/types/pokemon";

/**
 * Writes the still tab icon: Ditto's official Pokémon HOME picture as a face icon wearing Ditto's face.
 * The animated icon in the browser is cut from the same picture by the same code (`lib/art/faceIcon.ts`).
 * Run with `npm run import:ditto-icon`. Output: `app/icon.png`.
 */
async function main() {
  const catalogPath = path.join("data", "generated", "catalog.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
    pokemon: Array<{ id: string; sprites: PokemonSprites }>;
  };
  const ditto = catalog.pokemon.find((entry) => entry.id === "ditto");
  if (!ditto) {
    throw new Error("Ditto is missing from the catalog. Run npm run import:data first.");
  }

  let picture: Buffer | null = null;
  for (const url of faceIconImageCandidates(ditto.sprites, false)) {
    const response = await fetch(url);
    if (response.ok) {
      picture = Buffer.from(await response.arrayBuffer());
      break;
    }
  }
  if (!picture) {
    throw new Error("Could not download Ditto's picture.");
  }

  const { data, info } = await sharp(picture)
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const icon = buildFaceIcon(
    { data: new Uint8ClampedArray(data), width: info.width, height: info.height },
    "whole",
    { eraseFace: true },
  );
  const pixels = new Uint8ClampedArray(icon.rgba);
  drawFace(pixels, icon.face, icon.faceColor);

  const target = path.join("app", "icon.png");
  await sharp(Buffer.from(pixels), { raw: { width: ICON_SIZE, height: ICON_SIZE, channels: 4 } })
    .png()
    .toFile(target);
  console.log(`Wrote ${target}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
