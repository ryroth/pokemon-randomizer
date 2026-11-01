import { formatHeight, formatWeight } from "@/lib/data/measurement";
import { TYPE_LABELS, POKEMON_TYPES } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import { STAT_IDS, STAT_LABELS } from "@/lib/types/stats";
import {
  EGG_GROUPS,
  EVOLUTION_PROGRESS_LABELS,
  EVOLUTION_STAGE_LABELS,
  EVOLUTION_STAGES,
  FORM_TYPE_LABELS,
  GENERATIONS,
  NAME_INITIALS,
  POKEDEX_COLOR_LABELS,
  POKEDEX_COLORS,
  POKEDEX_SHAPE_LABELS,
  POKEDEX_SHAPES,
  TYPE_COUNT_LABELS,
} from "@/lib/types/taxonomy";

export const SPECIAL_FLAGS = [
  { key: "allowLegendary", label: "Legendary (Restricted)" },
  { key: "allowSubLegendary", label: "Sub-Legendary" },
  { key: "allowMythical", label: "Mythical" },
  { key: "allowPseudoLegendary", label: "Pseudo-legendary" },
  { key: "allowParadox", label: "Paradox" },
  { key: "allowUltraBeast", label: "Ultra Beast" },
] as const;

export function describeGenerationFilter(config: RandomizerConfig): string {
  if (config.generations.length === 0) {
    return "No generations";
  }

  if (config.generations.length === GENERATIONS.length) {
    return "All generations";
  }

  return [...config.generations]
    .sort((left, right) => left - right)
    .map((generation) => `Gen ${generation}`)
    .join(", ");
}

export function describeTypeFilter(config: RandomizerConfig): string {
  if (config.types.length === 0) {
    return "No types";
  }

  const suffix = config.typeMatchMode === "and" ? " (every selected type)" : "";

  if (config.types.length === POKEMON_TYPES.length) {
    return `All types${suffix}`;
  }

  return `${config.types.map((type) => TYPE_LABELS[type]).join(", ")}${suffix}`;
}

export function describeFormTypeFilter(config: RandomizerConfig): string {
  if (config.formTypes.length === 0) {
    return "No forms";
  }

  return config.formTypes.map((formType) => FORM_TYPE_LABELS[formType]).join(", ");
}

export function describeEvolutionStageFilter(config: RandomizerConfig): string {
  if (config.evolutionStages.length === 0) {
    return "No evolution stages";
  }

  if (config.evolutionStages.length === EVOLUTION_STAGES.length) {
    return "All stages";
  }

  return config.evolutionStages.map((stage) => EVOLUTION_STAGE_LABELS[stage]).join(", ");
}

export function describeSpecialFilter(config: RandomizerConfig): string {
  const excluded = SPECIAL_FLAGS.filter((flag) => !config[flag.key]).map((flag) => flag.label);
  if (excluded.length === 0) {
    return "All allowed";
  }

  return `Excluding ${excluded.join(", ")}`;
}

export function describeNameInitialFilter(config: RandomizerConfig): string {
  return describeSelection(config.nameInitials, NAME_INITIALS, "Any letter", "No letters", (letter) => letter);
}

export function describeBaseStatFilter(config: RandomizerConfig): string {
  return describeRange(config.bstMin, config.bstMax, "Any total", "");
}

export function describeTypeCountFilter(config: RandomizerConfig): string {
  return TYPE_COUNT_LABELS[config.typeCount];
}

export function describeEvolutionProgressFilter(config: RandomizerConfig): string {
  return EVOLUTION_PROGRESS_LABELS[config.evolutionProgress];
}

export function describeHighestStatFilter(config: RandomizerConfig): string {
  return describeSelection(
    config.highestStats,
    STAT_IDS,
    "Any highest stat",
    "No highest stat",
    (stat) => STAT_LABELS[stat],
  );
}

export function describeLowestStatFilter(config: RandomizerConfig): string {
  return describeSelection(
    config.lowestStats,
    STAT_IDS,
    "Any lowest stat",
    "No lowest stat",
    (stat) => STAT_LABELS[stat],
  );
}

export function describeGenusFilter(config: RandomizerConfig): string {
  const query = config.genusQuery.trim();
  return query.length > 0 ? query : "Any species";
}

export function describePokedexColorFilter(config: RandomizerConfig): string {
  return describeSelection(
    config.pokedexColors,
    POKEDEX_COLORS,
    "Any color",
    "No colors",
    (color) => POKEDEX_COLOR_LABELS[color],
  );
}

