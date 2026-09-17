import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonType } from "@/lib/types/pokemon-type";
import type { RandomizerConfig } from "@/lib/types/randomizer";
import type { EvolutionStage, FormType, Generation } from "@/lib/types/taxonomy";

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
>;

interface PokemonFilterContext {
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

/**
 * Returns the Pokémon forms that match generation, type, form type,
 * evolution stage, and special-classification filters. Empty generation,
 * type, form-type, or evolution-stage lists match nothing.
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

  return isAllowedBySpecials(form, context);
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
