"use client";

import { useState, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";
import {
  FilterDropdown,
  FilterToolbar,
  ToggleChip,
  toggleFilterValue,
} from "@/components/randomizer/filter-dropdown";
import { OptionalNumberInput } from "@/components/randomizer/optional-number-input";
import { ShownCardFacts } from "@/components/randomizer/shown-card-facts";
import { SpeciesFilter } from "@/components/randomizer/species-filter";
import { feetInchesToMeters, kilogramsToPounds, metersToFeetInches, poundsToKilograms } from "@/lib/data/measurement";
import {
  describeEvolutionStageFilter,
  describeFormTypeFilter,
  describeGenerationFilter,
  describeMoreFilters,
  describeSpecialFilter,
  describeTypeFilter,
  SPECIAL_FLAGS,
} from "@/components/randomizer/pokemon-filter-summary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/builder/number-input";
import {
  DEFAULT_SHINY_CHANCE,
  MAX_POKEMON_COUNT,
  MAX_SHINY_CHANCE,
  MIN_POKEMON_COUNT,
  MIN_SHINY_CHANCE,
  resetPokemonFilters,
} from "@/lib/randomizer/defaults";
import {
  BASE_STAT_RANGE_ERROR,
  HEIGHT_RANGE_ERROR,
  WEIGHT_RANGE_ERROR,
} from "@/lib/filters/pokemon";
import { TYPE_LABELS, POKEMON_TYPES } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import type { PokedexColor } from "@/lib/types/taxonomy";
import { STAT_IDS, STAT_LABELS } from "@/lib/types/stats";
import {
  EGG_GROUPS,
  EVOLUTION_PROGRESSES,
  EVOLUTION_PROGRESS_LABELS,
  EVOLUTION_STAGE_LABELS,
  EVOLUTION_STAGES,
  FORM_TYPE_LABELS,
  FORM_TYPES,
  GENERATIONS,
  MEASUREMENT_SYSTEM_LABELS,
  MEASUREMENT_SYSTEMS,
  NAME_INITIALS,
  POKEDEX_COLOR_LABELS,
  POKEDEX_COLORS,
  POKEDEX_SHAPE_LABELS,
  POKEDEX_SHAPES,
  TYPE_COUNT_FILTERS,
  TYPE_COUNT_LABELS,
} from "@/lib/types/taxonomy";

interface PokemonFilterFormProps {
  config: RandomizerConfig;
  /** Forms that pass the filters. */
  matchCount: number;
  /** How many of those forms can share one roll. */
  rollableCount: number;
  onChange: (config: RandomizerConfig) => void;
}

export function PokemonFilterForm({
  config,
  matchCount,
  rollableCount,
  onChange,
}: PokemonFilterFormProps) {
  const poolTooSmall = rollableCount < config.pokemonCount;

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

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Shiny chance</legend>
        <div className="flex items-center gap-2">
          <NumberInput
            id="shiny-chance"
            aria-label="Shiny chance in percent"
            aria-describedby="shiny-chance-help"
            min={MIN_SHINY_CHANCE}
            max={MAX_SHINY_CHANCE}
            step="any"
            className="h-8 w-24 rounded-lg border border-input bg-background text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={config.shinyChance}
            onCommit={(next) => onChange({ ...config, shinyChance: next })}
          />
          <span aria-hidden="true" className="text-sm text-muted-foreground">
            %
          </span>
        </div>
        <p id="shiny-chance-help" className="text-sm text-muted-foreground">
          Each generated Pokémon rolls this chance on its own. Use {MIN_SHINY_CHANCE} to turn shiny rolls off.
          A shiny Pokémon starts with Shiny set to Yes in the builder. Default is {DEFAULT_SHINY_CHANCE}%.
        </p>
        {config.shinyChance < MIN_SHINY_CHANCE || config.shinyChance > MAX_SHINY_CHANCE ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            Choose a shiny chance between {MIN_SHINY_CHANCE}% and {MAX_SHINY_CHANCE}%.
          </p>
        ) : null}
      </fieldset>

      <div className="grid items-start gap-[var(--grid-gap)] md:grid-cols-2">
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

        <FilterDropdown label="Types" summary={describeTypeFilter(config)} className="md:col-span-2">
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
                type={type}
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
          label="Forms"
          summary={describeFormTypeFilter(config)}
          description="Base, regional, and other forms are on by default. Mega Evolutions, Primals, and Gigantamax stay off until you enable them."
        >
          <FilterToolbar
            legend="forms"
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

        <MoreFilters config={config} onChange={onChange} />
      </div>

      <ShownCardFacts config={config} onChange={onChange} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm">
          <span className="font-mono tabular-nums">{matchCount}</span> Pokémon match these filters.
          {poolTooSmall ? (
            <>
              {" "}
              Only <span className="font-mono tabular-nums">{rollableCount}</span> can be rolled
              together, because a generation keeps overlapping evolution lines unique. Reduce the
              count or broaden the filters before generating.
            </>
          ) : (
            <>
              {" "}
              Ready to generate <span className="font-mono tabular-nums">{config.pokemonCount}</span>.
            </>
          )}
        </p>
        <Button type="button" variant="ghost" onClick={() => onChange(resetPokemonFilters(config))}>
          Reset Pokémon filters
        </Button>
      </div>
    </div>
  );
}

