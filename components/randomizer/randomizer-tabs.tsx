"use client";

import type { RandomizerTab } from "@/lib/types/randomizer";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<RandomizerTab, string> = {
  pokemon: "Pokémon",
  ability: "Abilities",
  move: "Moves",
  item: "Items",
};

interface RandomizerTabsProps {
  tabs: readonly RandomizerTab[];
  activeTab: RandomizerTab;
  canOpen: (tab: RandomizerTab) => boolean;
  onChange: (tab: RandomizerTab) => void;
}

export function RandomizerTabs({ tabs, activeTab, canOpen, onChange }: RandomizerTabsProps) {
  const disabledReasonId = "randomizer-tab-disabled-reason";
  const anyDisabled = tabs.some((tab) => !canOpen(tab));

  return (
    <div className="space-y-2">
      <div
        role="tablist"
        aria-label="Randomizer steps"
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1"
      >
        {tabs.map((tab) => {
          const selected = tab === activeTab;
          const disabled = !canOpen(tab);

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`randomizer-tab-${tab}`}
              aria-controls={`randomizer-panel-${tab}`}
              aria-selected={selected}
              disabled={disabled}
              title={disabled ? "Select a Pokémon first" : undefined}
              aria-describedby={disabled ? disabledReasonId : undefined}
              className={cn(
                "min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-10",
                selected
                  ? "bg-background font-semibold text-foreground shadow-sm ring-1 ring-foreground/20"
                  : "text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50 hover:text-muted-foreground",
              )}
              onClick={() => onChange(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>
      {anyDisabled ? (
        <p id={disabledReasonId} className="sr-only">
          Select a Pokémon first
        </p>
      ) : null}
    </div>
  );
}
