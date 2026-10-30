/** Short explanations for words a format card uses. These describe the simulator's terms. */
export const FORMAT_GLOSSARY: readonly { term: string; meaning: string }[] = [
  {
    term: "Clause",
    meaning: "A rule added on top of a normal battle, such as Species Clause or Sleep Clause.",
  },
  {
    term: "Tier",
    meaning:
      "A competitive grouping such as OU or Ubers. The card lists that tier's written rules. This app does not apply the banlist.",
  },
  {
    term: "Generation",
    meaning:
      "Which game's battle mechanics the format uses. Every format here is generation 9. The damage check and the singles battle use that formula.",
  },
  {
    term: "Species Clause",
    meaning: "A team cannot include two Pokémon of the same species. This app can check that.",
  },
  {
    term: "Item Clause",
    meaning: "A team cannot hold two of the same item. This app can check that.",
  },
  {
    term: "Sleep Clause",
    meaning:
      "Only one opposing Pokémon may be put to sleep. The singles battle does not apply status, so this is not checked.",
  },
  {
    term: "OHKO Clause",
    meaning: "Moves that always knock out, such as Fissure, are banned in the simulator. This app does not remove them.",
  },
  {
    term: "Banlist",
    meaning: "Pokémon, moves, abilities, or items the simulator rejects. Shown for context. Not checked here.",
  },
];
