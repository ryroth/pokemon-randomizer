"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CommandPalette, type PaletteSection } from "@/components/builder/command-palette";
import { groupAbilityChoices } from "@/lib/builder/abilities";
import { searchAbilitiesByName } from "@/lib/builder/abilitySearch";
import type { Ability } from "@/lib/types/catalog-entities";
import { cn } from "@/lib/utils";

/** Ability chooser. The trigger shows the choice and its effect; the palette searches the pool. */
export function AbilityDropdown({
  abilities,
  poolIds,
  hiddenId,
  selectedId,
  onSelect,
}: {
  abilities: readonly Ability[];
  poolIds: readonly string[];
  hiddenId: string | null;
  selectedId: string | undefined;
  onSelect: (abilityId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const abilitiesById = new Map(abilities.map((ability) => [ability.id, ability]));
  const chosen = selectedId ? abilitiesById.get(selectedId) : undefined;

  function close() {
    setOpen(false);
    setQuery("");
  }

  const sections: PaletteSection[] = [];
  if (open) {
    for (const section of groupAbilityChoices(poolIds, hiddenId)) {
      const known = section.abilityIds.flatMap((id) => {
        const ability = abilitiesById.get(id);
        return ability ? [ability] : [];
      });
      const matches = searchAbilitiesByName(known, query);
      if (matches.length === 0) {
        continue;
      }
      sections.push({
        id: section.id,
        label: section.label,
        options: matches.map((ability) => ({
          id: ability.id,
          label: ability.name,
          selected: ability.id === selectedId,
          content: (
            <div className="space-y-0.5">
              <p className="font-medium">{ability.name}</p>
              {ability.description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">{ability.description}</p>
              ) : null}
            </div>
          ),
        })),
      });
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-label={`Ability: ${chosen?.name ?? "not chosen"}`}
        aria-haspopup="dialog"
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => setOpen(true)}
      >
        <span className={cn("truncate", chosen ? "text-foreground" : "text-muted-foreground")}>
          {chosen?.name ?? "Choose an ability"}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {chosen?.description ? <p className="text-sm text-muted-foreground">{chosen.description}</p> : null}

      <CommandPalette
        open={open}
        onClose={close}
        title="Choose an ability"
        searchLabel="Search abilities"
        listLabel="Abilities"
        query={query}
        onQueryChange={setQuery}
        sections={sections}
        emptyText="No abilities match that search."
        onSelect={(abilityId) => {
          onSelect(abilityId);
          close();
        }}
      />
    </div>
  );
}
