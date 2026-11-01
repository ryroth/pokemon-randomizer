import { isGeneratablePokemon } from "@/lib/data/generatableForms";
import { speciesGenus } from "@/lib/data/genera";
import { baseStatTotal } from "@/lib/randomizer/ball";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import { STAT_IDS, type StatId } from "@/lib/types/stats";
import {
  EGG_GROUPS,
  NAME_INITIALS,
  POKEDEX_COLORS,
  POKEDEX_SHAPES,
  type EvolutionStage,
  type FormType,
  type Generation,
  type NameInitial,
} from "@/lib/types/taxonomy";

export type PokemonFilterConfig = Pick<
  RandomizerConfig,
  | "generations"
  | "types"
  | "typeMatchMode"
  | "formTypes"
  | "evolutionStages"
  | "allowPseudoLegendary"
  | "allowSubLegendary"
  | "allowLegendary"
  | "allowMythical"
  | "allowParadox"
  | "allowUltraBeast"
  | "nameInitials"
  | "bstMin"
  | "bstMax"
  | "typeCount"
  | "evolutionProgress"
  | "highestStats"
  | "lowestStats"
  | "genusQuery"
  | "pokedexColors"
  | "heightMinM"
  | "heightMaxM"
  | "weightMinKg"
  | "weightMaxKg"
  | "shapes"
  | "eggGroups"
>;

export const BASE_STAT_RANGE_ERROR = "The lowest base stat total is higher than the highest.";
export const HEIGHT_RANGE_ERROR = "The shortest height is taller than the tallest.";
export const WEIGHT_RANGE_ERROR = "The lowest weight is heavier than the highest.";

interface PokemonFilterContext {
  config: PokemonFilterConfig;
  generations: ReadonlySet<Generation>;
  types: readonly PokemonType[];
  typeSet: ReadonlySet<PokemonType>;
  typeMatchMode: PokemonFilterConfig["typeMatchMode"];
  formTypes: ReadonlySet<FormType>;
  evolutionStages: ReadonlySet<EvolutionStage>;
  allowPseudoLegendary: boolean;
  allowSubLegendary: boolean;
  allowLegendary: boolean;
  allowMythical: boolean;
  allowParadox: boolean;
  allowUltraBeast: boolean;
}

/** The first inverted number range, or null when every range is usable. */
export function pokemonFilterRangeError(config: PokemonFilterConfig): string | null {
  if (isInvertedRange(config.bstMin, config.bstMax)) {
    return BASE_STAT_RANGE_ERROR;
  }
  if (isInvertedRange(config.heightMinM, config.heightMaxM)) {
    return HEIGHT_RANGE_ERROR;
  }
  if (isInvertedRange(config.weightMinKg, config.weightMaxKg)) {
    return WEIGHT_RANGE_ERROR;
  }
  return null;
}

/**
 * Returns the Pokémon forms that match the Pokémon filters. Empty generation,
 * type, form-type, evolution-stage, letter, gender, color, shape, egg-group,
 * or highest-stat lists match nothing. An inverted number range matches nothing.
 * Costume Pikachu, Castform's weather forms, and mid-battle forms are never
 * included (`isGeneratablePokemon`).
 *
 * Choices inside one list combine with OR. Different filters combine with AND.
 * A list that includes every choice also accepts a form that is missing that
 * field, so the default settings do not shrink the pool.
 *
 * Type OR: the form has at least one selected type.
 * Type AND: the form has every selected type.
 */
export function filterPokemonForms(
  pokemon: readonly PokemonForm[],
  config: PokemonFilterConfig,
): PokemonForm[] {
  const context = createFilterContext(config);
  return pokemon.filter((form) => matchesContext(form, context));
}

export function matchesPokemonFilters(
  form: PokemonForm,
  config: PokemonFilterConfig,
): boolean {
  return matchesContext(form, createFilterContext(config));
}

function createFilterContext(config: PokemonFilterConfig): PokemonFilterContext {
  return {
    config,
    generations: new Set(config.generations),
    types: config.types,
    typeSet: new Set(config.types),
    typeMatchMode: config.typeMatchMode,
    formTypes: new Set(config.formTypes),
    evolutionStages: new Set(config.evolutionStages),
    allowPseudoLegendary: config.allowPseudoLegendary,
    allowSubLegendary: config.allowSubLegendary,
    allowLegendary: config.allowLegendary,
    allowMythical: config.allowMythical,
    allowParadox: config.allowParadox,
    allowUltraBeast: config.allowUltraBeast,
  };
}

function matchesContext(form: PokemonForm, context: PokemonFilterContext): boolean {
  if (!isGeneratablePokemon(form)) {
    return false;
  }

  if (context.generations.size === 0 || !context.generations.has(form.generation)) {
    return false;
  }

  if (context.formTypes.size === 0 || !context.formTypes.has(form.formType)) {
    return false;
  }

  if (
    context.evolutionStages.size === 0 ||
    !context.evolutionStages.has(form.evolutionStage)
  ) {
    return false;
  }

  if (!matchesTypes(form, context)) {
    return false;
  }

  if (!isAllowedBySpecials(form, context)) {
    return false;
  }

  return matchesNarrowing(form, context.config);
}

