"use client";

import { Minus, Plus } from "lucide-react";
import {
  FilterDropdown,
  FilterToolbar,
  ToggleChip,
  toggleFilterValue,
} from "@/components/randomizer/filter-dropdown";
import {
  describeEvolutionStageFilter,
  describeFormTypeFilter,
  describeGenerationFilter,
  describeSpecialFilter,
  describeTypeFilter,
  SPECIAL_FLAGS,
} from "@/components/randomizer/pokemon-filter-summary";
import { Button } from "@/components/ui/button";
import {
  MAX_POKEMON_COUNT,
  MIN_POKEMON_COUNT,
  resetPokemonFilters,
} from "@/lib/randomizer/defaults";
import { TYPE_LABELS, POKEMON_TYPES } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import {
  EVOLUTION_STAGE_LABELS,
  EVOLUTION_STAGES,
  FORM_TYPE_LABELS,
  FORM_TYPES,
  GENERATIONS,
} from "@/lib/types/taxonomy";

interface PokemonFilterFormProps {
  config: RandomizerConfig;
  poolSize: number;
  onChange: (config: RandomizerConfig) => void;
}

export function PokemonFilterForm({ config, poolSize, onChange }: PokemonFilterFormProps) {
  const poolTooSmall = poolSize < config.pokemonCount;

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Number of Pokémon</legend>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease Pokémon count"
            disabled={config.pokemonCount <= MIN_POKEMON_COUNT}
            onClick={() =>
              onChange({
                ...config,
                pokemonCount: Math.max(MIN_POKEMON_COUNT, config.pokemonCount - 1),
              })
            }
          >
            <Minus />
          </Button>
          <input
            id="pokemon-count"
            type="number"
            inputMode="numeric"
            min={MIN_POKEMON_COUNT}
            max={MAX_POKEMON_COUNT}
            value={config.pokemonCount}
            aria-label="Pokémon count"
            aria-describedby="pokemon-count-help"
            className="h-8 w-16 rounded-lg border border-input bg-background text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => {
              const next = Number(event.target.value);
              onChange({ ...config, pokemonCount: Number.isFinite(next) ? next : 0 });
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase Pokémon count"
            disabled={config.pokemonCount >= MAX_POKEMON_COUNT}
            onClick={() =>
              onChange({
                ...config,
                pokemonCount: Math.min(MAX_POKEMON_COUNT, config.pokemonCount + 1),
              })
            }
          >
            <Plus />
          </Button>
        </div>
        <p id="pokemon-count-help" className="text-sm text-muted-foreground">
          Generate {MIN_POKEMON_COUNT}–{MAX_POKEMON_COUNT} unique Pokémon. Default is 6.
        </p>
      </fieldset>

      <div className="space-y-3">
        <FilterDropdown label="Generations" summary={describeGenerationFilter(config)}>
          <FilterToolbar
            legend="generations"
            onSelectAll={() => onChange({ ...config, generations: [...GENERATIONS] })}
            onClear={() => onChange({ ...config, generations: [] })}
          />
          <div className="flex flex-wrap gap-2">
            {GENERATIONS.map((generation) => (
              <ToggleChip
                key={generation}
                label={`Gen ${generation}`}
                checked={config.generations.includes(generation)}
                onChange={() =>
                  onChange({
                    ...config,
                    generations: toggleFilterValue(config.generations, generation),
                  })
                }
              />
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Types" summary={describeTypeFilter(config)}>
          <FilterToolbar
            legend="types"
            onSelectAll={() => onChange({ ...config, types: [...POKEMON_TYPES] })}
            onClear={() => onChange({ ...config, types: [] })}
          />
          <fieldset className="flex flex-wrap gap-4">
            <legend className="sr-only">Type match mode</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="type-match-mode"
                checked={config.typeMatchMode === "or"}
                onChange={() => onChange({ ...config, typeMatchMode: "or" })}
              />
              Match any selected type
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="type-match-mode"
                checked={config.typeMatchMode === "and"}
                onChange={() => onChange({ ...config, typeMatchMode: "and" })}
              />
              Match every selected type
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            {POKEMON_TYPES.map((type) => (
              <ToggleChip
                key={type}
                label={TYPE_LABELS[type]}
                checked={config.types.includes(type)}
                onChange={() =>
                  onChange({ ...config, types: toggleFilterValue(config.types, type) })
                }
              />
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown
          label="Formes"
          summary={describeFormTypeFilter(config)}
          description="Base formes are on by default. Mega Evolutions, regional formes, Primals, Gigantamax, and other formes stay off until you enable them."
        >
          <FilterToolbar
            legend="formes"
            onSelectAll={() => onChange({ ...config, formTypes: [...FORM_TYPES] })}
            onClear={() => onChange({ ...config, formTypes: [] })}
          />
          <div className="flex flex-wrap gap-2">
            {FORM_TYPES.map((formType) => (
              <ToggleChip
                key={formType}
                label={FORM_TYPE_LABELS[formType]}
                checked={config.formTypes.includes(formType)}
                onChange={() =>
                  onChange({
                    ...config,
                    formTypes: toggleFilterValue(config.formTypes, formType),
                  })
                }
              />
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Evolution stages" summary={describeEvolutionStageFilter(config)}>
          <FilterToolbar
            legend="evolution stages"
            onSelectAll={() => onChange({ ...config, evolutionStages: [...EVOLUTION_STAGES] })}
            onClear={() => onChange({ ...config, evolutionStages: [] })}
          />
          <div className="flex flex-wrap gap-2">
            {EVOLUTION_STAGES.map((stage) => (
              <ToggleChip
                key={stage}
                label={EVOLUTION_STAGE_LABELS[stage]}
                checked={config.evolutionStages.includes(stage)}
                onChange={() =>
                  onChange({
                    ...config,
                    evolutionStages: toggleFilterValue(config.evolutionStages, stage),
                  })
                }
              />
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown
          label="Special classifications"
          summary={describeSpecialFilter(config)}
          description="All of these are allowed by default. Uncheck a group to keep it out of the roll."
        >
          <div className="flex flex-wrap gap-2">
            {SPECIAL_FLAGS.map((flag) => (
              <ToggleChip
                key={flag.key}
                label={flag.label}
                checked={config[flag.key]}
                onChange={() => onChange({ ...config, [flag.key]: !config[flag.key] })}
              />
            ))}
          </div>
        </FilterDropdown>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={config.showPokedexEntry}
          onChange={() => onChange({ ...config, showPokedexEntry: !config.showPokedexEntry })}
        />
        <span>Show a Pokédex entry on each result</span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm">
          {poolTooSmall ? (
            <span>
              Only {poolSize} Pokémon match these filters. Reduce the count or broaden the filters
              before generating.
            </span>
          ) : (
            <span>
              {poolSize} Pokémon match these filters. Ready to generate {config.pokemonCount}.
            </span>
          )}
        </p>
        <Button type="button" variant="ghost" onClick={() => onChange(resetPokemonFilters(config))}>
          Reset Pokémon filters
        </Button>
      </div>
    </div>
  );
}
