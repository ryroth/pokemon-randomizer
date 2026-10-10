import type { PokemonSet } from "@/lib/types/session";

export const TEAM_SIZE = 6;

export interface SavedTeam {
  id: string;
  name: string;
  sets: PokemonSet[];
}

export interface TeamBox {
  activeTeamId: string | null;
  teams: SavedTeam[];
}

export type TeamSaveResult =
  | { ok: true; box: TeamBox; teamId: string; teamName: string; slot: number }
  | { ok: false; message: string };

export type TeamRemoveResult =
  | { ok: true; box: TeamBox; teamName: string; slot: number }
  | { ok: false; message: string };

export type TeamMoveResult =
  | { ok: true; box: TeamBox; teamName: string; fromSlot: number; toSlot: number }
  | { ok: false; message: string };

export type TeamClearResult =
  | { ok: true; box: TeamBox; teamName: string }
  | { ok: false; message: string };

export function createEmptyTeamBox(): TeamBox {
  return { activeTeamId: null, teams: [] };
}

export function setActiveTeam(box: TeamBox, teamId: string): TeamBox {
  if (!box.teams.some((team) => team.id === teamId)) {
    return box;
  }
  return { ...box, activeTeamId: teamId };
}

/** Puts this Pokémon in slot 1 of a new team and leaves every other team unchanged. */
export function saveSetToNewTeam(box: TeamBox, set: PokemonSet): TeamSaveResult {
  const team: SavedTeam = {
    id: createTeamId(),
    name: `Team ${box.teams.length + 1}`,
    sets: [clonePokemonSet(set)],
  };
  return {
    ok: true,
    box: { activeTeamId: team.id, teams: [...box.teams, team] },
    teamId: team.id,
    teamName: team.name,
    slot: 1,
  };
}

/** Fills the next open slot on the active team. A full team is left unchanged. */
export function saveSetToNextSlot(box: TeamBox, set: PokemonSet): TeamSaveResult {
  const team = box.teams.find((candidate) => candidate.id === box.activeTeamId);
  if (!team) {
    return { ok: false, message: "Save this Pokémon to a new team first." };
  }
  if (team.sets.length >= TEAM_SIZE) {
    return {
      ok: false,
      message: `${team.name} already has ${TEAM_SIZE} Pokémon. Save this one to a new team.`,
    };
  }
  const slot = team.sets.length + 1;
  const nextTeam: SavedTeam = { ...team, sets: [...team.sets, clonePokemonSet(set)] };
  return {
    ok: true,
    box: {
      activeTeamId: team.id,
      teams: box.teams.map((candidate) => (candidate.id === team.id ? nextTeam : candidate)),
    },
    teamId: team.id,
    teamName: team.name,
    slot,
  };
}

/** Drops one slot and shifts every later Pokémon forward. Other teams stay as they are. */
export function removeSetFromTeam(box: TeamBox, teamId: string, slotIndex: number): TeamRemoveResult {
  const team = box.teams.find((candidate) => candidate.id === teamId);
  if (!team) {
    return { ok: false, message: "That team is no longer saved." };
  }
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= team.sets.length) {
    return { ok: false, message: "That slot is already empty." };
  }
  const nextTeam: SavedTeam = {
    ...team,
    sets: team.sets.filter((_, index) => index !== slotIndex),
  };
  return {
    ok: true,
    box: {
      activeTeamId: box.activeTeamId,
      teams: box.teams.map((candidate) => (candidate.id === team.id ? nextTeam : candidate)),
    },
    teamName: team.name,
    slot: slotIndex + 1,
  };
}

/** Moves one Pokémon to another filled slot. The others shift to keep the team packed. */
export function moveSetToSlot(box: TeamBox, teamId: string, fromIndex: number, toIndex: number): TeamMoveResult {
  const team = box.teams.find((candidate) => candidate.id === teamId);
  if (!team) {
    return { ok: false, message: "That team is no longer saved." };
  }
  if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= team.sets.length) {
    return { ok: false, message: "That slot is already empty." };
  }
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= team.sets.length) {
    return { ok: false, message: "Choose a slot that already has a Pokémon." };
  }
  if (fromIndex === toIndex) {
    return { ok: true, box, teamName: team.name, fromSlot: fromIndex + 1, toSlot: toIndex + 1 };
  }
  const sets = [...team.sets];
  const [moved] = sets.splice(fromIndex, 1);
  if (!moved) {
    return { ok: false, message: "That slot is already empty." };
  }
  sets.splice(toIndex, 0, moved);
  return {
    ok: true,
    box: {
      activeTeamId: box.activeTeamId,
      teams: box.teams.map((candidate) => (candidate.id === team.id ? { ...team, sets } : candidate)),
    },
    teamName: team.name,
    fromSlot: fromIndex + 1,
    toSlot: toIndex + 1,
  };
}

