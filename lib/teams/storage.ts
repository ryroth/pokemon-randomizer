import { STAT_IDS, type StatSpread } from "@/lib/types/stats";
import type { PokemonSet } from "@/lib/types/session";
import { createEmptyTeamBox, type SavedTeam, type TeamBox } from "@/lib/teams/teams";

export const TEAM_STORAGE_KEY = "pokemon-randomizer.teams.v1";

export function parseStoredTeams(raw: string): TeamBox {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isTeamBox(value)) {
      return createEmptyTeamBox();
    }
    return value;
  } catch {
    return createEmptyTeamBox();
  }
}

function isTeamBox(value: unknown): value is TeamBox {
  if (!value || typeof value !== "object") {
    return false;
  }
  const box = value as Partial<TeamBox>;
  if (!Array.isArray(box.teams) || !box.teams.every(isTeam)) {
    return false;
  }
  if (box.activeTeamId !== null && typeof box.activeTeamId !== "string") {
    return false;
  }
  if (box.activeTeamId && !box.teams.some((team) => team.id === box.activeTeamId)) {
    return false;
  }
  return true;
}

function isTeam(value: unknown): value is SavedTeam {
  if (!value || typeof value !== "object") {
    return false;
  }
  const team = value as Partial<SavedTeam>;
  return (
    typeof team.id === "string" &&
    typeof team.name === "string" &&
    Array.isArray(team.sets) &&
    team.sets.length <= 6 &&
    team.sets.every(isPokemonSet)
  );
}

function isPokemonSet(value: unknown): value is PokemonSet {
  if (!value || typeof value !== "object") {
    return false;
  }
  const set = value as Partial<PokemonSet>;
  return (
    typeof set.pokemonId === "string" &&
    (set.itemId === null || typeof set.itemId === "string") &&
    typeof set.abilityId === "string" &&
    Array.isArray(set.moveIds) &&
    set.moveIds.length === 4 &&
    set.moveIds.every((id) => typeof id === "string") &&
    isStatSpread(set.evs) &&
    isStatSpread(set.ivs) &&
    typeof set.natureId === "string" &&
    typeof set.teraType === "string" &&
    (set.gender === null || set.gender === "M" || set.gender === "F") &&
    typeof set.level === "number" &&
    typeof set.shiny === "boolean" &&
    typeof set.happiness === "number"
  );
}

function isStatSpread(value: unknown): value is StatSpread {
  if (!value || typeof value !== "object") {
    return false;
  }
  const spread = value as Partial<StatSpread>;
  return STAT_IDS.every((stat) => typeof spread[stat] === "number");
}