const RANGE_INPUT_CLASS =
  "h-8 w-24 rounded-lg border border-input bg-background text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const MORE_TABS = [
  { id: "name", label: "Name" },
  { id: "stats", label: "Stats" },
  { id: "appearance", label: "Appearance" },
  { id: "traits", label: "Traits" },
] as const;

type MoreTab = (typeof MORE_TABS)[number]["id"];

/** Display colors for the Pokédex color chips. The written name stays on the chip. */
const COLOR_SWATCHES: Record<PokedexColor, string> = {
  black: "#2a2a2a",
  blue: "#4c6cb3",
  brown: "#8b5a2b",
  gray: "#8d8d8d",
  green: "#4e8234",
  pink: "#e38ea3",
  purple: "#6b4c9a",
  red: "#c23b3b",
  white: "#f7f7f7",
  yellow: "#f2d15a",
};

function MoreFilters({
  config,
  onChange,
}: {
  config: RandomizerConfig;
  onChange: (config: RandomizerConfig) => void;
}) {
  const [tab, setTab] = useState<MoreTab>("name");

  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    const index = MORE_TABS.findIndex((item) => item.id === tab);
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? MORE_TABS[(index + 1) % MORE_TABS.length]
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? MORE_TABS[(index - 1 + MORE_TABS.length) % MORE_TABS.length]
          : event.key === "Home"
            ? MORE_TABS[0]
            : event.key === "End"
              ? MORE_TABS[MORE_TABS.length - 1]
              : null;
    if (!next) {
      return;
    }
    event.preventDefault();
    setTab(next.id);
    document.getElementById(`more-filter-tab-${next.id}`)?.focus();
  }

  return (
    <FilterDropdown
      className="md:col-span-2"
      label="More filters"
      summary={describeMoreFilters(config)}
      description="Name, stats, appearance, and traits. These stay wide open until you change one."
    >
      <div
        role="tablist"
        aria-label="More filters"
        className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1 sm:grid-cols-4"
        onKeyDown={moveTab}
      >
        {MORE_TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`more-filter-tab-${item.id}`}
              aria-controls={`more-filter-panel-${item.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "min-h-9 rounded-lg px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "bg-background font-semibold text-foreground shadow-sm ring-1 ring-foreground/20"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`more-filter-panel-${tab}`}
        aria-labelledby={`more-filter-tab-${tab}`}
        className="space-y-5"
      >
        {tab === "name" ? <NameFilters config={config} onChange={onChange} /> : null}
        {tab === "stats" ? <StatFilters config={config} onChange={onChange} /> : null}
        {tab === "appearance" ? <AppearanceFilters config={config} onChange={onChange} /> : null}
        {tab === "traits" ? <TraitFilters config={config} onChange={onChange} /> : null}
      </div>
    </FilterDropdown>
  );
}

function NameFilters({
  config,
  onChange,
}: {
  config: RandomizerConfig;
  onChange: (config: RandomizerConfig) => void;
}) {
  return (
    <>
      <ChipGroup
        legend="Starts with"
        hint="The name on the card. Mr. Mime starts with M."
        toolbar="letters"
        compact
        options={NAME_INITIALS.map((letter) => ({ value: letter, label: letter }))}
        selected={config.nameInitials}
        onSelected={(nameInitials) => onChange({ ...config, nameInitials })}
      />
      <SpeciesFilter
        value={config.genusQuery}
        onChange={(genusQuery) => onChange({ ...config, genusQuery })}
      />
    </>
  );
}

function StatFilters({
  config,
  onChange,
}: {
  config: RandomizerConfig;
  onChange: (config: RandomizerConfig) => void;
}) {
  return (
    <>
      <RangeFields
        legend="Base stat total"
        hint="Leave a box empty for no limit. A Mega uses that Mega's total."
        minLabel="Base stat total at least"
        maxLabel="Base stat total at most"
        min={config.bstMin}
        max={config.bstMax}
        step={1}
        error={
          config.bstMin !== null && config.bstMax !== null && config.bstMin > config.bstMax
            ? BASE_STAT_RANGE_ERROR
            : null
        }
        onMin={(bstMin) => onChange({ ...config, bstMin })}
        onMax={(bstMax) => onChange({ ...config, bstMax })}
      />
      <ChipGroup
        legend="Highest base stat"
        hint="A tie matches every stat that shares the top number."
        toolbar="highest stats"
        options={STAT_IDS.map((stat) => ({ value: stat, label: STAT_LABELS[stat] }))}
        selected={config.highestStats}
        onSelected={(highestStats) => onChange({ ...config, highestStats })}
      />
      <ChipGroup
        legend="Lowest base stat"
        hint="A tie matches every stat that shares the bottom number."
        toolbar="lowest stats"
        options={STAT_IDS.map((stat) => ({ value: stat, label: STAT_LABELS[stat] }))}
        selected={config.lowestStats}
        onSelected={(lowestStats) => onChange({ ...config, lowestStats })}
      />
    </>
  );
}

function AppearanceFilters({
  config,
  onChange,
}: {
  config: RandomizerConfig;
  onChange: (config: RandomizerConfig) => void;
}) {
  const imperial = config.measurementSystem === "imperial";
  const heightError =
    config.heightMinM !== null && config.heightMaxM !== null && config.heightMinM > config.heightMaxM
      ? HEIGHT_RANGE_ERROR
      : null;
  const weightError =
    config.weightMinKg !== null && config.weightMaxKg !== null && config.weightMinKg > config.weightMaxKg
      ? WEIGHT_RANGE_ERROR
      : null;

  return (
    <>
      <SegmentedChoice
        legend="Units"
        hint="Height and weight use this system here and on each generated Pokémon. Reset leaves this choice as it is."
        name="measurement-system"
        options={MEASUREMENT_SYSTEMS.map((value) => ({
          value,
          label: MEASUREMENT_SYSTEM_LABELS[value],
        }))}
        selected={config.measurementSystem}
        onSelected={(measurementSystem) => onChange({ ...config, measurementSystem })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {imperial ? (
          <ImperialHeightFields
            minMeters={config.heightMinM}
            maxMeters={config.heightMaxM}
            error={heightError}
            onMin={(heightMinM) => onChange({ ...config, heightMinM })}
            onMax={(heightMaxM) => onChange({ ...config, heightMaxM })}
          />
        ) : (
          <RangeFields
            legend="Height"
            hint="Official Pokédex height. Leave a box empty for no limit."
            minLabel="Height at least in meters"
            maxLabel="Height at most in meters"
            unit="m"
            min={config.heightMinM}
            max={config.heightMaxM}
            step="any"
            error={heightError}
            onMin={(heightMinM) => onChange({ ...config, heightMinM })}
            onMax={(heightMaxM) => onChange({ ...config, heightMaxM })}
          />
        )}
        {imperial ? (
          <RangeFields
            legend="Weight"
            hint="Official Pokédex weight. Leave a box empty for no limit."
            minLabel="Weight at least in pounds"
            maxLabel="Weight at most in pounds"
            unit="lb"
            min={config.weightMinKg === null ? null : kilogramsToPounds(config.weightMinKg)}
            max={config.weightMaxKg === null ? null : kilogramsToPounds(config.weightMaxKg)}
            step={0.1}
            error={weightError}
            onMin={(pounds) =>
              onChange({ ...config, weightMinKg: pounds === null ? null : poundsToKilograms(pounds) })
            }
            onMax={(pounds) =>
              onChange({ ...config, weightMaxKg: pounds === null ? null : poundsToKilograms(pounds) })
            }
          />
        ) : (
          <RangeFields
            legend="Weight"
            hint="Official Pokédex weight. Leave a box empty for no limit."
            minLabel="Weight at least in kilograms"
            maxLabel="Weight at most in kilograms"
            unit="kg"
            min={config.weightMinKg}
            max={config.weightMaxKg}
            step="any"
            error={weightError}
            onMin={(weightMinKg) => onChange({ ...config, weightMinKg })}
            onMax={(weightMaxKg) => onChange({ ...config, weightMaxKg })}
          />
        )}
      </div>
      <ChipGroup
        legend="Pokédex color"
        hint="The species color, so forms of the same species share it."
        toolbar="colors"
        swatchFor={(color) => COLOR_SWATCHES[color]}
        options={POKEDEX_COLORS.map((color) => ({ value: color, label: POKEDEX_COLOR_LABELS[color] }))}
        selected={config.pokedexColors}
        onSelected={(pokedexColors) => onChange({ ...config, pokedexColors })}
      />
      <ChipGroup
        legend="Body shape"
        hint="The species shape, so forms of the same species share it."
        toolbar="shapes"
        options={POKEDEX_SHAPES.map((shape) => ({ value: shape, label: POKEDEX_SHAPE_LABELS[shape] }))}
        selected={config.shapes}
        onSelected={(shapes) => onChange({ ...config, shapes })}
      />
    </>
  );
}

function TraitFilters({
  config,
  onChange,
}: {
  config: RandomizerConfig;
  onChange: (config: RandomizerConfig) => void;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <SegmentedChoice
          legend="Typing"
          name="type-count"
          options={TYPE_COUNT_FILTERS.map((value) => ({ value, label: TYPE_COUNT_LABELS[value] }))}
          selected={config.typeCount}
          onSelected={(typeCount) => onChange({ ...config, typeCount })}
        />
        <SegmentedChoice
          legend="Evolution"
          hint="Separate from evolution stage. Tauros does not evolve further, and it is still Basic."
          name="evolution-progress"
          options={EVOLUTION_PROGRESSES.map((value) => ({
            value,
            label: EVOLUTION_PROGRESS_LABELS[value],
          }))}
          selected={config.evolutionProgress}
          onSelected={(evolutionProgress) => onChange({ ...config, evolutionProgress })}
        />
      </div>
      <ChipGroup
        legend="Egg group"
        hint="A Pokémon with two groups matches if either group is selected."
        toolbar="egg groups"
        options={EGG_GROUPS.map((group) => ({ value: group, label: group }))}
        selected={config.eggGroups}
        onSelected={(eggGroups) => onChange({ ...config, eggGroups })}
      />
    </>
  );
}

function ChipGroup<T extends string>({
  legend,
  hint,
  toolbar,
  options,
  selected,
  onSelected,
  compact = false,
  swatchFor,
}: {
  legend: string;
  hint?: string;
  toolbar: string;
  options: readonly { value: T; label: string }[];
  selected: readonly T[];
  onSelected: (next: T[]) => void;
  compact?: boolean;
  swatchFor?: (value: T) => string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      <FilterToolbar
        legend={toolbar}
        onSelectAll={() => onSelected(options.map((option) => option.value))}
        onClear={() => onSelected([])}
      />
      <div className={cn("flex flex-wrap", compact ? "gap-1" : "gap-2")}>
        {options.map((option) => (
          <ToggleChip
            key={option.value}
            label={option.label}
            compact={compact}
            swatch={swatchFor?.(option.value)}
            checked={selected.includes(option.value)}
            onChange={() => onSelected(toggleFilterValue(selected, option.value))}
          />
        ))}
      </div>
    </fieldset>
  );
}

function SegmentedChoice<T extends string>({
  legend,
  hint,
  name,
  options,
  selected,
  onSelected,
}: {
  legend: string;
  hint?: string;
  name: string;
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelected: (next: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-1 sm:flex-row">
        {options.map((option) => {
          const checked = selected === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-center text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                checked
                  ? "bg-background font-semibold text-foreground shadow-sm ring-1 ring-foreground/20"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={() => onSelected(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ImperialHeightFields({
  minMeters,
  maxMeters,
  error,
  onMin,
  onMax,
}: {
  minMeters: number | null;
  maxMeters: number | null;
  error: string | null;
  onMin: (meters: number | null) => void;
  onMax: (meters: number | null) => void;
}) {
  const min = splitHeight(minMeters);
  const max = splitHeight(maxMeters);

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Height</legend>
      <p className="text-sm text-muted-foreground">
        Official Pokédex height. Leave both boxes empty for no limit. 14 inches becomes 1 ft 2 in.
      </p>
      <HeightBound
        lead="At least"
        feetLabel="Height at least in feet"
        inchesLabel="Height at least in inches"
        feet={min.feet}
        inches={min.inches}
        onCommit={onMin}
      />
      <HeightBound
        lead="At most"
        feetLabel="Height at most in feet"
        inchesLabel="Height at most in inches"
        feet={max.feet}
        inches={max.inches}
        onCommit={onMax}
      />
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function HeightBound({
  lead,
  feetLabel,
  inchesLabel,
  feet,
  inches,
  onCommit,
}: {
  lead: string;
  feetLabel: string;
  inchesLabel: string;
  feet: number | null;
  inches: number | null;
  onCommit: (meters: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <span>{lead}</span>
      <OptionalNumberInput
        aria-label={feetLabel}
        min={0}
        step={1}
        className={RANGE_INPUT_CLASS}
        value={feet}
        onCommit={(nextFeet) => onCommit(heightMeters(nextFeet, inches))}
      />
      <span aria-hidden="true" className="text-muted-foreground">
        ft
      </span>
      <OptionalNumberInput
        aria-label={inchesLabel}
        min={0}
        step={1}
        className={RANGE_INPUT_CLASS}
        value={inches}
        onCommit={(nextInches) => onCommit(heightMeters(feet, nextInches))}
      />
      <span aria-hidden="true" className="text-muted-foreground">
        in
      </span>
    </div>
  );
}

function splitHeight(meters: number | null): { feet: number | null; inches: number | null } {
  if (meters === null) {
    return { feet: null, inches: null };
  }
  return metersToFeetInches(meters);
}

function heightMeters(feet: number | null, inches: number | null): number | null {
  if (feet === null && inches === null) {
    return null;
  }
  return feetInchesToMeters(feet ?? 0, inches ?? 0);
}

function RangeFields({
  legend,
  hint,
  minLabel,
  maxLabel,
  unit,
  min,
  max,
  step,
  error,
  onMin,
  onMax,
}: {
  legend: string;
  hint: string;
  minLabel: string;
  maxLabel: string;
  unit?: string;
  min: number | null;
  max: number | null;
  step: number | "any";
  error: string | null;
  onMin: (value: number | null) => void;
  onMax: (value: number | null) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm">
          <span>At least</span>
          <OptionalNumberInput
            aria-label={minLabel}
            min={0}
            step={step}
            className={RANGE_INPUT_CLASS}
            value={min}
            onCommit={onMin}
          />
          {unit ? (
            <span aria-hidden="true" className="text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span>At most</span>
          <OptionalNumberInput
            aria-label={maxLabel}
            min={0}
            step={step}
            className={RANGE_INPUT_CLASS}
            value={max}
            onCommit={onMax}
          />
          {unit ? (
            <span aria-hidden="true" className="text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
