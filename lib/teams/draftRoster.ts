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
  allDraftRosters,
  clonePokemonSet,
  createTeamId,
  normalizeTeamName,
  receivingDraftRoster,
  replaceSetOnTeam,
  rosterAcceptsAdds,
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
      /** True when this add filled the team it joined. The next add starts a different team. */
      full: boolean;
      /** True when this Pokémon opened a team because the previous one could not take another. */
      startedNew: boolean;
    }
  | { ok: false; message: string };

export type UnbuiltImportResult =
  | { ok: true; box: TeamBox; rosterId: string; teamName: string; added: number }
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
  const rosters = allDraftRosters(box);
  const current = receivingDraftRoster(box);
  const slot: DraftRosterSlot = { status: "draft", pokemon: cloneDrafted(pokemon) };
  if (!current) {
    const roster: DraftRoster = {
      id: createTeamId(),
      name: unusedTeamName(box),
      slots: [slot],
    };
    return {
      ok: true,
      box: commitRosters(box, [...rosters, roster], roster.id),
      rosterId: roster.id,
      teamName: roster.name,
      slot: 1,
      full: false,
      startedNew: rosters.length > 0,
    };
  }
  const slots: DraftRosterSlot[] = [...current.slots, slot];
  const roster: DraftRoster = { ...current, slots };
  return {
    ok: true,
    box: commitRosters(
      box,
      rosters.map((candidate) => (candidate.id === roster.id ? roster : candidate)),
      roster.id,
    ),
    rosterId: roster.id,
    teamName: roster.name,
    slot: slots.length,
    full: slots.length === TEAM_SIZE,
    startedNew: false,
  };
}

/**
 * Puts pasted Pokémon that are not built yet onto a draft team.
 * "active" fills the team that is still accepting Pokémon. "new" always opens another team.
 */
export function importDraftsToRoster(
  box: TeamBox,
  pokemon: readonly DraftedPokemon[],
  target: "active" | "new",
): UnbuiltImportResult {
  if (pokemon.length === 0) {
    return { ok: false, message: "There are no Pokémon to import." };
  }
  if (pokemon.length > TEAM_SIZE) {
    return { ok: false, message: `A team holds ${TEAM_SIZE} Pokémon, and this paste has ${pokemon.length}.` };
  }
  const drafted = pokemon.map((entry) => cloneDrafted(entry));
  const rosters = allDraftRosters(box);
  const current = target === "active" ? receivingDraftRoster(box) : undefined;
  if (target === "active" && !current && rosters.length > 0) {
    const named = rosters.find((roster) => roster.id === box.activeDraftRosterId) ?? rosters[rosters.length - 1];
    return {
      ok: false,
      message: named && named.slots.length >= TEAM_SIZE
        ? `${named.name} is full. Import these as a new team instead.`
        : `${named?.name ?? "This team"} is already being built. Import these as a new team instead.`,
    };
  }
  if (target === "active" && current) {
    const open = TEAM_SIZE - current.slots.length;
    if (drafted.length > open) {
      return {
        ok: false,
        message:
          open === 0
            ? `${current.name} is full. Import these as a new team instead.`
            : `${current.name} has ${open} open ${open === 1 ? "slot" : "slots"}, and this paste has ${drafted.length} Pokémon. Import them as a new team instead.`,
      };
    }
    const slots: DraftRosterSlot[] = [
      ...current.slots,
      ...drafted.map((entry) => ({ status: "draft" as const, pokemon: entry })),
    ];
    const roster: DraftRoster = { ...current, slots };
    return {
      ok: true,
      box: commitRosters(
        box,
        rosters.map((candidate) => (candidate.id === roster.id ? roster : candidate)),
        roster.id,
      ),
      rosterId: roster.id,
      teamName: roster.name,
      added: drafted.length,
    };
  }
  const roster: DraftRoster = {
    id: createTeamId(),
    name: unusedTeamName(box),
    slots: drafted.map((entry) => ({ status: "draft", pokemon: entry })),
  };
  return {
    ok: true,
    box: commitRosters(box, [...rosters, roster], roster.id),
    rosterId: roster.id,
    teamName: roster.name,
    added: drafted.length,
  };
}

/** Points the next randomized Pokémon at a draft team that still has room. */
export function focusDraftRoster(box: TeamBox, rosterId: string): TeamBox {
  const rosters = allDraftRosters(box);
  const roster = rosters.find((candidate) => candidate.id === rosterId);
  if (!roster || !rosterAcceptsAdds(roster)) {
    return box;
  }
  return commitRosters(box, rosters, roster.id);
}

