"use client";

import { Shuffle } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Each step is on screen this long. Three steps stay under 700ms. */
export const GENERATE_STEP_MS = 220;

export const POKEMON_GENERATE_STEPS = [
  "Scanning Pokédex…",
  "Applying your filters…",
  "Randomizing Pokémon…",
] as const;
export const ABILITY_GENERATE_STEPS = [
  "Scanning abilities…",
  "Applying your filters…",
  "Randomizing abilities…",
] as const;
export const MOVE_GENERATE_STEPS = [
  "Scanning the move list…",
  "Applying your filters…",
  "Randomizing moves…",
] as const;
export const ITEM_GENERATE_STEPS = [
  "Scanning items…",
  "Applying your filters…",
  "Randomizing items…",
] as const;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Shows short, stepped progress text before a generation runs. The roll itself happens at the end
 * of the last step, with the latest `action` closure. Readers who ask for reduced motion skip the
 * steps and get the result at once.
 */
export function useStagedGenerate(steps: readonly string[], action: () => void) {
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const actionRef = useRef(action);
  const busyRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    actionRef.current = action;
  });

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const start = useCallback(() => {
    if (busyRef.current) {
      return;
    }
    if (steps.length === 0 || prefersReducedMotion()) {
      actionRef.current();
      return;
    }
    busyRef.current = true;
    setStepIndex(0);
    let index = 0;
    const advance = () => {
      index += 1;
      if (index < steps.length) {
        setStepIndex(index);
        timerRef.current = window.setTimeout(advance, GENERATE_STEP_MS);
        return;
      }
      busyRef.current = false;
      setStepIndex(null);
      actionRef.current();
    };
    timerRef.current = window.setTimeout(advance, GENERATE_STEP_MS);
  }, [steps]);

  return {
    start,
    busy: stepIndex !== null,
    stepLabel: stepIndex === null ? null : (steps[stepIndex] ?? null),
    stepIndex,
    stepCount: steps.length,
  };
}

/** Live text and step pips. Nothing renders while idle. The pips do not animate. */
export function GenerationStatus({
  label,
  stepIndex,
  stepCount,
  className,
}: {
  label: string | null;
  stepIndex: number | null;
  stepCount: number;
  className?: string;
}) {
  return (
    <p role="status" aria-live="polite" className={cn("flex min-h-5 items-center gap-2 text-sm text-muted-foreground", className)}>
      {label && stepIndex !== null ? (
        <>
          <span aria-hidden="true" className="flex items-center gap-1">
            {Array.from({ length: stepCount }, (_, index) => (
              <span
                key={index}
                className={cn("size-1.5 rounded-full", index <= stepIndex ? "bg-accent-electric" : "bg-border")}
              />
            ))}
          </span>
          <span>{label}</span>
        </>
      ) : null}
    </p>
  );
}

/** Generate button for a results panel: runs the stepped feedback, then `onGenerate`. */
export function GenerateButton({
  label,
  steps,
  onGenerate,
}: {
  label: string;
  steps: readonly string[];
  onGenerate: () => void;
}) {
  const staged = useStagedGenerate(steps, onGenerate);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        type="button"
        size="lg"
        aria-disabled={staged.busy}
        aria-busy={staged.busy}
        className="aria-disabled:opacity-60"
        onClick={staged.start}
      >
        <Shuffle />
        {label}
      </Button>
      <GenerationStatus label={staged.stepLabel} stepIndex={staged.stepIndex} stepCount={staged.stepCount} />
    </div>
  );
}
