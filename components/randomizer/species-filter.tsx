"use client";

import { useId, useState } from "react";
import { POKEDEX_SPECIES } from "@/lib/data/genera";
import { Button } from "@/components/ui/button";

const SUGGESTION_LIMIT = 8;

/**
 * Pick one official species line, such as Mouse Pokémon. Typing only narrows the list.
 * The pool changes when a species is chosen.
 */
export function SpeciesFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (species: string) => void;
}) {
  const listId = useId();
  const [draft, setDraft] = useState(value);
  const [trackedValue, setTrackedValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  if (trackedValue !== value) {
    setTrackedValue(value);
    setDraft(value);
  }

  const needle = draft.trim().toLowerCase();
  const options = needle
    ? POKEDEX_SPECIES.filter((species) => species.toLowerCase().includes(needle)).slice(0, SUGGESTION_LIMIT)
    : [];

  function choose(species: string) {
    onChange(species);
    setDraft(species);
    setOpen(false);
  }

  function commitDraft() {
    const exact = POKEDEX_SPECIES.find((species) => species.toLowerCase() === needle);
    if (exact) {
      choose(exact);
      return;
    }
    setDraft(value);
    setOpen(false);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Species</legend>
      <p className="text-sm text-muted-foreground">
        The line under the name in the Pokédex, such as Mouse Pokémon. Start typing and pick one.
        Leave this blank for any species.
      </p>
      <div className="flex flex-wrap items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            role="combobox"
            aria-label="Species"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder="Mouse Pokémon"
            value={draft}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => {
              setDraft(event.target.value);
              setOpen(true);
              setActive(0);
              if (event.target.value.trim() === "") {
                onChange("");
              }
            }}
            onFocus={() => {
              if (needle) {
                setOpen(true);
              }
            }}
            onBlur={() => {
              commitDraft();
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setActive((index) => Math.min(index + 1, Math.max(options.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const species = options[active];
                if (species) {
                  choose(species);
                }
              } else if (event.key === "Escape") {
                setDraft(value);
                setOpen(false);
              }
            }}
          />
          {open && needle ? (
            <ul
              id={listId}
              role="listbox"
              aria-label="Species"
              className="mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-background py-1"
            >
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No species matches that.</li>
              ) : (
                options.map((species, index) => (
                  <li key={species} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      className="flex min-h-9 w-full items-center px-3 text-left text-sm hover:bg-muted aria-selected:bg-muted"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        choose(species);
                      }}
                    >
                      {species}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => choose("")}>
            Clear species
          </Button>
        ) : null}
      </div>
    </fieldset>
  );
}
