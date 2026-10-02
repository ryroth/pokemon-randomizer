import hiddenAbilities from "@/data/generated/hidden-abilities.json";

const byPokemonId = hiddenAbilities as Record<string, string>;

/** Showdown Hidden Ability id for this form, when it has one. */
export function hiddenAbilityId(pokemonId: string): string | null {
  return byPokemonId[pokemonId] ?? null;
}

export interface AbilityChoiceSection {
  id: "abilities" | "hidden";
  label: string;
  abilityIds: string[];
}

/** Regular abilities first. The Hidden Ability, when it is in the pool, is the last section. */
export function groupAbilityChoices(abilityIds: readonly string[], hiddenId: string | null): AbilityChoiceSection[] {
  const regular = abilityIds.filter((id) => id !== hiddenId);
  const hidden = hiddenId && abilityIds.includes(hiddenId) ? [hiddenId] : [];
  const sections: AbilityChoiceSection[] = [];
  if (regular.length > 0) {
    sections.push({ id: "abilities", label: "Abilities", abilityIds: regular });
  }
  if (hidden.length > 0) {
    sections.push({ id: "hidden", label: "Hidden Ability", abilityIds: hidden });
  }
  return sections;
}