export function describeHeightFilter(config: RandomizerConfig): string {
  return describeMeasuredRange(config.heightMinM, config.heightMaxM, "Any height", (value) =>
    formatHeight(value, config.measurementSystem),
  );
}

export function describeWeightFilter(config: RandomizerConfig): string {
  return describeMeasuredRange(config.weightMinKg, config.weightMaxKg, "Any weight", (value) =>
    formatWeight(value, config.measurementSystem),
  );
}

export function describeShapeFilter(config: RandomizerConfig): string {
  return describeSelection(
    config.shapes,
    POKEDEX_SHAPES,
    "Any shape",
    "No shapes",
    (shape) => POKEDEX_SHAPE_LABELS[shape],
  );
}

export function describeEggGroupFilter(config: RandomizerConfig): string {
  return describeSelection(config.eggGroups, EGG_GROUPS, "Any egg group", "No egg groups", (group) => group);
}

/** One line for the extra filters. "Any" means every one of them is still at its default. */
export function describeMoreFilters(config: RandomizerConfig): string {
  const parts: string[] = [];

  const letters = describeNameInitialFilter(config);
  if (letters === "No letters") {
    parts.push("No letters");
  } else if (letters !== "Any letter") {
    parts.push(`Starts with ${letters}`);
  }

  const total = describeBaseStatFilter(config);
  if (total !== "Any total") {
    const phrase = total.startsWith("At ") ? `${total.charAt(0).toLowerCase()}${total.slice(1)}` : total;
    parts.push(`BST ${phrase}`);
  }

  if (config.typeCount !== "any") {
    parts.push(TYPE_COUNT_LABELS[config.typeCount]);
  }
  if (config.evolutionProgress !== "any") {
    parts.push(EVOLUTION_PROGRESS_LABELS[config.evolutionProgress]);
  }

  const highest = describeHighestStatFilter(config);
  if (highest === "No highest stat") {
    parts.push("No highest stat");
  } else if (highest !== "Any highest stat") {
    parts.push(`Highest ${highest}`);
  }

  const lowest = describeLowestStatFilter(config);
  if (lowest === "No lowest stat") {
    parts.push("No lowest stat");
  } else if (lowest !== "Any lowest stat") {
    parts.push(`Lowest ${lowest}`);
  }

  const category = config.genusQuery.trim();
  if (category.length > 0) {
    parts.push(category);
  }

  const color = describePokedexColorFilter(config);
  if (color === "No colors") {
    parts.push("No colors");
  } else if (color !== "Any color") {
    parts.push(color);
  }

  const height = describeHeightFilter(config);
  if (height !== "Any height") {
    parts.push(height);
  }

  const weight = describeWeightFilter(config);
  if (weight !== "Any weight") {
    parts.push(weight);
  }

  const shape = describeShapeFilter(config);
  if (shape === "No shapes") {
    parts.push("No shapes");
  } else if (shape !== "Any shape") {
    parts.push(shape);
  }

  const eggs = describeEggGroupFilter(config);
  if (eggs === "No egg groups") {
    parts.push("No egg groups");
  } else if (eggs !== "Any egg group") {
    parts.push(eggs);
  }

  if (config.measurementSystem === "metric") {
    parts.push("Metric");
  }

  return parts.length === 0 ? "Any" : parts.join(" · ");
}

function describeSelection<T extends string>(
  selected: readonly T[],
  every: readonly T[],
  allLabel: string,
  noneLabel: string,
  label: (value: T) => string,
): string {
  if (selected.length === 0) {
    return noneLabel;
  }
  if (every.every((item) => selected.includes(item))) {
    return allLabel;
  }
  return every.filter((item) => selected.includes(item)).map(label).join(", ");
}

function describeRange(min: number | null, max: number | null, anyLabel: string, unit: string): string {
  return describeMeasuredRange(min, max, anyLabel, (value) => `${value}${unit}`);
}

function describeMeasuredRange(
  min: number | null,
  max: number | null,
  anyLabel: string,
  format: (value: number) => string,
): string {
  if (min === null && max === null) {
    return anyLabel;
  }
  if (min !== null && max !== null) {
    return `${format(min)}–${format(max)}`;
  }
  if (min !== null) {
    return `At least ${format(min)}`;
  }
  return `At most ${format(max as number)}`;
}