export type TeamImportResult =
  | { ok: true; box: TeamBox; teamId: string; teamName: string; added: number }
  | { ok: false; message: string };

/**
 * Adds imported Pokémon either to the open slots of the active team or as a new team. Nothing is
 * changed when they do not fit.
 */
export function importSetsToTeam(
  box: TeamBox,
  sets: readonly PokemonSet[],
  target: "active" | "new",
): TeamImportResult {
  if (sets.length === 0) {
    return { ok: false, message: "There are no Pokémon to add." };
  }
  if (sets.length > TEAM_SIZE) {
    return { ok: false, message: `A team holds ${TEAM_SIZE} Pokémon, and this paste has ${sets.length}.` };
  }
  const cloned = sets.map(clonePokemonSet);

  if (target === "new") {
    const team: SavedTeam = { id: createTeamId(), name: `Team ${box.teams.length + 1}`, sets: cloned };
    return {
      ok: true,
      box: { activeTeamId: team.id, teams: [...box.teams, team] },
      teamId: team.id,
      teamName: team.name,
      added: cloned.length,
    };
  }

  const team = box.teams.find((candidate) => candidate.id === box.activeTeamId);
  if (!team) {
    return { ok: false, message: "There is no active team yet. Save these as a new team instead." };
  }
  const open = TEAM_SIZE - team.sets.length;
  if (cloned.length > open) {
    return {
      ok: false,
      message:
        open === 0
          ? `${team.name} is full. Save these as a new team instead.`
          : `${team.name} has ${open} open ${open === 1 ? "slot" : "slots"}, and this paste has ${cloned.length} Pokémon. Save them as a new team instead.`,
    };
  }
  const nextTeam: SavedTeam = { ...team, sets: [...team.sets, ...cloned] };
  return {
    ok: true,
    box: {
      activeTeamId: team.id,
      teams: box.teams.map((candidate) => (candidate.id === team.id ? nextTeam : candidate)),
    },
    teamId: team.id,
    teamName: team.name,
    added: cloned.length,
  };
}

/** Dropping on an empty slot lands on the last filled one, so the team stays packed. */
export function clampToFilledSlot(slotIndex: number, filledCount: number): number {
  if (filledCount <= 0) {
    return 0;
  }
  return Math.min(Math.max(slotIndex, 0), filledCount - 1);
}

/** Where a viewed slot lands after another Pokémon moves. */
export function slotIndexAfterMove(selected: number | null, fromIndex: number, toIndex: number): number | null {
  if (selected === null || fromIndex === toIndex) {
    return selected;
  }
  if (selected === fromIndex) {
    return toIndex;
  }
  if (fromIndex < toIndex && selected > fromIndex && selected <= toIndex) {
    return selected - 1;
  }
  if (toIndex < fromIndex && selected >= toIndex && selected < fromIndex) {
    return selected + 1;
  }
  return selected;
}

/** Removes one team and every Pokémon on it. The other teams stay saved. */
export function clearTeam(box: TeamBox, teamId: string): TeamClearResult {
  const team = box.teams.find((candidate) => candidate.id === teamId);
  if (!team) {
    return { ok: false, message: "That team is no longer saved." };
  }
  const teams = box.teams.filter((candidate) => candidate.id !== team.id);
  return {
    ok: true,
    box: {
      activeTeamId: box.activeTeamId === team.id ? (teams[0]?.id ?? null) : box.activeTeamId,
      teams,
    },
    teamName: team.name,
  };
}

export function clonePokemonSet(set: PokemonSet): PokemonSet {
  return {
    ...set,
    moveIds: [set.moveIds[0], set.moveIds[1], set.moveIds[2], set.moveIds[3]],
    evs: { ...set.evs },
    ivs: { ...set.ivs },
    nickname: set.nickname,
  };
}

function createTeamId(): string {
  return crypto.randomUUID();
}
