"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CommandPalette, type PaletteSection } from "@/components/builder/command-palette";
import { ItemIcon } from "@/components/items/item-icon";
import { noneMatchesItemQuery, searchItemSections } from "@/lib/builder/itemSearch";
import { moveNameMatchSpan } from "@/lib/builder/moveSearch";
import { ITEM_CATEGORY_LABELS, type Item } from "@/lib/types/catalog-entities";

const SECTION_LABELS: Record<keyof typeof ITEM_CATEGORY_LABELS, string> = {
  popular: "Popular items",
  items: "Items",
  "pokemon-specific": "Pokémon-specific items",
  "usually-useless": "Usually useless items",
  useless: "Useless items",
};

const NONE_OPTION_ID = "__none__";

/** Held item chooser. The chosen item and its effect stay visible; the palette searches the list. */
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const chosen = typeof selectedId === "string" ? itemsById.get(selectedId) : undefined;

  function close() {
    setOpen(false);
    setQuery("");
  }

  const sections: PaletteSection[] = [];
  if (open) {
    const pool = poolIds.flatMap((id) => {
      if (!id) return [];
      const item = itemsById.get(id);
      return item ? [item] : [];
    });
    if (noneMatchesItemQuery(query)) {
      sections.push({
        id: "none",
        options: [
          {
            id: NONE_OPTION_ID,
            label: "None",
            selected: selectedId === null,
            content: (
              <div className="flex items-start gap-2">
                <ItemIcon iconUrl={null} none />
                <span className="w-36 shrink-0 font-medium leading-6">None</span>
                <span className="text-muted-foreground">The Pokémon holds nothing.</span>
              </div>
            ),
          },
        ],
      });
    }
    for (const section of searchItemSections(pool, query)) {
      sections.push({
        id: section.category,
        label: SECTION_LABELS[section.category],
        options: section.items.map((item) => ({
          id: item.id,
          label: item.name,
          selected: item.id === selectedId,
          content: (
            <div className="flex items-start gap-2">
              <ItemIcon iconUrl={item.iconUrl} />
              <HighlightedName name={item.name} query={query} />
              <span className="text-muted-foreground">{item.description}</span>
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
        aria-haspopup="dialog"
        aria-label={`Held item: ${selectedId === null ? "None" : (chosen?.name ?? "not chosen")}`}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => setOpen(true)}
      >
        <ItemIcon iconUrl={chosen?.iconUrl} none={!chosen} />
        <span className="min-w-0 flex-1 truncate font-medium">
          {selectedId === null ? "None" : (chosen?.name ?? <span className="text-muted-foreground">Choose an item</span>)}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {selectedId === null ? (
        <p className="text-sm text-muted-foreground">The Pokémon holds nothing.</p>
      ) : chosen ? (
        <p className="text-sm text-muted-foreground">{chosen.description}</p>
      ) : null}

      <CommandPalette
        open={open}
        onClose={close}
        title="Choose a held item"
        searchLabel="Search items"
        listLabel="Held items"
        query={query}
        onQueryChange={setQuery}
        sections={sections}
        emptyText="No items match that search."
        onSelect={(optionId) => {
          onSelect(optionId === NONE_OPTION_ID ? null : optionId);
          close();
        }}
      />
    </div>
  );
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const span = moveNameMatchSpan(name, query);
  if (!span) {
    return <span className="w-36 shrink-0 font-medium leading-6">{name}</span>;
  }
  return (
    <span className="w-36 shrink-0 font-medium leading-6">
      {name.slice(0, span.start)}
      <span className="font-bold text-primary">{name.slice(span.start, span.end)}</span>
      {name.slice(span.end)}
    </span>
  );
}
