/**
 * Clues a generated card may show. Every one starts on, so the usual card stays.
 * The name and the picture are not clues: they stay on the usual card and stay hidden in a guessing round.
 */
export const CARD_FACTS = [
  "dexNumber",
  "generation",
  "bst",
  "highestStat",
  "lowestStat",
  "primaryType",
  "secondaryType",
  "bothTypes",
  "species",
  "height",
  "weight",
  "color",
  "bodyShape",
  "eggGroup",
  "cry",
  "pokedexEntry",
] as const;

export type CardFact = (typeof CARD_FACTS)[number];

export const CARD_FACT_LABELS: Record<CardFact, string> = {
  dexNumber: "Pokédex number",
  generation: "Generation",
  bst: "BST",
  highestStat: "Highest base stat",
  lowestStat: "Lowest base stat",
  primaryType: "Primary typing",
  secondaryType: "Secondary typing",
  bothTypes: "Both typings",
  species: "Species",
  height: "Height",
  weight: "Weight",
  color: "Pokédex color",
  bodyShape: "Body shape",
  eggGroup: "Egg group",
  cry: "Cry",
  pokedexEntry: "Pokédex entry",
};
