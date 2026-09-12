import type { FormType } from "@/lib/types/taxonomy";

export interface FormTypeHints {
  slug: string;
  formName?: string;
  isMega?: boolean;
  isBattleOnly?: boolean;
}

const REGIONAL_TOKENS = ["alola", "galar", "hisui", "paldea"];

export function classifyFormType(hints: FormTypeHints): FormType {
  const haystack = `${hints.slug} ${hints.formName ?? ""}`.toLowerCase();

  if (hints.isMega || haystack.includes("mega")) {
    return "mega";
  }

  if (haystack.includes("gmax") || haystack.includes("gigantamax")) {
    return "gmax";
  }

  if (haystack.includes("primal")) {
    return "primal";
  }

  if (REGIONAL_TOKENS.some((token) => haystack.includes(token))) {
    return "regional";
  }

  if (!hints.formName) {
    return "base";
  }

  return "other";
}

export interface EvolutionNode {
  speciesSlug: string;
  evolvesTo: EvolutionNode[];
}

export type EvolutionStageMap = Record<string, "basic" | "stage1" | "stage2">;

export function classifyEvolutionStages(root: EvolutionNode): EvolutionStageMap {
  const stages: EvolutionStageMap = {};

  function walk(node: EvolutionNode, depth: number) {
    stages[node.speciesSlug] = depth <= 0 ? "basic" : depth === 1 ? "stage1" : "stage2";
    for (const child of node.evolvesTo) {
      walk(child, depth + 1);
    }
  }

  walk(root, 0);
  return stages;
}

/**
 * Community pseudo-legendary definition used by this app:
 * fully evolved, three-stage family, 600 base stat total.
 * Keep this list explicit so BST-only lookalikes (for example Archaludon) stay out.
 */
export const PSEUDO_LEGENDARY_SPECIES = [
  "dragonite",
  "tyranitar",
  "salamence",
  "metagross",
  "garchomp",
  "hydreigon",
  "goodra",
  "kommo-o",
  "dragapult",
  "baxcalibur",
] as const;

export function isPseudoLegendarySpecies(speciesSlug: string): boolean {
  return (PSEUDO_LEGENDARY_SPECIES as readonly string[]).includes(speciesSlug);
}