function matchesNarrowing(form: PokemonForm, config: PokemonFilterConfig): boolean {
  if (pokemonFilterRangeError(config)) {
    return false;
  }
  if (!matchesSelected(nameInitial(form.displayName), config.nameInitials, NAME_INITIALS)) {
    return false;
  }
  if (!matchesRange(baseStatTotal(form.baseStats), config.bstMin, config.bstMax)) {
    return false;
  }
  if (config.typeCount === "single" && form.types.length !== 1) {
    return false;
  }
  if (config.typeCount === "dual" && form.types.length < 2) {
    return false;
  }
  if (config.evolutionProgress === "can-evolve" && form.evolutionTargetIds.length === 0) {
    return false;
  }
  if (config.evolutionProgress === "fully-evolved" && form.evolutionTargetIds.length > 0) {
    return false;
  }
  if (!matchesAnySelected(highestStatIds(form), config.highestStats, STAT_IDS)) {
    return false;
  }
  if (!matchesAnySelected(lowestStatIds(form), config.lowestStats, STAT_IDS)) {
    return false;
  }
  if (!matchesGenus(form, config.genusQuery)) {
    return false;
  }
  if (!matchesSelected(form.pokedexColor, config.pokedexColors, POKEDEX_COLORS)) {
    return false;
  }
  if (!matchesRange(form.heightM, config.heightMinM, config.heightMaxM)) {
    return false;
  }
  if (!matchesRange(form.weightKg, config.weightMinKg, config.weightMaxKg)) {
    return false;
  }
  if (!matchesSelected(form.shape, config.shapes, POKEDEX_SHAPES)) {
    return false;
  }
  return matchesAnySelected(form.eggGroups, config.eggGroups, EGG_GROUPS);
}

/** Every choice selected means the filter is open, including forms that lack the field. */
function matchesSelected<T extends string>(
  value: T | null,
  selected: readonly T[],
  every: readonly T[],
): boolean {
  if (selected.length === 0) {
    return false;
  }
  if (every.every((item) => selected.includes(item))) {
    return true;
  }
  return value !== null && selected.includes(value);
}

function matchesAnySelected<T extends string>(
  values: readonly T[],
  selected: readonly T[],
  every: readonly T[],
): boolean {
  if (selected.length === 0) {
    return false;
  }
  if (every.every((item) => selected.includes(item))) {
    return true;
  }
  return values.some((value) => selected.includes(value));
}

function matchesRange(value: number | null, min: number | null, max: number | null): boolean {
  if (min === null && max === null) {
    return true;
  }
  if (value === null) {
    return false;
  }
  if (min !== null && value < min) {
    return false;
  }
  if (max !== null && value > max) {
    return false;
  }
  return true;
}

function isInvertedRange(min: number | null, max: number | null): boolean {
  return min !== null && max !== null && min > max;
}

export function nameInitial(displayName: string): NameInitial | null {
  const letter = displayName.trim().charAt(0).toUpperCase();
  return (NAME_INITIALS as readonly string[]).includes(letter) ? (letter as NameInitial) : null;
}

function highestStatIds(form: PokemonForm): StatId[] {
  return extremeStatIds(form, "high");
}

function lowestStatIds(form: PokemonForm): StatId[] {
  return extremeStatIds(form, "low");
}

function extremeStatIds(form: PokemonForm, which: "high" | "low"): StatId[] {
  let best = which === "high" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  const ids: StatId[] = [];
  for (const id of STAT_IDS) {
    const value = form.baseStats[id];
    const wins = which === "high" ? value > best : value < best;
    if (wins) {
      best = value;
      ids.length = 0;
      ids.push(id);
    } else if (value === best) {
      ids.push(id);
    }
  }
  return ids;
}

function matchesGenus(form: PokemonForm, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return true;
  }
  const genus = speciesGenus(form.speciesId);
  return genus !== null && genus.toLowerCase() === needle;
}

function matchesTypes(form: PokemonForm, context: PokemonFilterContext): boolean {
  if (context.types.length === 0) {
    return false;
  }

  if (context.typeMatchMode === "and") {
    return context.types.every((type) => form.types.includes(type));
  }

  return form.types.some((type) => context.typeSet.has(type));
}

function isAllowedBySpecials(form: PokemonForm, context: PokemonFilterContext): boolean {
  if (!context.allowLegendary && form.isLegendary) {
    return false;
  }
  if (!context.allowSubLegendary && form.isSubLegendary) {
    return false;
  }
  if (!context.allowMythical && form.isMythical) {
    return false;
  }
  if (!context.allowPseudoLegendary && form.isPseudoLegendary) {
    return false;
  }
  if (!context.allowParadox && form.isParadox) {
    return false;
  }
  if (!context.allowUltraBeast && form.isUltraBeast) {
    return false;
  }
  return true;
}
