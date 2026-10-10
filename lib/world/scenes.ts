/**
 * Which official game backdrop each page shows. The art itself lives in public/world and is written by
 * `npm run import:world-art`; the light and dark variants are chosen by CSS (`.scene-*` in globals.css).
 */
export const SCENE_IDS = ["home", "randomizer", "builder", "recap", "teams", "lost"] as const;

export type SceneId = (typeof SCENE_IDS)[number];

const SCENE_BY_PATH: Readonly<Record<string, SceneId>> = {
  "/": "home",
  "/randomizer": "randomizer",
  "/builder": "builder",
  "/recap": "recap",
  "/teams": "teams",
};

/** Pages that are not part of the app (unknown URLs) get the "lost" scene. */
export function sceneForPath(pathname: string | null | undefined): SceneId {
  if (!pathname) {
    return "home";
  }
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return SCENE_BY_PATH[trimmed] ?? "lost";
}

/** The two image files for one scene. "lost" has a single image for both themes. */
export function sceneImages(scene: SceneId): { light: string; dark: string } {
  if (scene === "lost") {
    return { light: "/world/lost.webp", dark: "/world/lost.webp" };
  }
  return { light: `/world/${scene}-light.webp`, dark: `/world/${scene}-dark.webp` };
}
