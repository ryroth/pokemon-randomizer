import { TYPE_LABELS, POKEMON_TYPES } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import {
  EVOLUTION_STAGE_LABELS,
  EVOLUTION_STAGES,
  FORM_TYPE_LABELS,
  GENERATIONS,
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
    return "No formes";
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
