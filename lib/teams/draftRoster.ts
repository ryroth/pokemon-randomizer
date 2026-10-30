import {
  abilityLockedByRandomizer,
  itemLockedByRandomizer,
  moveSlotLockedByRandomizer,
  pendingRandomizerSteps,
} from "@/lib/builder/locks";
import { battlePokemonId } from "@/lib/randomizer/session";
import { MAX_MOVE_COUNT } from "@/lib/validation/moves";
import type { DraftedPokemon, DraftLocks, PokemonSet, PokemonSetDraft } from "@/lib/types/session";
import {
  clonePokemonSet,
  createTeamId,
  normalizeTeamName,
  replaceSetOnTeam,
  TEAM_SIZE,
  type DraftRoster,
  type DraftRosterSlot,
  type TeamBox,
} from "@/lib/teams/teams";
import type { RandomizerSession } from "@/lib/types/session";

export type AddDraftResult =
  | {
      ok: true;
      box: TeamBox;
      rosterId: string;
      teamName: string;
      slot: number;
      full: boolean;
    }
  | { ok: false; message: string };

export type DraftRemoveResult =
  | { ok: true; box: TeamBox; teamName: string; slot: number }
  | { ok: false; message: string };

export type DraftWriteResult =
  | {
      ok: true;
      box: TeamBox;
      promoted: boolean;
      teamId: string;
      teamName: string;
      slot: number;
      nextIndex: number | null;
    }
  | { ok: false; message: string };

/** The Pokémon on screen, with the locks from the randomizers that already ran. */
export function draftedPokemonFromSession(session: RandomizerSession): DraftedPokemon | null {
  const pokemonId = battlePokemonId(session);
  if (!pokemonId || pendingRandomizerSteps(session).length > 0) {
    return null;
  }
  const moveIds = padMoveIds(session.draft.moveIds);
  return {
    draft: snapshotDraft(session.draft, pokemonId, moveIds),
    locks: {
      ability: abilityLockedByRandomizer(session),
      item: itemLockedByRandomizer(session),
      moveSlots: moveIds.map((_, slot) => moveSlotLockedByRandomizer(session, slot)),
    },
  };
}

export function addDraftToRoster(box: TeamBox, pokemon: DraftedPokemon): AddDraftResult {
  const current = box.draftRoster;
  if (current?.slots.some((slot) => slot.status === "built")) {
    return { ok: false, message: "Finish building this team before adding another Pokémon." };
  }
  if ((current?.slots.length ?? 0) >= TEAM_SIZE) {
    return { ok: false, message: `This team already has ${TEAM_SIZE} Pokémon.` };
  }
  const roster: DraftRoster = current ?? {
    id: createTeamId(),
    name: unusedTeamName(box),
    slots: [],
  };
  const slots: DraftRosterSlot[] = [...roster.slots, { status: "draft", pokemon: cloneDrafted(pokemon) }];
  const draftRoster: DraftRoster = { ...roster, slots };
  return {
    ok: true,
    box: { ...box, draftRoster },
    rosterId: draftRoster.id,
    teamName: draftRoster.name,
    slot: slots.length,
    full: slots.length === TEAM_SIZE,
  };
}

/** Drops one unbuilt Pokémon and shifts the later ones forward. Refused once building has started. */
export function removeDraftFromRoster(box: TeamBox, index: number): DraftRemoveResult {
  const roster = box.draftRoster;
  if (!roster) {
    return { ok: false, message: "There is no team waiting to be built." };
  }
  if (roster.slots.some((slot) => slot.status === "built")) {
    return { ok: false, message: "This team is already being built." };
  }
  if (!Number.isInteger(index) || index < 0 || index >= roster.slots.length) {
    return { ok: false, message: "That slot is already empty." };
  }
  const slots = roster.slots.filter((_, slot) => slot !== index);
  const teamName = roster.name;
  if (slots.length === 0) {
    return { ok: true, box: boxWithoutRoster(box), teamName, slot: index + 1 };
  }
  return {
    ok: true,
    box: { ...box, draftRoster: { ...roster, slots } },
    teamName,
    slot: index + 1,
  };
}

export function renameDraftRoster(box: TeamBox, name: string): { ok: true; box: TeamBox; teamName: string } | { ok: false; message: string } {
  const roster = box.draftRoster;
  if (!roster) {
    return { ok: false, message: "There is no team waiting to be built." };
  }
  const teamName = normalizeTeamName(name);
  if (!teamName) {
    return { ok: false, message: "Enter a team name." };
  }
  return {
    ok: true,
    box: { ...box, draftRoster: { ...roster, name: teamName } },
    teamName,
  };
}

