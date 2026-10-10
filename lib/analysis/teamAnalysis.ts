import { damageMultiplier } from "@/lib/analysis/typeChart";
import type { MoveCategory } from "@/lib/types/catalog-entities";
import { POKEMON_TYPES, type PokemonType } from "@/lib/types/pokemon-type";

/** What the matrices need to know about one team member. Types and moves only. */
export interface TeamMemberInput {
  label: string;
  types: readonly PokemonType[];
  moves: ReadonlyArray<{ name: string; type: PokemonType; category: MoveCategory }>;
}

export interface DefenseRow {
  attacker: PokemonType;
  /** One multiplier per team member, in team order. */
  multipliers: number[];
  weak: number;
  resist: number;
  immune: number;
  /** Members that are weak minus members that resist or are immune. Above 0 means a team weakness. */
  net: number;
}

export interface OffenseRow {
  defender: PokemonType;
  /** Damaging moves on the team that hit this type super effectively. */
  moves: Array<{ member: string; move: string; type: PokemonType; multiplier: number }>;
  /** True when no damaging move on the team is super effective against this type. */
  gap: boolean;
}

export interface TeamAnalysis {
  defense: DefenseRow[];
  offense: OffenseRow[];
  /** Attacking types that more members are weak to than resist or are immune to. */
  sharedWeaknesses: PokemonType[];
  coverageGaps: PokemonType[];
}

/**
 * Defensive and offensive type coverage for a team. Uses the Pokémon's own types and the types of
 * their damaging moves. Abilities, items, and Tera types are not counted.
 */
export function analyzeTeam(members: readonly TeamMemberInput[]): TeamAnalysis {
  const defense: DefenseRow[] = POKEMON_TYPES.map((attacker) => {
    const multipliers = members.map((member) => damageMultiplier(attacker, member.types));
    const weak = multipliers.filter((value) => value > 1).length;
    const resist = multipliers.filter((value) => value > 0 && value < 1).length;
    const immune = multipliers.filter((value) => value === 0).length;
    return { attacker, multipliers, weak, resist, immune, net: weak - resist - immune };
  });

  const offense: OffenseRow[] = POKEMON_TYPES.map((defender) => {
    const moves: OffenseRow["moves"] = [];
    for (const member of members) {
      for (const move of member.moves) {
        if (move.category === "status") {
          continue;
        }
        const multiplier = damageMultiplier(move.type, [defender]);
        if (multiplier > 1) {
          moves.push({ member: member.label, move: move.name, type: move.type, multiplier });
        }
      }
    }
    return { defender, moves, gap: moves.length === 0 };
  });

  return {
    defense,
    offense,
    sharedWeaknesses: members.length === 0 ? [] : defense.filter((row) => row.net > 0).map((row) => row.attacker),
    coverageGaps: members.length === 0 ? [] : offense.filter((row) => row.gap).map((row) => row.defender),
  };
}
