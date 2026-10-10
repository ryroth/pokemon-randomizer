"use client";

import { useEffect, useState, type AnimationEvent, type ReactNode } from "react";
import { BALL_LABELS, type BallKind } from "@/lib/randomizer/ball";
import { cn } from "@/lib/utils";

const OUTLINE = "#1a1a1a";
const CREAM = "#f5f5f5";

/** Colors per ball. Every ball also differs in its markings, so none depends on color alone. */
const TOPS: Record<BallKind, string> = {
  poke: "#e53935",
  great: "#2563c9",
  ultra: "#2a2a30",
  master: "#7b3fb4",
  luxury: "#1c1c20",
};
const BOTTOMS: Record<BallKind, string> = {
  poke: CREAM,
  great: CREAM,
  ultra: CREAM,
  master: CREAM,
  luxury: "#8a1c2b",
};

/** A flat drawing of one ball. Decorative; pair it with a text label where the ball matters. */
export function PokeballIcon({ kind, className }: { kind: BallKind; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d="M4 50a46 46 0 0 1 92 0Z" fill={TOPS[kind]} />
      <path d="M4 50a46 46 0 0 0 92 0Z" fill={BOTTOMS[kind]} />
      {kind === "great" ? (
        <>
          <path d="M14 34 25 21 40 38 24 46Z" fill="#e53935" />
          <path d="M86 34 75 21 60 38 76 46Z" fill="#e53935" />
        </>
      ) : null}
      {kind === "ultra" ? (
        <>
          <path d="M18 36 30 18 40 24 28 42Z" fill="#fdd835" />
          <path d="M82 36 70 18 60 24 72 42Z" fill="#fdd835" />
          <path d="M44 12h12v10H44Z" fill="#fdd835" />
        </>
      ) : null}
      {kind === "master" ? (
        <>
          <circle cx="24" cy="34" r="9" fill="#ec4899" />
          <circle cx="76" cy="34" r="9" fill="#ec4899" />
          <path d="M39 38V20l11 12 11-12v18" fill="none" stroke="#ec4899" strokeWidth="5" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === "luxury" ? (
        <>
          <path d="M12 38A40 40 0 0 1 88 38" fill="none" stroke="#e0a82e" strokeWidth="5" strokeLinecap="round" />
          <path d="M24 26A34 34 0 0 1 76 26" fill="none" stroke="#e0a82e" strokeWidth="3" strokeLinecap="round" />
          <path d="M4 58h92" stroke="#e0a82e" strokeWidth="4" />
        </>
      ) : null}
      <circle cx="50" cy="50" r="46" fill="none" stroke={OUTLINE} strokeWidth="5" />
      <path d="M4 50h30M66 50h30" stroke={OUTLINE} strokeWidth="6" />
      <circle cx="50" cy="50" r="14" fill={CREAM} stroke={OUTLINE} strokeWidth="6" />
      <circle cx="50" cy="50" r="6" fill={kind === "luxury" ? "#e0a82e" : "#d4d4d8"} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="30" cy="26" rx="10" ry="6" fill="#fff" opacity="0.28" transform="rotate(-35 30 26)" />
    </svg>
  );
}

/** A small ball with its name for readers who cannot see the drawing. */
export function BallBadge({ kind, className }: { kind: BallKind; className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)} title={BALL_LABELS[kind]}>
      <PokeballIcon kind={kind} className="size-4" />
      <span className="sr-only">{BALL_LABELS[kind]}</span>
    </span>
  );
}

/** Time before the card appears. The ball keyframes in globals.css are timed to end here. */
export const BALL_RELEASE_MS = 1550;
/** Time the card's own reveal takes. */
export const BALL_REVEAL_MS = 450;
/** Extra delay per card, so a row of cards opens one after another. */
export const BALL_STAGGER_MS = 70;

/** Reveals that already played in this page session. */
const playedKeys = new Set<string>();

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Holds a card back while a ball drops, wiggles like a catch, and opens to release it. The card
 * is inert until it has appeared. People who ask for reduced motion see the card at once.
 */
export function PokeballReveal({
  kind,
  playKey,
  index = 0,
  children,
}: {
  kind: BallKind;
  /** Names one reveal. Each key plays once, so coming back to a card does not replay it. */
  playKey?: string;
  /** Position in the row. Later cards start a little after earlier ones. */
  index?: number;
  children: ReactNode;
}) {
  const [playing, setPlaying] = useState(
    () => playKey !== undefined && !playedKeys.has(playKey) && !prefersReducedMotion(),
  );
  const delay = index * BALL_STAGGER_MS;

  useEffect(() => {
    if (playKey !== undefined) {
      playedKeys.add(playKey);
    }
  }, [playKey]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    // Backup for browsers that skip animation events, such as a hidden tab.
    const timer = window.setTimeout(
      () => setPlaying(false),
      delay + BALL_RELEASE_MS + BALL_REVEAL_MS + 400,
    );
    return () => window.clearTimeout(timer);
  }, [delay, playing]);

  function finish(event: AnimationEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && event.animationName === "card-release") {
      setPlaying(false);
    }
  }

  // The children keep one place in the tree, so the card is not rebuilt when the ball goes away.
  return (
    <div className="relative h-full" data-pokeball-reveal={playing ? kind : undefined}>
      <div
        inert={playing}
        className={cn("h-full", playing && "ball-card")}
        style={playing ? { animationDelay: `${delay + BALL_RELEASE_MS}ms` } : undefined}
        onAnimationEnd={playing ? finish : undefined}
      >
        {children}
      </div>
      {playing ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <div className="ball-flight" style={{ animationDelay: `${delay}ms` }}>
            <div className="ball-wiggle" style={{ animationDelay: `${delay + 350}ms` }}>
              <PokeballIcon kind={kind} className="size-20 drop-shadow-lg" />
            </div>
          </div>
          <span className="ball-flash" style={{ animationDelay: `${delay + BALL_RELEASE_MS - 120}ms` }} />
        </div>
      ) : null}
    </div>
  );
}
