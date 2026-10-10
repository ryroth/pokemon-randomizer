"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import "@google/model-viewer";
import "@/components/recap/model-viewer-jsx";
import { preferredIdleAnimation } from "@/lib/recap/animation";
import { colorSlotsFromGlb, imageNameForMaterial, pairShinyColors } from "@/lib/recap/shinyColors";

export type IdleMotion = "playing" | "paused" | "still";

export function PokemonIdleModel({
  src,
  name,
  onUnavailable,
  onMotion,
  shinySrc = null,
  statusClassName = "text-sm text-white/80",
}: {
  src: string;
  name: string;
  onUnavailable: () => void;
  onMotion: (motion: IdleMotion) => void;
  /** Shiny GLB used only as a texture source. The viewer keeps `src` so the idle clip stays the regular one. */
  shinySrc?: string | null;
  statusClassName?: string;
}) {
  const [phase, setPhase] = useState<"loading" | IdleMotion>("loading");
  const [shownSrc, setShownSrc] = useState(src);
  const onUnavailableRef = useRef(onUnavailable);
  const onMotionRef = useRef(onMotion);
  const shinySrcRef = useRef(shinySrc);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const paintAbortRef = useRef<AbortController | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  if (shownSrc !== src) {
    setShownSrc(src);
    setPhase("loading");
  }

  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
    onMotionRef.current = onMotion;
    shinySrcRef.current = shinySrc;
  }, [onUnavailable, onMotion, shinySrc]);

  useEffect(() => {
    const element = viewerRef.current;
    if (!element?.loaded) {
      return;
    }
    void paintShiny(element, shinySrcRef.current, paintAbortRef);
  }, [shinySrc]);

  const bindViewer = useCallback((element: ModelViewerElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    paintAbortRef.current?.abort();
    paintAbortRef.current = null;
    viewerRef.current = element;
    if (!element) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const playIdle = () => {
      const clips = element.availableAnimations;
      const idle = preferredIdleAnimation(clips);
      if (!idle) {
        // A model with no animation at all would stand in its bind pose, often a T-pose.
        // The artwork looks better than that, so hand over to the artwork instead.
        paintAbortRef.current?.abort();
        onUnavailableRef.current();
        return;
      }
      element.animationName = idle;

      const startPlaying = () => {
        if (reduceMotion) {
          element.removeAttribute("autoplay");
          element.pause();
          setPhase("paused");
          onMotionRef.current("paused");
          return;
        }
        setPhase("playing");
        onMotionRef.current("playing");
      };

      const shinyUrl = shinySrcRef.current;
      if (!shinyUrl) {
        paintShiny(element, null, paintAbortRef);
        startPlaying();
        return;
      }
      // A shiny Pokémon must not appear in regular colors. The model stays hidden until the shiny
      // textures are on, and if they cannot be applied the page falls back to the shiny picture.
      void paintShiny(element, shinyUrl, paintAbortRef).then((outcome) => {
        if (outcome === "painted") {
          startPlaying();
        } else if (outcome === "failed") {
          onUnavailableRef.current();
        }
      });
    };

    const onError = () => {
      paintAbortRef.current?.abort();
      onUnavailableRef.current();
    };

    element.addEventListener("load", playIdle);
    element.addEventListener("error", onError);
    cleanupRef.current = () => {
      element.removeEventListener("load", playIdle);
      element.removeEventListener("error", onError);
    };

    if (element.loaded) {
      playIdle();
    }
  }, []);

  const status =
    phase === "loading"
      ? `Loading the 3D model of ${name}…`
      : phase === "playing"
        ? `${name} is playing its idle animation.`
        : phase === "paused"
          ? `${name} 3D model. The idle animation is paused.`
          : `${name} 3D model.`;

  return (
    <>
      <p role="status" className={phase === "loading" ? statusClassName : "sr-only"}>
        {status}
      </p>
      <model-viewer
        ref={bindViewer}
        src={src}
        alt=""
        autoplay
        camera-controls
        disable-pan
        interaction-prompt="none"
        environment-image="neutral"
        shadow-intensity="0.85"
        exposure="1.05"
        className="h-full w-full bg-transparent"
        style={{ touchAction: "pan-y", opacity: shinySrc && phase === "loading" ? 0 : 1 }}
      />
    </>
  );
}

/** "painted": shiny textures are on. "failed": they could not be applied. "aborted": a newer request replaced this one. */
type PaintOutcome = "painted" | "failed" | "aborted" | "none";

async function paintShiny(
  element: ModelViewerElement,
  shinyUrl: string | null,
  paintAbortRef: { current: AbortController | null },
): Promise<PaintOutcome> {
  paintAbortRef.current?.abort();
  if (!shinyUrl || shinyUrl === element.src) {
    paintAbortRef.current = null;
    return "none";
  }
  const controller = new AbortController();
  paintAbortRef.current = controller;
  return applyShinyColors(element, shinyUrl, controller.signal);
}

async function applyShinyColors(
  element: ModelViewerElement,
  shinyUrl: string,
  signal: AbortSignal,
): Promise<PaintOutcome> {
  const failed = (): PaintOutcome => (signal.aborted ? "aborted" : "failed");
  try {
    const response = await fetch(shinyUrl, { signal });
    if (!response.ok || signal.aborted) {
      return failed();
    }
    const shinySlots = colorSlotsFromGlb(await response.arrayBuffer());
    const materials = (element.model?.materials ?? []).filter(
      (material) => material.name.length > 0 && material.pbrMetallicRoughness.baseColorTexture,
    );
    const paints = pairShinyColors(
      materials.map((material) => ({
        materialName: material.name,
        imageName: imageNameForMaterial(element.originalGltfJson, material.index),
      })),
      shinySlots,
    );
    if (!paints || signal.aborted) {
      return failed();
    }
    const ready: { materialName: string; texture: NonNullable<Awaited<ReturnType<ModelViewerElement["createTexture"]>>> }[] =
      [];
    for (const paint of paints) {
      if (signal.aborted) {
        return "aborted";
      }
      const bytes = new Uint8Array(paint.bytes.byteLength);
      bytes.set(paint.bytes);
      const url = URL.createObjectURL(new Blob([bytes], { type: paint.mimeType }));
      try {
        const texture = await element.createTexture(url, paint.mimeType);
        if (!texture) {
          return failed();
        }
        ready.push({ materialName: paint.materialName, texture });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (signal.aborted) {
      return "aborted";
    }
    for (const paint of ready) {
      element.model?.materials
        .find((material) => material.name === paint.materialName)
        ?.pbrMetallicRoughness.baseColorTexture?.setTexture(paint.texture);
    }
    return "painted";
  } catch {
    // The caller falls back to the shiny picture, so a shiny Pokémon is never shown in regular colors.
    return failed();
  }
}
