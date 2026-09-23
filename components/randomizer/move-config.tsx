"use client";

import { Minus, Plus } from "lucide-react";
import {
  FilterDropdown,
  FilterToolbar,
  ToggleChip,
  toggleFilterValue,
} from "@/components/randomizer/filter-dropdown";
import {
  describeMoveCategoryFilter,
  describeMoveTypeFilter,
} from "@/components/randomizer/move-filter-summary";
import { Button } from "@/components/ui/button";
import { extraSlotsNeeded, requiredMovesPerPokemon } from "@/lib/randomizer/applyExtras";
import {
  MAX_MOVE_COUNT,
  MAX_MOVES_PER_POKEMON,
  MIN_MOVE_COUNT,
  MIN_MOVES_PER_POKEMON,
} from "@/lib/randomizer/defaults";
import {
  MOVE_CATEGORIES,
  MOVE_CATEGORY_LABELS,
} from "@/lib/types/catalog-entities";
import { POKEMON_TYPES, TYPE_LABELS } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";

const MOVES_PER_POKEMON_OPTIONS = [
  { value: 1, label: "1 move per Pokémon" },
  { value: 2, label: "2 moves per Pokémon" },
  { value: 3, label: "3 moves per Pokémon" },
  { value: 4, label: "4 moves per Pokémon (full moveset)" },
] as const;

interface MoveConfigFormProps {
  config: RandomizerConfig;
  poolSize: number;
  beforePokemon: boolean;
  onChange: (config: RandomizerConfig) => void;
}

export function MoveConfigForm({
  config,
  poolSize,
  beforePokemon,
  onChange,
}: MoveConfigFormProps) {
  const movesPerPokemon = requiredMovesPerPokemon(config.movesPerPokemon);
  const slotsNeeded = extraSlotsNeeded("move", config.pokemonCount, movesPerPokemon);
  const needsMoreMoves = beforePokemon && config.moveCount < slotsNeeded;
  const remainingSlots = MAX_MOVES_PER_POKEMON - movesPerPokemon;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <FilterDropdown
          label="Move categories"
          summary={describeMoveCategoryFilter(config)}
          description="Generated moves come only from the categories you leave selected. You can keep all three, two, or one."
        >
          <FilterToolbar
            legend="categories"
            onSelectAll={() => onChange({ ...config, moveCategories: [...MOVE_CATEGORIES] })}
            onClear={() => onChange({ ...config, moveCategories: [] })}
          />
          <div className="flex flex-wrap gap-2">
            {MOVE_CATEGORIES.map((category) => (
              <ToggleChip
                key={category}
                label={MOVE_CATEGORY_LABELS[category]}
                checked={config.moveCategories.includes(category)}
                onChange={() =>
                  onChange({
                    ...config,
                    moveCategories: toggleFilterValue(config.moveCategories, category),
                  })
                }
              />
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown
          label="Move types"
          summary={describeMoveTypeFilter(config)}
          description="Generated moves come only from the types you leave selected. A move has one type, so any selected type can appear."
        >
          <FilterToolbar
            legend="move types"
            onSelectAll={() => onChange({ ...config, moveTypes: [...POKEMON_TYPES] })}
            onClear={() => onChange({ ...config, moveTypes: [] })}
          />
          <div className="flex flex-wrap gap-2">
            {POKEMON_TYPES.map((type) => (
              <ToggleChip
                key={type}
                label={TYPE_LABELS[type]}
                checked={config.moveTypes.includes(type)}
                onChange={() =>
                  onChange({
                    ...config,
                    moveTypes: toggleFilterValue(config.moveTypes, type),
                  })
                }
              />
            ))}
          </div>
        </FilterDropdown>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Number of moves</legend>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease move count"
            disabled={config.moveCount <= MIN_MOVE_COUNT}
            onClick={() =>
              onChange({
                ...config,
                moveCount: Math.max(MIN_MOVE_COUNT, config.moveCount - 1),
              })
            }
          >
            <Minus />
          </Button>
          <input
            id="move-count"
            type="number"
            inputMode="numeric"
            min={MIN_MOVE_COUNT}
            max={MAX_MOVE_COUNT}
            value={config.moveCount}
            aria-label="Move count"
            aria-describedby="move-count-help"
            className="h-8 w-16 rounded-lg border border-input bg-background text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => {
              const next = Number(event.target.value);
              onChange({ ...config, moveCount: Number.isFinite(next) ? next : 0 });
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase move count"
            disabled={config.moveCount >= MAX_MOVE_COUNT}
            onClick={() =>
              onChange({
                ...config,
                moveCount: Math.min(MAX_MOVE_COUNT, config.moveCount + 1),
              })
            }
          >
            <Plus />
          </Button>
        </div>
        <p id="move-count-help" className="text-sm text-muted-foreground">
          {beforePokemon
            ? `Generate ${MIN_MOVE_COUNT}–${MAX_MOVE_COUNT} unique moves from the selected categories and types, default 8. After you generate Pokémon, you will apply the number of moves chosen below to a Pokémon you choose.`
            : `Generate ${MIN_MOVE_COUNT}–${MAX_MOVE_COUNT} unique moves from the selected categories and types, default 8, then pick four for the Pokémon you will use in battle.`}
        </p>
        {needsMoreMoves ? (
          <p role="status" className="text-sm text-muted-foreground">
            You are generating {config.pokemonCount} Pokémon. Giving each of them{" "}
            {movesPerPokemon} unique {movesPerPokemon === 1 ? "move" : "moves"} would need{" "}
            {slotsNeeded} unique moves. Extra leftover moves can stay unused, and remaining slots
            can be filled in the Builder.
          </p>
        ) : null}
        <p aria-live="polite" className="text-sm">
          {poolSize} {poolSize === 1 ? "move matches" : "moves match"} these filters.
        </p>
      </fieldset>

      {beforePokemon ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Moves given to each Pokémon</legend>
          <div className="flex flex-col gap-2">
            {MOVES_PER_POKEMON_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="moves-per-pokemon"
                  checked={movesPerPokemon === option.value}
                  onChange={() => onChange({ ...config, movesPerPokemon: option.value })}
                />
                {option.label}
              </label>
            ))}
          </div>
          <p id="moves-per-pokemon-help" className="text-sm text-muted-foreground">
            Choose {MIN_MOVES_PER_POKEMON}–{MAX_MOVES_PER_POKEMON} unique moves to apply to the
            Pokémon you select
            {remainingSlots > 0
              ? `. The remaining ${remainingSlots} ${remainingSlots === 1 ? "slot" : "slots"} will be chosen in the Builder.`
              : ". That is a full moveset."}
          </p>
        </fieldset>
      ) : null}
    </div>
  );
}