/** Drops one unbuilt Pokémon and shifts the later ones forward. Refused once building has started. */
export function removeDraftFromRoster(box: TeamBox, rosterId: string, index: number): DraftRemoveResult {
  const rosters = allDraftRosters(box);
  const roster = rosters.find((candidate) => candidate.id === rosterId);
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
  const remaining = slots.length === 0
    ? rosters.filter((candidate) => candidate.id !== roster.id)
    : rosters.map((candidate) => (candidate.id === roster.id ? { ...roster, slots } : candidate));
  const activeId = slots.length === 0 && box.activeDraftRosterId === roster.id
    ? (remaining.find((candidate) => rosterAcceptsAdds(candidate))?.id ?? null)
    : (box.activeDraftRosterId ?? roster.id);
  return {
    ok: true,
    box: commitRosters(box, remaining, activeId),
    teamName,
    slot: index + 1,
  };
}

export function renameDraftRoster(
  box: TeamBox,
  rosterId: string,
  name: string,
): { ok: true; box: TeamBox; teamName: string } | { ok: false; message: string } {
  const rosters = allDraftRosters(box);
  const roster = rosters.find((candidate) => candidate.id === rosterId);
  if (!roster) {
    return { ok: false, message: "There is no team waiting to be built." };
  }
  const teamName = normalizeTeamName(name);
  if (!teamName) {
    return { ok: false, message: "Enter a team name." };
  }
  return {
    ok: true,
    box: commitRosters(
      box,
      rosters.map((candidate) => (candidate.id === roster.id ? { ...roster, name: teamName } : candidate)),
      box.activeDraftRosterId ?? null,
    ),
    teamName,
  };
}

/**
 * Writes a finished set onto one draft slot. The sixth finished set becomes a normal team and
 * the roster is cleared. A later edit of that team writes onto the saved slot.
 */
export function writeBuiltDraft(box: TeamBox, rosterId: string, index: number, set: PokemonSet): DraftWriteResult {
  const rosters = allDraftRosters(box);
  const roster = rosters.find((candidate) => candidate.id === rosterId);
  if (roster) {
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
      const remaining = rosters.filter((candidate) => candidate.id !== roster.id);
      const nextActive = remaining.some((candidate) => candidate.id === box.activeDraftRosterId)
        ? (box.activeDraftRosterId ?? null)
        : (remaining.find((candidate) => rosterAcceptsAdds(candidate))?.id ?? null);
      return {
        ok: true,
        box: commitRosters({ ...box, teams, activeTeamId: team.id }, remaining, nextActive),
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
      box: commitRosters(
        box,
        rosters.map((candidate) => (candidate.id === roster.id ? { ...roster, slots } : candidate)),
        box.activeDraftRosterId ?? null,
      ),
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

function commitRosters(box: TeamBox, rosters: DraftRoster[], activeDraftRosterId: string | null): TeamBox {
  const next: TeamBox = { activeTeamId: box.activeTeamId, teams: box.teams };
  if (rosters.length === 0) {
    return next;
  }
  next.draftRosters = rosters;
  if (activeDraftRosterId && rosters.some((roster) => roster.id === activeDraftRosterId)) {
    next.activeDraftRosterId = activeDraftRosterId;
  }
  return next;
}

function unusedTeamName(box: TeamBox): string {
  const used = new Set(box.teams.map((team) => team.name));
  for (const roster of allDraftRosters(box)) {
    used.add(roster.name);
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

/** Copies a stored draft, including parts an import filled in before the builder. */
export function cloneSetDraft(draft: PokemonSetDraft): PokemonSetDraft {
  const next: PokemonSetDraft = {
    pokemonId: draft.pokemonId,
    moveIds: padMoveIds(draft.moveIds),
  };
  if (draft.abilityId) {
    next.abilityId = draft.abilityId;
  }
  if (draft.itemId !== undefined) {
    next.itemId = draft.itemId;
  }
  if (draft.shiny) {
    next.shiny = true;
  }
  if (draft.natureId) {
    next.natureId = draft.natureId;
  }
  if (draft.teraType) {
    next.teraType = draft.teraType;
  }
  if (draft.gender) {
    next.gender = draft.gender;
  }
  if (draft.level !== undefined) {
    next.level = draft.level;
  }
  if (draft.nickname) {
    next.nickname = draft.nickname;
  }
  if (draft.happiness !== undefined) {
    next.happiness = draft.happiness;
  }
  if (draft.evs && Object.keys(draft.evs).length > 0) {
    next.evs = { ...draft.evs };
  }
  if (draft.ivs && Object.keys(draft.ivs).length > 0) {
    next.ivs = { ...draft.ivs };
  }
  if (draft.customTypes) {
    next.customTypes = [...draft.customTypes];
  }
  if (draft.customBaseStats) {
    next.customBaseStats = { ...draft.customBaseStats };
  }
  return next;
}

function cloneDrafted(pokemon: DraftedPokemon): DraftedPokemon {
  return {
    draft: cloneSetDraft(pokemon.draft),
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
