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
  return (
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
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "bg-background text-foreground shadow-sm"
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
  );
}
