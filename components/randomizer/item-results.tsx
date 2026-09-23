"use client";

import { Shuffle } from "lucide-react";
import { RerollButton } from "@/components/randomizer/reroll-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NONE_ITEM_ID } from "@/lib/randomizer/items";
import { ITEM_CATEGORY_LABELS, type Item } from "@/lib/types/catalog-entities";
import { cn } from "@/lib/utils";

interface ItemResultsProps {
  items: readonly Item[];
  selectedItemId?: string | null;
  selectable: boolean;
  errorMessage: string | null;
  onGenerate: () => void;
  onSelect: (itemId: string | null) => void;
  onReroll: (itemId: string) => void;
}

export function ItemResults({
  items,
  selectedItemId,
  selectable,
  errorMessage,
  onGenerate,
  onSelect,
  onReroll,
}: ItemResultsProps) {
  const noneSelected = selectable && selectedItemId === NONE_ITEM_ID;

  return (
    <section id="items" aria-label="Item results" className="space-y-4">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}
      <Button type="button" size="lg" onClick={onGenerate}>
        <Shuffle />
        Generate items
      </Button>
      {items.length > 0 ? (
        <ul
          aria-label="Generated items"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {selectable ? (
            <li>
              <Card
                className={cn(
                  "h-full",
                  noneSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <button
                  type="button"
                  className="flex h-full w-full flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-pressed={noneSelected}
                  onClick={() => onSelect(NONE_ITEM_ID)}
                >
                  <CardHeader>
                    <CardTitle>
                      <h3 className="contents">None</h3>
                    </CardTitle>
                    {noneSelected ? (
                      <p className="text-sm font-medium text-primary">Selected</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click to select</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Hold no item.
                    </p>
                  </CardContent>
                </button>
              </Card>
            </li>
          ) : null}
          {items.map((item) => {
            const selected = selectable && item.id === selectedItemId;

            return (
              <li key={item.id}>
                <Card
                  className={cn(
                    "flex h-full flex-col",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {selectable ? (
                    <button
                      type="button"
                      className="flex w-full flex-1 flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-pressed={selected}
                      onClick={() => onSelect(item.id)}
                    >
                      <ItemCardBody item={item} selected={selected} selectable />
                    </button>
                  ) : (
                    <ItemCardBody item={item} selected={false} selectable={false} />
                  )}
                  <RerollButton name={item.name} onClick={() => onReroll(item.id)} />
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function ItemCardBody({
  item,
  selected,
  selectable,
}: {
  item: Item;
  selected: boolean;
  selectable: boolean;
}) {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h3 className="contents">{item.name}</h3>
        </CardTitle>
        {selectable ? (
          selected ? (
            <p className="text-sm font-medium text-primary">Selected</p>
          ) : (
            <p className="text-sm text-muted-foreground">Click to select</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">In this pool</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{ITEM_CATEGORY_LABELS[item.category]}</p>
        {item.description ? (
          <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
        ) : null}
      </CardContent>
    </>
  );
}
