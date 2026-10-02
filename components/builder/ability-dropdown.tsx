"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { groupAbilityChoices } from "@/lib/builder/abilities";
import type { Ability } from "@/lib/types/catalog-entities";
import { cn } from "@/lib/utils";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const abilitiesById = new Map(abilities.map((ability) => [ability.id, ability]));
  const sections = groupAbilityChoices(poolIds, hiddenId);
  const selectedName = selectedId ? (abilitiesById.get(selectedId)?.name ?? selectedId) : "Choose an ability";

  useEffect(() => {
    if (!open) {
      return;
    }
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-label="Ability"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn("truncate", selectedId ? "text-foreground" : "text-muted-foreground")}>{selectedName}</span>
        <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground", open && "rotate-180")} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Abilities"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-md"
        >
          {sections.map((section) => (
            <li key={section.id} role="presentation">
              <div className="sticky top-0 border-b border-border bg-muted px-2 py-1 text-sm font-semibold">
                {section.label}
              </div>
              <ul role="group" aria-label={section.label}>
                {section.abilityIds.map((id) => {
                  const name = abilitiesById.get(id)?.name ?? id;
                  const selected = id === selectedId;
                  return (
                    <li key={id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={cn(
                          "flex w-full px-2 py-1.5 text-left text-sm outline-none hover:bg-muted/70 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                          selected && "bg-primary/15 text-foreground",
                        )}
                        onClick={() => {
                          onSelect(id);
                          setOpen(false);
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
