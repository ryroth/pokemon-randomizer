import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Downloads official Pokémon Legends: Z-A and Pokémon Scarlet / Violet art from Bulbagarden Archives
 * and writes the page backdrops to public/world/. Run with `npm run import:world-art`.
 *
 * Every image here is official game art or a game screenshot. Nothing is fan-made. The art belongs to
 * Nintendo, Creatures Inc., and GAME FREAK inc.; this project does not claim it. The files are shipped
 * from this site, so the browser never calls Bulbagarden or any other host.
 */

const API = "https://archives.bulbagarden.net/w/api.php";
const USER_AGENT = "pokemon-randomizer world-art importer (local, non-commercial fan project)";
const OUTPUT_WIDTH = 1920;
const WEBP_QUALITY = 72;

interface Scene {
  /** File name in public/world, without extension. */
  id: string;
  /** Title on Bulbagarden Archives, without the "File:" prefix. */
  title: string;
  game: "Legends Z-A" | "Scarlet and Violet";
  /** Pixels to trim from the top and bottom, for art with letterbox bars. */
  trim?: { top: number; bottom: number };
  /** WebP quality when the default is too heavy, such as for fine ink-line texture. */
  quality?: number;
  /** Output width in pixels when the default is too heavy. */
  width?: number;
}

export const SCENES: readonly Scene[] = [
  { id: "home-light", title: "Legends Z-A Day Key Art.png", game: "Legends Z-A" },
  { id: "home-dark", title: "Legends Z-A Night Key Art.png", game: "Legends Z-A" },
  { id: "randomizer-light", title: "Scarlet Violet Key Visual.png", game: "Scarlet and Violet" },
  { id: "randomizer-dark", title: "Prism Tower Mega Power ZA.png", game: "Legends Z-A" },
  { id: "builder-light", title: "Hotel Z battle.png", game: "Legends Z-A" },
  { id: "builder-dark", title: "Lower Area Zero.png", game: "Scarlet and Violet" },
  { id: "recap-light", title: "Quasartico Inc. building.png", game: "Legends Z-A" },
  { id: "recap-dark", title: "Prism Tower Ange ZA.png", game: "Legends Z-A", trim: { top: 80, bottom: 80 }, quality: 40, width: 1400 },
  { id: "teams-light", title: "Upper Area Zero.png", game: "Scarlet and Violet" },
  { id: "teams-dark", title: "Prism Tower destroyed ZA.png", game: "Legends Z-A" },
  { id: "lost", title: "Hyperspace Entry Point ZA.png", game: "Legends Z-A" },
];

interface ImageInfoResponse {
  query: {
    pages: Record<
      string,
      { imageinfo?: { url: string; width: number; height: number; descriptionurl: string }[] }
    >;
  };
}

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}.`);
  }
  return response;
}

async function lookup(title: string) {
  const query = new URLSearchParams({
    action: "query",
    titles: `File:${title}`,
    prop: "imageinfo",
    iiprop: "url|size",
    format: "json",
  });
  const body = (await (await fetchOk(`${API}?${query}`)).json()) as ImageInfoResponse;
  const info = Object.values(body.query.pages)[0]?.imageinfo?.[0];
  if (!info) {
    throw new Error(`Bulbagarden Archives has no file named "${title}".`);
  }
  return info;
}

async function original(scene: Scene, cacheDir: string) {
  const info = await lookup(scene.title);
  const cached = path.join(cacheDir, `${scene.id}${path.extname(scene.title)}`);
  try {
    return { info, buffer: await readFile(cached) };
  } catch {
    const buffer = Buffer.from(await (await fetchOk(info.url)).arrayBuffer());
    await writeFile(cached, buffer);
    return { info, buffer };
  }
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "world");
  const cacheDir = path.join(process.cwd(), "data", "cache", "world-art");
  await mkdir(outDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });

  const sources: Record<string, { title: string; game: string; page: string; file: string }> = {};
  for (const scene of SCENES) {
    const { info, buffer } = await original(scene, cacheDir);
    let image = sharp(buffer);
    if (scene.trim) {
      image = image.extract({
        left: 0,
        top: scene.trim.top,
        width: info.width,
        height: info.height - scene.trim.top - scene.trim.bottom,
      });
    }
    const out = await image
      .resize({ width: scene.width ?? OUTPUT_WIDTH, withoutEnlargement: true })
      .webp({ quality: scene.quality ?? WEBP_QUALITY })
      .toBuffer();
    await writeFile(path.join(outDir, `${scene.id}.webp`), out);
    sources[scene.id] = {
      title: scene.title,
      game: scene.game,
      page: info.descriptionurl,
      file: info.url,
    };
    console.log(`${scene.id}.webp  ${Math.round(out.length / 1024)} KB  (${scene.title})`);
  }

  await writeFile(path.join(outDir, "sources.json"), `${JSON.stringify(sources, null, 2)}\n`);
  console.log(`Wrote ${SCENES.length} backdrops to ${outDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
