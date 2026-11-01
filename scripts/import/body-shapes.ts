import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PokedexShape } from "../../lib/types/taxonomy";

/**
 * The 14 Pokémon HOME body shape pictures, in PokéAPI order.
 * Run with `npm run import:body-shapes`. Output: `public/body-shapes/`.
 */
const HOME_BODY_SHAPE_FILE: Record<PokedexShape, string> = {
  ball: "Body01.png",
  squiggle: "Body02.png",
  fish: "Body03.png",
  arms: "Body04.png",
  blob: "Body05.png",
  upright: "Body06.png",
  legs: "Body07.png",
  quadruped: "Body08.png",
  wings: "Body09.png",
  tentacles: "Body10.png",
  heads: "Body11.png",
  humanoid: "Body12.png",
  "bug-wings": "Body13.png",
  armor: "Body14.png",
};

function mediaUrl(filename: string): string {
  const hash = createHash("md5").update(filename).digest("hex");
  return `https://archives.bulbagarden.net/media/upload/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`;
}

async function main() {
  const directory = path.join(process.cwd(), "public", "body-shapes");
  await mkdir(directory, { recursive: true });

  for (const [shape, filename] of Object.entries(HOME_BODY_SHAPE_FILE) as Array<[PokedexShape, string]>) {
    const response = await fetch(mediaUrl(filename));
    if (!response.ok) {
      throw new Error(`Could not download ${filename} (${response.status}).`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1000) {
      throw new Error(`${filename} was too small to be the HOME icon.`);
    }
    const target = path.join(directory, `${shape}.png`);
    await writeFile(target, bytes);
    console.log(`Wrote ${target}`);
  }
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/import/body-shapes.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
