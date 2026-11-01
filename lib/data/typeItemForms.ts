import type { PokemonForm } from "@/lib/types/pokemon";
import { STAT_IDS, type StatSpread } from "@/lib/types/stats";

/**
 * A plate, memory, or drive changes the form's type and leaves the body alone.
 * Arceus-Bug holds the Insect Plate. Silvally-Fire holds the Fire Memory.
 * Genesect-Burn holds the Burn Drive. Masks, orbs, and crystals are not these items.
 */
export function isTypeChangeHeldItem(itemId: string): boolean {
  return itemId.endsWith("plate") || itemId.endsWith("memory") || itemId.endsWith("drive");
}

function sameBody(left: StatSpread, right: StatSpread): boolean {
  return STAT_IDS.every((stat) => left[stat] === right[stat]);
}

function baseFormFor(forms: readonly PokemonForm[], speciesId: string): PokemonForm | undefined {
  return (
    forms.find((form) => form.speciesId === speciesId && form.id === speciesId && form.formType === "base") ??
    forms.find((form) => form.speciesId === speciesId && form.formType === "base")
  );
}

/**
 * True when this other form is the base Pokémon holding a type-change item.
 * A form whose base stats differ, such as Dialga-Origin, keeps its own measurements.
 */
export function usesBaseBody(
  form: PokemonForm,
  forms: readonly PokemonForm[],
  requiredItemId: string | undefined,
): boolean {
  if (form.formType !== "other" || !requiredItemId || !isTypeChangeHeldItem(requiredItemId)) {
    return false;
  }
  const base = baseFormFor(forms, form.speciesId);
  return Boolean(base && base.id !== form.id && sameBody(form.baseStats, base.baseStats));
}

/** Height, weight, and egg groups come from the default form. Types stay on this form. */
export function inheritTypeChangeFormBodies(
  forms: readonly PokemonForm[],
  requiredItemId: (formId: string) => string | undefined,
): PokemonForm[] {
  return forms.map((form) => {
    if (!usesBaseBody(form, forms, requiredItemId(form.id))) {
      return form;
    }
    const base = baseFormFor(forms, form.speciesId);
    if (!base) {
      return form;
    }
    return {
      ...form,
      heightM: base.heightM,
      weightKg: base.weightKg,
      eggGroups: [...base.eggGroups],
    };
  });
}

/** A type-change form with no cry of its own uses the default form's cry URL. */
export function copyTypeChangeCries(
  cries: Readonly<Record<string, string>>,
  forms: readonly PokemonForm[],
  requiredItemId: (formId: string) => string | undefined,
): Record<string, string> {
  const next = { ...cries };
  for (const form of forms) {
    if (next[form.id] || !usesBaseBody(form, forms, requiredItemId(form.id))) {
      continue;
    }
    const base = baseFormFor(forms, form.speciesId);
    const cry = base ? next[base.id] : undefined;
    if (cry) {
      next[form.id] = cry;
    }
  }
  return next;
}
