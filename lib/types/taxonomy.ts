export const FORM_TYPES = [
  "base",
  "regional",
  "mega",
  "primal",
  "gmax",
  "other",
] as const;

export type FormType = (typeof FORM_TYPES)[number];

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  base: "Base forms",
  regional: "Regional forms",
  mega: "Mega Evolutions",
  primal: "Primal formes",
  gmax: "Gigantamax",
  other: "Other formes",
};

export const EVOLUTION_STAGES = ["basic", "stage1", "stage2"] as const;

export type EvolutionStage = (typeof EVOLUTION_STAGES)[number];

export const EVOLUTION_STAGE_LABELS: Record<EvolutionStage, string> = {
  basic: "Basic",
  stage1: "Stage 1",
  stage2: "Stage 2",
};

export const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type Generation = (typeof GENERATIONS)[number];

export type Gender = "M" | "F";

export type GenderRule = "male" | "female" | "mixed" | "genderless";
