import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCENE_IDS, sceneForPath, sceneImages } from "@/lib/world/scenes";

const WORLD_DIR = path.join(process.cwd(), "public", "world");

describe("sceneForPath", () => {
  it("gives each page of the app its own scene", () => {
    expect(sceneForPath("/")).toBe("home");
    expect(sceneForPath("/randomizer")).toBe("randomizer");
    expect(sceneForPath("/builder")).toBe("builder");
    expect(sceneForPath("/recap")).toBe("recap");
    expect(sceneForPath("/teams")).toBe("teams");
  });

  it("ignores a trailing slash", () => {
    expect(sceneForPath("/teams/")).toBe("teams");
  });

  it("uses the lost scene for URLs that are not part of the app", () => {
    expect(sceneForPath("/nope")).toBe("lost");
    expect(sceneForPath("/builder/extra")).toBe("lost");
  });

  it("falls back to home when there is no path yet", () => {
    expect(sceneForPath(null)).toBe("home");
    expect(sceneForPath(undefined)).toBe("home");
  });
});

describe("sceneImages", () => {
  it("has a light and a dark image per page, and one shared image for the lost scene", () => {
    expect(sceneImages("home")).toEqual({ light: "/world/home-light.webp", dark: "/world/home-dark.webp" });
    expect(sceneImages("lost")).toEqual({ light: "/world/lost.webp", dark: "/world/lost.webp" });
  });
});

describe("shipped backdrops", () => {
  const files = SCENE_IDS.flatMap((scene) => {
    const { light, dark } = sceneImages(scene);
    return [light, dark];
  });

  it("ships every image the scenes point to, and keeps each one light enough to load quickly", () => {
    for (const file of new Set(files)) {
      const onDisk = path.join(process.cwd(), "public", file);
      expect(existsSync(onDisk), `${file} is missing. Run npm run import:world-art.`).toBe(true);
      expect(statSync(onDisk).size, `${file} is over 400 KB`).toBeLessThan(400 * 1024);
    }
  });

  it("points the stylesheet at the same files", () => {
    const css = readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
    for (const file of new Set(files)) {
      expect(css, `${file} is not used in globals.css`).toContain(`url("${file}")`);
    }
  });

  it("credits every image to an official game and to Bulbagarden Archives, never to a fan site", () => {
    const sources = JSON.parse(readFileSync(path.join(WORLD_DIR, "sources.json"), "utf8")) as Record<
      string,
      { game: string; page: string; file: string }
    >;
    const ids = Object.keys(sources).sort();
    const expected = [...new Set(files)].map((file) => path.basename(file, ".webp")).sort();
    expect(ids).toEqual(expected);
    for (const source of Object.values(sources)) {
      expect(["Legends Z-A", "Scarlet and Violet"]).toContain(source.game);
      expect(new URL(source.page).hostname).toBe("archives.bulbagarden.net");
      expect(new URL(source.file).hostname).toBe("archives.bulbagarden.net");
    }
  });
});
