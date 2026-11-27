"use client";

import { useEffect, useRef, useState } from "react";
import { loadPokemonSheet, type LoadedSheet } from "@/components/art/load-sprite-sheet";
import {
  drawAtlasFrame,
  pokerogueSpriteEntry,
  POKEROGUE_SPRITE_FPS,
  type AtlasFrame,
} from "@/lib/art/pokerogueSprite";
import { cn } from "@/lib/utils";

const FRAME_MS = 1000 / POKEROGUE_SPRITE_FPS;

/**
 * PokéRogue's front sprite for one Pokémon, playing at the same 10 frames per second.
 * Reduced motion holds the first frame. A missing atlas uses the still picture instead.
 */
export function AnimatedPokemon({
  pokemonId,
  name,
  shiny = false,
  female = false,
  fallbackSrc = null,
  label,
  className,
}: {
  pokemonId: string;
  name: string;
  shiny?: boolean;
  female?: boolean;
  fallbackSrc?: string | null;
  /** Accessible name. Leave it unset when a parent already names the Pokémon. */
  label?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<LoadedSheet | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "fallback">(() =>
    pokerogueSpriteEntry(pokemonId) ? "loading" : "fallback",
  );
  // Bumps on every successful load. A cached sheet can resolve before React
  // paints the loading state, so phase can stay "ready" and would not replay.
  const [paintId, setPaintId] = useState(0);

  useEffect(() => {
    sheetRef.current = null;
    if (!pokerogueSpriteEntry(pokemonId)) {
      setPhase("fallback");
      return;
    }

    setPhase("loading");
    let cancelled = false;
    void loadPokemonSheet(pokemonId, shiny, female).then((loaded) => {
      if (cancelled) {
        return;
      }
      if (!loaded) {
        sheetRef.current = null;
        setPhase("fallback");
        return;
      }
      sheetRef.current = loaded;
      setPhase("ready");
      setPaintId((id) => id + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [pokemonId, shiny, female]);

  useEffect(() => {
    const sheet = sheetRef.current;
    const canvas = canvasRef.current;
    if (phase !== "ready" || !sheet || !canvas || sheet.frames.length === 0) {
      return;
    }

    let frameIndex = 0;
    let timer = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const paint = (frame: AtlasFrame) => {
      if (canvas.width !== sheet.bounds.w) {
        canvas.width = sheet.bounds.w;
      }
      if (canvas.height !== sheet.bounds.h) {
        canvas.height = sheet.bounds.h;
      }
      const context = canvas.getContext("2d");
      const image = sheet.images.get(frame.image);
      if (!context || !image) {
        return;
      }
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawAtlasFrame(context, image, frame);
    };

    const stop = () => {
      if (timer !== 0) {
        window.clearInterval(timer);
        timer = 0;
      }
    };

    const play = () => {
      stop();
      const still = reduce.matches || sheet.frames.length < 2;
      paint(sheet.frames[still ? 0 : frameIndex % sheet.frames.length]);
      if (still) {
        return;
      }
      timer = window.setInterval(() => {
        frameIndex = (frameIndex + 1) % sheet.frames.length;
        paint(sheet.frames[frameIndex]);
      }, FRAME_MS);
    };

    play();
    reduce.addEventListener("change", play);
    return () => {
      stop();
      reduce.removeEventListener("change", play);
    };
  }, [phase, paintId, pokemonId, shiny, female]);

  if (phase === "fallback") {
    if (!fallbackSrc) {
      return (
        <div
          className={cn("flex items-center justify-center text-xl text-muted-foreground", className)}
          aria-hidden="true"
        >
          {name.slice(0, 1)}
        </div>
      );
    }
    return (
      // The still picture is only the stand-in for a missing atlas.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fallbackSrc} alt={label ?? ""} className={cn("object-contain", className)} />
    );
  }

  const spriteKey = pokerogueSpriteEntry(pokemonId)?.key;

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "object-contain [image-rendering:pixelated]",
        phase === "loading" && "animate-pulse bg-muted/40",
        className,
      )}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      aria-busy={phase === "loading" || undefined}
      data-sprite-state={phase}
      data-sprite-key={spriteKey}
    />
  );
}
