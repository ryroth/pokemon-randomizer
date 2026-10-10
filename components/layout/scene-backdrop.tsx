"use client";

import { usePathname } from "next/navigation";
import { sceneForPath } from "@/lib/world/scenes";

/**
 * Official game art behind the page: Pokémon Legends: Z-A and Pokémon Scarlet / Violet. Decorative only
 * (`aria-hidden`). Two layers share one image: a quiet fixed "world" layer behind everything, and a vivid
 * banner at the top of the page that sits behind the title panel and fades out before the content starts,
 * so body text never sits on busy art. The scene follows the route. Light and dark themes each have their
 * own image (see `.scene-*` in globals.css). The parent must be `position: relative` (the body is).
 */
export function SceneBackdrop() {
  const scene = sceneForPath(usePathname());
  return (
    <>
      <div aria-hidden="true" data-scene={scene} className={`scene-world scene-${scene}`} />
      <div aria-hidden="true" data-scene={scene} className={`scene-banner scene-${scene}`} />
    </>
  );
}
