"use client";

import { Minus, Plus } from "lucide-react";
import {
  FilterDropdown,
  FilterToolbar,
  ToggleChip,
  toggleFilterValue,
} from "@/components/randomizer/filter-dropdown";
import { describeItemCategoryFilter } from "@/components/randomizer/item-filter-summary";
import { Button } from "@/components/ui/button";
import { MAX_ITEM_COUNT, MIN_ITEM_COUNT } from "@/lib/randomizer/defaults";
import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
} from "@/lib/types/catalog-entities";
import type { RandomizerConfig } from "@/lib/types/randomizer";

interface ItemConfigFormProps {
  config: RandomizerConfig;
  poolSize: number;
  beforePokemon: boolean;
  onChange: (config: RandomizerConfig) => void;
}

export function ItemConfigForm({
  config,
  poolSize,
  beforePokemon,
  onChange,
}: ItemConfigFormProps) {
  const needsMoreItems = beforePokemon && config.itemCount < config.pokemonCount;

  return (
    <div className="space-y-6">
      <FilterDropdown
        label="Item categories"
        summary={describeItemCategoryFilter(config)}
        description="Generated items come only from the Pokémon Showdown teambuilder groups you leave selected. You can keep all five or narrow the pool."
      >
        <FilterToolbar
          legend="item categories"
          onSelectAll={() => onChange({ ...config, itemCategories: [...ITEM_CATEGORIES] })}
          onClear={() => onChange({ ...config, itemCategories: [] })}
        />
        <div className="flex flex-wrap gap-2">
          {ITEM_CATEGORIES.map((category) => (
            <ToggleChip
              key={category}
              label={ITEM_CATEGORY_LABELS[category]}
              checked={config.itemCategories.includes(category)}
              onChange={() =>
                onChange({
                  ...config,
                  itemCategories: toggleFilterValue(config.itemCategories, category),
                })
              }
            />
          ))}
        </div>
      </FilterDropdown>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Number of items</legend>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease item count"
            disabled={config.itemCount <= MIN_ITEM_COUNT}
            onClick={() =>
              onChange({
                ...config,
                itemCount: Math.max(MIN_ITEM_COUNT, config.itemCount - 1),
              })
            }
          >
            <Minus />
          </Button>
          <input
            id="item-count"
            type="number"
            inputMode="numeric"
            min={MIN_ITEM_COUNT}
            max={MAX_ITEM_COUNT}
            value={config.itemCount}
            aria-label="Item count"
            aria-describedby="item-count-help"
            className="h-8 w-16 rounded-lg border border-input bg-background text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => {
              const next = Number(event.target.value);
              onChange({ ...config, itemCount: Number.isFinite(next) ? next : 0 });
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase item count"
            disabled={config.itemCount >= MAX_ITEM_COUNT}
            onClick={() =>
              onChange({
                ...config,
                itemCount: Math.min(MAX_ITEM_COUNT, config.itemCount + 1),
              })
            }
          >
            <Plus />
          </Button>
        </div>
        <p id="item-count-help" className="text-sm text-muted-foreground">
          {beforePokemon
            ? `Generate ${MIN_ITEM_COUNT}–${MAX_ITEM_COUNT} unique held items from the selected Showdown categories, default 3. After you generate Pokémon, you will apply each item to a Pokémon you choose. None is always a choice.`
            : `Generate ${MIN_ITEM_COUNT}–${MAX_ITEM_COUNT} unique held items from the selected Showdown categories, default 3, then pick one for the Pokémon you will use in battle, or choose None.`}
        </p>
        {needsMoreItems ? (
          <p role="status" className="text-sm text-muted-foreground">
            You are generating {config.pokemonCount} Pokémon. Extra leftover items can stay unused.
          </p>
        ) : null}
        <p aria-live="polite" className="text-sm">
          {poolSize} {poolSize === 1 ? "item matches" : "items match"} these filters. None is
          always a choice.
        </p>
      </fieldset>
    </div>
  );
}
