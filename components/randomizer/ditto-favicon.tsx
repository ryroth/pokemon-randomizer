"use client";

import { useEffect, useRef } from "react";
import {
  MORPH_SIZE,
  fallbackDittoIcon,
  morphFrame,
  prepareMorph,
} from "@/lib/art/dittoMorph";
import { buildFaceIcon, type FaceIcon } from "@/lib/art/faceIcon";

const FRAME_MS = 80;
const WORK_SIZE = 128;
const LOAD_WIDTH = 256;

interface DittoFaviconProps {
  /** The id of the Pokémon the user selected, or undefined when none is. The first value seen is ignored. */
  selectionKey: string | undefined;
  /** Pictures of Ditto to try, best first. */
  dittoImages: readonly string[];
  /** Pictures of the selected Pokémon to try, best first. */
  pokemonImages: readonly string[];
}

/**
 * The tab icon is Ditto. When the user selects a Pokémon it turns into that Pokémon's face icon, wearing
 * Ditto's face in place of its eyes and mouth, then goes back to Ditto. It renders nothing.
 * Reduced motion keeps the still icon.
 */
export function DittoFavicon({ selectionKey, dittoImages, pokemonImages }: DittoFaviconProps) {
  const initialKey = useRef(selectionKey);
  const inputs = useRef({ dittoImages, pokemonImages });

  useEffect(() => {
    inputs.current = { dittoImages, pokemonImages };
  });

  useEffect(() => {
    if (selectionKey === undefined || selectionKey === initialKey.current) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    const icons = iconLinks();

    const restore = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
      icons.restore();
    };

    void (async () => {
      const { dittoImages: dittoUrls, pokemonImages: pokemonUrls } = inputs.current;
      const [ditto, selected] = await Promise.all([
        loadFaceIcon(dittoUrls, "whole"),
        loadFaceIcon(pokemonUrls, "head"),
      ]);
      if (cancelled || selected === null) {
        return;
      }

      const plan = prepareMorph(ditto ?? fallbackDittoIcon(), [selected]);
      const canvas = document.createElement("canvas");
      canvas.width = MORPH_SIZE;
      canvas.height = MORPH_SIZE;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const start = performance.now();
      const draw = () => {
        const { pixels, done } = morphFrame(plan, performance.now() - start);
        if (done) {
          restore();
          return;
        }
        context.putImageData(new ImageData(pixels, MORPH_SIZE, MORPH_SIZE), 0, 0);
        icons.show(canvas.toDataURL("image/png"));
      };
      draw();
      timer = window.setInterval(draw, FRAME_MS);
    })();

    return () => {
      cancelled = true;
      restore();
    };
  }, [selectionKey]);

  return null;
}

/** The page's icon links, with a way to show a picture on them and to put the original icon back. */
function iconLinks() {
  const existing = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
  const created = existing.length === 0;
  const links = created ? [document.createElement("link")] : existing;
  if (created) {
    links[0].rel = "icon";
    document.head.appendChild(links[0]);
  }
  const originals = links.map((link) => ({
    link,
    href: link.getAttribute("href"),
    type: link.getAttribute("type"),
  }));

  return {
    show(href: string) {
      for (const { link } of originals) {
        link.setAttribute("type", "image/png");
        link.setAttribute("href", href);
      }
    },
    restore() {
      for (const { link, href, type } of originals) {
        if (created) {
          link.remove();
          continue;
        }
        setOrRemove(link, "href", href);
        setOrRemove(link, "type", type);
      }
    },
  };
}

function setOrRemove(link: HTMLLinkElement, name: string, value: string | null) {
  if (value === null) {
    link.removeAttribute(name);
  } else {
    link.setAttribute(name, value);
  }
}

/** Loads the first picture that works and cuts a face icon from it. Null when none of them load. */
async function loadFaceIcon(sources: readonly string[], mode: "whole" | "head"): Promise<FaceIcon | null> {
  for (const source of sources) {
    // Going through the app's own image route keeps the picture on this origin, so the canvas can read it.
    const url = `/_next/image?url=${encodeURIComponent(source)}&w=${LOAD_WIDTH}&q=75`;
    const image = await loadImage(url);
    if (!image) {
      continue;
    }
    const canvas = document.createElement("canvas");
    canvas.width = WORK_SIZE;
    canvas.height = WORK_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return null;
    }
    const fit = Math.min(WORK_SIZE / image.naturalWidth, WORK_SIZE / image.naturalHeight);
    const width = image.naturalWidth * fit;
    const height = image.naturalHeight * fit;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, (WORK_SIZE - width) / 2, (WORK_SIZE - height) / 2, width, height);
    const { data } = context.getImageData(0, 0, WORK_SIZE, WORK_SIZE);
    return buildFaceIcon({ data, width: WORK_SIZE, height: WORK_SIZE }, mode);
  }
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}
