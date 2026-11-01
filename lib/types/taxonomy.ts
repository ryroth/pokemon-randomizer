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
  primal: "Primal forms",
  gmax: "Gigantamax",
  other: "Other forms",
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

export const GENDER_RULES = ["male", "female", "mixed", "genderless"] as const;

export const GENDER_RULE_LABELS: Record<GenderRule, string> = {
  male: "Male only",
  female: "Female only",
  mixed: "Either gender",
  genderless: "Genderless",
};

/** The first letter of a Pokémon's display name. */
export const NAME_INITIALS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

export type NameInitial = (typeof NAME_INITIALS)[number];

/** Official PokéAPI species colors. Gray is spelled the way PokéAPI spells it. */
export const POKEDEX_COLORS = [
  "black",
  "blue",
  "brown",
  "gray",
  "green",
  "pink",
  "purple",
  "red",
  "white",
  "yellow",
] as const;

export type PokedexColor = (typeof POKEDEX_COLORS)[number];

export const POKEDEX_COLOR_LABELS: Record<PokedexColor, string> = {
  black: "Black",
  blue: "Blue",
  brown: "Brown",
  gray: "Gray",
  green: "Green",
  pink: "Pink",
  purple: "Purple",
  red: "Red",
  white: "White",
  yellow: "Yellow",
};

/** Official PokéAPI body shapes, in Pokédex order. */
export const POKEDEX_SHAPES = [
  "ball",
  "squiggle",
  "fish",
  "arms",
  "blob",
  "upright",
  "legs",
  "quadruped",
  "wings",
  "tentacles",
  "heads",
  "humanoid",
  "bug-wings",
  "armor",
] as const;

export type PokedexShape = (typeof POKEDEX_SHAPES)[number];

export const POKEDEX_SHAPE_LABELS: Record<PokedexShape, string> = {
  ball: "Ball",
  squiggle: "Squiggle",
  fish: "Fish",
  arms: "Arms",
  blob: "Blob",
  upright: "Upright",
  legs: "Legs",
  quadruped: "Quadruped",
  wings: "Wings",
  tentacles: "Tentacles",
  heads: "Heads",
  humanoid: "Humanoid",
  "bug-wings": "Bug-Wings",
  armor: "Armor",
};

/** Showdown egg groups. A form can have two. */
export const EGG_GROUPS = [
  "Monster",
  "Water 1",
  "Water 2",
  "Water 3",
  "Bug",
  "Flying",
  "Field",
  "Fairy",
  "Grass",
  "Human-Like",
  "Mineral",
  "Amorphous",
  "Ditto",
  "Dragon",
  "Undiscovered",
] as const;

export type EggGroup = (typeof EGG_GROUPS)[number];

export const TYPE_COUNT_FILTERS = ["any", "single", "dual"] as const;

export type TypeCountFilter = (typeof TYPE_COUNT_FILTERS)[number];

export const TYPE_COUNT_LABELS: Record<TypeCountFilter, string> = {
  any: "Any",
  single: "One type",
  dual: "Two types",
};

export const EVOLUTION_PROGRESSES = ["any", "can-evolve", "fully-evolved"] as const;

export type EvolutionProgress = (typeof EVOLUTION_PROGRESSES)[number];

export const EVOLUTION_PROGRESS_LABELS: Record<EvolutionProgress, string> = {
  any: "Any",
  "can-evolve": "Can still evolve",
  "fully-evolved": "Does not evolve further",
};

/** How Pokédex height and weight are shown and typed. Imperial is the default. Stored filters stay in meters and kilograms. */
export const MEASUREMENT_SYSTEMS = ["imperial", "metric"] as const;

export type MeasurementSystem = (typeof MEASUREMENT_SYSTEMS)[number];

export const MEASUREMENT_SYSTEM_LABELS: Record<MeasurementSystem, string> = {
  metric: "Metric",
  imperial: "Imperial",
};
