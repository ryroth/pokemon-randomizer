import formItems from "@/data/generated/form-items.json";

/**
 * Forms that have to hold one item to be that form, written by `npm run import:form-items`.
 * Giratina-Origin holds the Griseous Core. Venusaur-Mega holds Venusaurite. A base form,
 * and Mega Rayquaza, have no entry.
 */
const requiredByForm = formItems as Record<string, string>;

/** The held item this form needs, or undefined when any item (or none) is allowed. */
export function requiredFormItemId(pokemonId: string | undefined): string | undefined {
  if (!pokemonId) {
    return undefined;
  }
  return requiredByForm[pokemonId];
}