/**
 * Writes a finished set onto one draft slot. The sixth finished set becomes a normal team and
 * the roster is cleared. A later edit of that team writes onto the saved slot.
 */
export function writeBuiltDraft(box: TeamBox, rosterId: string, index: number, set: PokemonSet): DraftWriteResult {
  const roster = box.draftRoster;
  if (roster && roster.id === rosterId) {
    if (!Number.isInteger(index) || index < 0 || index >= roster.slots.length) {
      return { ok: false, message: "That Pokémon is no longer on the team." };
    }
    const slots = roster.slots.map((slot, slotIndex) =>
      slotIndex === index ? { status: "built" as const, set: clonePokemonSet(set) } : slot,
    );
    const finished = slots.length === TEAM_SIZE && slots.every((slot) => slot.status === "built");
    if (finished) {
      const sets = slots.flatMap((slot) => (slot.status === "built" ? [slot.set] : []));
      const team = { id: roster.id, name: roster.name, sets };
      const teams = box.teams.some((candidate) => candidate.id === team.id)
        ? box.teams.map((candidate) => (candidate.id === team.id ? team : candidate))
        : [...box.teams, team];
      return {
        ok: true,
        box: { activeTeamId: team.id, teams },
        promoted: true,
        teamId: team.id,
        teamName: team.name,
        slot: index + 1,
        nextIndex: null,
      };
    }
    const nextIndex = slots.findIndex((slot) => slot.status === "draft");
    return {
      ok: true,
      box: { ...box, draftRoster: { ...roster, slots } },
      promoted: false,
      teamId: roster.id,
      teamName: roster.name,
      slot: index + 1,
      nextIndex: nextIndex === -1 ? null : nextIndex,
    };
  }

  const saved = replaceSetOnTeam(box, rosterId, index, set);
  if (!saved.ok) {
    return { ok: false, message: "That Pokémon is no longer on the team." };
  }
  return {
    ok: true,
    box: saved.box,
    promoted: true,
    teamId: saved.teamId,
    teamName: saved.teamName,
    slot: saved.slot,
    nextIndex: null,
  };
}

export function firstUnbuiltIndex(roster: DraftRoster): number {
  return roster.slots.findIndex((slot) => slot.status === "draft");
}

export function builtSetsInRoster(roster: DraftRoster): PokemonSet[] {
  return roster.slots.flatMap((slot) => (slot.status === "built" ? [clonePokemonSet(slot.set)] : []));
}

function boxWithoutRoster(box: TeamBox): TeamBox {
  return { activeTeamId: box.activeTeamId, teams: box.teams };
}

function unusedTeamName(box: TeamBox): string {
  const used = new Set(box.teams.map((team) => team.name));
  if (box.draftRoster) {
    used.add(box.draftRoster.name);
  }
  let number = box.teams.length + 1;
  while (used.has(`Team ${number}`)) {
    number += 1;
  }
  return `Team ${number}`;
}

function snapshotDraft(
  draft: PokemonSetDraft,
  pokemonId: string,
  moveIds: Array<string | undefined>,
): PokemonSetDraft {
  const next: PokemonSetDraft = { pokemonId, moveIds };
  if (draft.abilityId) {
    next.abilityId = draft.abilityId;
  }
  if (draft.itemId !== undefined) {
    next.itemId = draft.itemId;
  }
  if (draft.shiny) {
    next.shiny = true;
  }
  return next;
}

function cloneDrafted(pokemon: DraftedPokemon): DraftedPokemon {
  return {
    draft: snapshotDraft(pokemon.draft, pokemon.draft.pokemonId ?? "", padMoveIds(pokemon.draft.moveIds)),
    locks: cloneLocks(pokemon.locks),
  };
}

function cloneLocks(locks: DraftLocks): DraftLocks {
  return {
    ability: locks.ability,
    item: locks.item,
    moveSlots: padLocks(locks.moveSlots),
  };
}

function padMoveIds(slots: readonly (string | undefined)[] | undefined): Array<string | undefined> {
  return Array.from({ length: MAX_MOVE_COUNT }, (_, index) => slots?.[index]);
}

function padLocks(slots: readonly boolean[] | undefined): boolean[] {
  return Array.from({ length: MAX_MOVE_COUNT }, (_, index) => Boolean(slots?.[index]));
}
