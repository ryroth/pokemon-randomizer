/**
 * Every custom rule the Battle Lab can show. A modifier is listed only when the app has a
 * real check for it, or when the entry says it is unavailable.
 * Randomized typing, randomized stats, and move pools are unavailable. The singles battle is partial.
 */

export type ModifierStatus = "supported" | "partial" | "unavailable";

export type ModifierEffect = "validation" | "battle" | "presentation";

export interface ModifierDefinition {
  id: string;
  name: string;
  description: string;
  status: ModifierStatus;
  effects: readonly ModifierEffect[];
  detail: string;
}

export const MODIFIERS: readonly ModifierDefinition[] = [
  {
    id: "shiny-availability",
    name: "Shiny Pokémon",
    description: "Whether a set may be marked shiny.",
    status: "supported",
    effects: ["validation", "presentation"],
    detail:
      "Shiny is a look. It does not change damage. The Randomizer's shiny chance only affects new rolls. Marking a Pokémon shiny in the Builder is separate, and a format can allow or refuse it.",
  },
  {
    id: "custom-typing",
    name: "Custom typing",
    description: "Replace a Pokémon's types for one set.",
    status: "supported",
    effects: ["validation", "battle"],
    detail:
      "When the format allows it, the set's types are copied onto that battle only. Same-type attack bonus, weaknesses, and immunities use those types. The species entry is unchanged. Two battles can type the same species differently.",
  },
  {
    id: "custom-base-stats",
    name: "Custom base stats",
    description: "Replace the six base stats for one set.",
    status: "supported",
    effects: ["validation", "battle"],
    detail:
      "The damage check runs the generation 9 stat formula on these base stats, then level, IVs, EVs, and Nature. A format may set a minimum, a maximum, and a total budget. Stats are not shared between battles.",
  },
  {
    id: "species-clause",
    name: "Species Clause",
    description: "Block two Pokémon of the same species.",
    status: "supported",
    effects: ["validation"],
    detail: "Checked against the species, so two forms of one species conflict.",
  },
  {
    id: "item-clause",
    name: "Item Clause",
    description: "Block two Pokémon holding the same item.",
    status: "supported",
    effects: ["validation"],
    detail: "No held item does not count as a duplicate.",
  },
  {
    id: "team-size",
    name: "Team size",
    description: "How many Pokémon a team may contain.",
    status: "supported",
    effects: ["validation"],
    detail: "Saved teams hold at most 6, so a format cannot ask for more than that.",
  },
  {
    id: "stat-budget",
    name: "Base-stat budget",
    description: "Cap the total of the six custom base stats.",
    status: "supported",
    effects: ["validation"],
    detail: "Used only when custom base stats are allowed. There is no universal cap.",
  },
  {
    id: "inherited-clauses",
    name: "Inherited clauses and banlists",
    description: "Species bans, sleep clause, evasion clause, and the rest of a preset's written rules.",
    status: "partial",
    effects: ["presentation"],
    detail:
      "The Format Explorer shows the clauses and banlist transcribed from Pokémon Showdown. The team check does not remove banned Pokémon, moves, or items, and it does not apply sleep, evasion, or OHKO rules. Those need a full battle validator.",
  },
  {
    id: "damage-preview",
    name: "Single-hit damage check",
    description: "Preview one single-target hit.",
    status: "partial",
    effects: ["battle"],
    detail:
      "Uses the generation 9 damage steps for base damage, the random roll, same-type attack bonus, and type effectiveness. Abilities, items, weather, critical hits, and spread moves are not included. Doubles formats can still preview one single-target hit.",
  },
  {
    id: "randomized-typing",
    name: "Randomized typing",
    description: "Roll a Pokémon's types during generation.",
    status: "unavailable",
    effects: [],
    detail: "Not implemented. Custom typing is chosen on the set, not rolled.",
  },
  {
    id: "randomized-stats",
    name: "Randomized base stats",
    description: "Roll a Pokémon's base stats during generation.",
    status: "unavailable",
    effects: [],
    detail: "Not implemented. Custom base stats are typed in on the set.",
  },
  {
    id: "singles-battle",
    name: "Singles battle",
    description: "Play a generation 9 singles battle on one screen.",
    status: "partial",
    effects: ["battle"],
    detail:
      "Turns, switching, fainting, and a win or a draw. Levitate, Huge Power, Pure Power, Choice Band, Choice Specs, Choice Scarf, and Life Orb are applied. A critical hit is 1 in 24 and multiplies damage by 1.5 before the random roll. Weather, status, stat stages, other abilities and items, higher critical-hit rates, AI, online play, and replays are not.",
  },
];

export const MODIFIER_STATUS_LABELS: Record<ModifierStatus, string> = {
  supported: "Supported",
  partial: "Partial",
  unavailable: "Unavailable",
};
