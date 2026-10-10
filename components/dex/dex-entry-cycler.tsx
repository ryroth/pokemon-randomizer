"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useDexEntries } from "@/components/dex/use-dex-entries";
import { formatDexVersions } from "@/lib/data/dexVersions";
import { cn } from "@/lib/utils";

type Variant = "card" | "recap";

const STYLES: Record<
  Variant,
  { label: string; text: string; step: string; chip: string; chipActive: string }
> = {
  card: {
    label: "text-muted-foreground",
    text: "text-muted-foreground",
    step: "border-input bg-background text-foreground hover:bg-muted",
    chip: "border-border bg-background text-muted-foreground hover:text-foreground",
    chipActive: "border-foreground bg-foreground text-background",
  },
  recap: {
    label: "text-[#b7d4ff]",
    text: "text-[#e7f1ff]",
    step: "border-white/40 bg-white/10 text-white hover:bg-white/20",
    chip: "border-white/30 bg-transparent text-[#d6e6ff] hover:bg-white/10",
    chipActive: "border-[#f2c14e] bg-[#f2c14e] text-[#2a1608]",
  },
};

/**
 * Pokédex text with a stepper. Every generation's words are available: Previous and Next walk
 * from the newest game back through the oldest, and the generation buttons jump straight to one.
 * It starts on the newest text, which is also the `fallbackText` shown while loading.
 */
export function DexEntryCycler({
  speciesId,
  name,
  fallbackText,
  variant = "card",
  className,
}: {
  speciesId: string;
  name: string;
  fallbackText: string | null;
  variant?: Variant;
  className?: string;
}) {
  const dex = useDexEntries(speciesId);
  const [picked, setPicked] = useState<number | null>(null);
  const styles = STYLES[variant];

  if (dex.status !== "ready" || dex.entries.length < 2) {
    const only = dex.status === "ready" ? dex.entries[0] : undefined;
    const text = only?.text ?? fallbackText;
    if (!text) {
      return null;
    }
    return (
      <div className={cn("space-y-1", className)}>
        {only ? (
          <p className={cn("text-xs font-medium", styles.label)}>
            Gen {only.generation} · {formatDexVersions(only.versions)}
          </p>
        ) : null}
        <p className={cn("text-sm leading-6", styles.text)}>{text}</p>
      </div>
    );
  }

  const { entries } = dex;
  const index = Math.min(picked ?? entries.length - 1, entries.length - 1);
  const entry = entries[index];
  const generations = [...new Set(entries.map((candidate) => candidate.generation))];
  const stepClass = cn(
    "inline-flex size-8 shrink-0 items-center justify-center rounded-full border outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
    styles.step,
  );

  return (
    <div role="group" aria-label={`Pokédex entries for ${name}`} className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className={stepClass}
          aria-label={`Older Pokédex entry for ${name}`}
          onClick={() => setPicked((index - 1 + entries.length) % entries.length)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <p className={cn("min-w-0 flex-1 text-center text-xs font-medium", styles.label)}>
          Gen {entry.generation} · {formatDexVersions(entry.versions)}
          <span className="font-mono tabular-nums">
            {" "}
            · {index + 1}/{entries.length}
          </span>
        </p>
        <button
          type="button"
          className={stepClass}
          aria-label={`Newer Pokédex entry for ${name}`}
          onClick={() => setPicked((index + 1) % entries.length)}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <p aria-live="polite" className={cn("text-sm leading-6", styles.text)}>
        {entry.text}
      </p>
      <div role="group" aria-label="Jump to a generation" className="flex flex-wrap items-center gap-1">
        <span aria-hidden="true" className={cn("pr-0.5 text-[11px] font-medium uppercase", styles.label)}>
          Gen
        </span>
        {generations.map((generation) => {
          const active = generation === entry.generation;
          return (
            <button
              key={generation}
              type="button"
              aria-pressed={active}
              aria-label={`Generation ${generation} entry`}
              className={cn(
                "inline-flex min-h-6 min-w-8 items-center justify-center rounded-full border px-2 font-mono text-[11px] font-semibold tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
                active ? styles.chipActive : styles.chip,
              )}
              onClick={() => setPicked(entries.findIndex((candidate) => candidate.generation === generation))}
            >
              {generation}
            </button>
          );
        })}
      </div>
    </div>
  );
}
