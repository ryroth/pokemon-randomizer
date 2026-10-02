"use client";

import { useState } from "react";
import { noneMatchesItemQuery, searchItemSections } from "@/lib/builder/itemSearch";
import { moveNameMatchSpan } from "@/lib/builder/moveSearch";
import { ITEM_CATEGORY_LABELS, type Item } from "@/lib/types/catalog-entities";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<keyof typeof ITEM_CATEGORY_LABELS, string> = {
  popular: "Popular items",
  items: "Items",
  "pokemon-specific": "Pokémon-specific items",
  "usually-useless": "Usually useless items",
  useless: "Useless items",
};

export function ItemPicker({
  items,
  poolIds,
  selectedId,
  onSelect,
}: {
  items: readonly Item[];
  poolIds: readonly (string | null)[];
  selectedId: string | null | undefined;
  onSelect: (itemId: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const pool = poolIds.flatMap((id) => {
    if (!id) return [];
    const item = itemsById.get(id);
    return item ? [item] : [];
  });
  const sections = searchItemSections(pool, query);
  const showNone = noneMatchesItemQuery(query);

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5 text-sm font-medium">
        Search items
        <input
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="overflow-hidden rounded-lg border border-border">
        <ul aria-label="Held items" className="max-h-96 overflow-y-auto">
          {showNone ? (
            <li className="border-b border-border">
              <button
                type="button"
                aria-label="None"
                aria-pressed={selectedId === null}
                className={cn(
                  "flex w-full items-center gap-2 px-2 py-1.5 text-left outline-none hover:bg-muted/70 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  selectedId === null && "bg-primary/15 text-foreground",
                )}
                onClick={() => onSelect(null)}
              >
                <ItemIcon slug={null} />
                <span className="w-40 shrink-0 font-medium leading-6">None</span>
                <span className="text-sm text-muted-foreground">The Pokémon holds nothing.</span>
              </button>
            </li>
          ) : null}
          {sections.map((section) => (
            <li key={section.category}>
              <h3 className="sticky top-0 border-b border-border bg-muted px-2 py-1 text-sm font-semibold">
                {SECTION_LABELS[section.category]}
              </h3>
              <ul>
                {section.items.map((item) => {
                  const selected = item.id === selectedId;
                  return (
                    <li key={item.id} className="border-b border-border/70 last:border-b-0">
                      <button
                        type="button"
                        aria-label={item.name}
                        aria-pressed={selected}
                        className={cn(
                          "flex w-full items-start gap-2 px-2 py-1.5 text-left outline-none hover:bg-muted/70 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                          selected && "bg-primary/15 text-foreground",
                        )}
                        onClick={() => onSelect(item.id)}
                      >
                        <ItemIcon slug={item.pokeApiSlug} />
                        <HighlightedName name={item.name} query={query} />
                        <span className={cn("text-sm", selected ? "text-foreground" : "text-muted-foreground")}>
                          {item.description}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          {!showNone && sections.length === 0 ? (
            <li className="px-2 py-3 text-sm text-muted-foreground">No items match that search.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function ItemIcon({ slug }: { slug: string | null }) {
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm bg-white" aria-hidden="true">
      {slug ? (
        // Official item artwork. The catalog stores the slug, not a sprite URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`}
          alt=""
          width={24}
          height={24}
          className="size-6 object-contain"
        />
      ) : null}
    </span>
  );
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const span = moveNameMatchSpan(name, query);
  if (!span) {
    return <span className="w-40 shrink-0 font-medium leading-6">{name}</span>;
  }
  return (
    <span className="w-40 shrink-0 font-medium leading-6">
      {name.slice(0, span.start)}
      <span className="font-bold text-primary">{name.slice(span.start, span.end)}</span>
      {name.slice(span.end)}
    </span>
  );
}
