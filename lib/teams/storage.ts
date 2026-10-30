import { validateCustomBaseStats, validateCustomTypes } from "@/lib/pokemon/customAttributes";
import { STAT_IDS, type StatSpread } from "@/lib/types/stats";
import type { DraftedPokemon, DraftLocks, PokemonSet, PokemonSetDraft } from "@/lib/types/session";
import { MAX_MOVE_COUNT } from "@/lib/validation/moves";
import { createEmptyTeamBox, type DraftRoster, type DraftRosterSlot, type SavedTeam, type TeamBox } from "@/lib/teams/teams";

export const TEAM_STORAGE_KEY = "pokemon-randomizer.teams.v1";

export function parseStoredTeams(raw: string): TeamBox {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isTeamBox(value)) {
      return createEmptyTeamBox();
    }
    const draftRoster = parseDraftRoster((value as { draftRoster?: unknown }).draftRoster);
    const box: TeamBox = { activeTeamId: value.activeTeamId, teams: value.teams };
    if (draftRoster) {
      box.draftRoster = draftRoster;
    }
    return box;
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
    set.moveIds.length >= 1 &&
    set.moveIds.length <= 4 &&
    set.moveIds.every((id) => typeof id === "string") &&
    isStatSpread(set.evs) &&
    isStatSpread(set.ivs) &&
    typeof set.natureId === "string" &&
    typeof set.teraType === "string" &&
    (set.gender === null || set.gender === "M" || set.gender === "F") &&
    typeof set.level === "number" &&
    typeof set.shiny === "boolean" &&
    typeof set.happiness === "number" &&
    optionalCustomFields(set)
  );
}

function optionalCustomFields(set: Partial<PokemonSet>): boolean {
  if (set.customTypes !== undefined) {
    if (!Array.isArray(set.customTypes) || !validateCustomTypes(set.customTypes).ok) {
      return false;
    }
  }
  if (set.customBaseStats !== undefined) {
    if (!set.customBaseStats || typeof set.customBaseStats !== "object" || !validateCustomBaseStats(set.customBaseStats).ok) {
      return false;
    }
  }
  return true;
}

function parseDraftRoster(value: unknown): DraftRoster | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const roster = value as Partial<DraftRoster>;
  if (typeof roster.id !== "string" || typeof roster.name !== "string" || !Array.isArray(roster.slots)) {
    return undefined;
  }
  if (roster.slots.length > 6) {
    return undefined;
  }
  const slots: DraftRosterSlot[] = [];
  for (const slot of roster.slots) {
    const parsed = parseDraftSlot(slot);
    if (!parsed) {
      return undefined;
    }
    slots.push(parsed);
  }
  return { id: roster.id, name: roster.name, slots };
}

function parseDraftSlot(value: unknown): DraftRosterSlot | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const slot = value as { status?: unknown; pokemon?: unknown; set?: unknown };
  if (slot.status === "built") {
    return isPokemonSet(slot.set) ? { status: "built", set: slot.set } : undefined;
  }
  if (slot.status === "draft") {
    const pokemon = parseDraftedPokemon(slot.pokemon);
    return pokemon ? { status: "draft", pokemon } : undefined;
  }
  return undefined;
}

function parseDraftedPokemon(value: unknown): DraftedPokemon | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as { draft?: unknown; locks?: unknown };
  const draft = parsePartialDraft(record.draft);
  const locks = parseDraftLocks(record.locks);
  if (!draft || !locks) {
    return undefined;
  }
  return { draft, locks };
}

function parsePartialDraft(value: unknown): PokemonSetDraft | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const draft = value as Partial<PokemonSetDraft>;
  if (typeof draft.pokemonId !== "string" || draft.pokemonId.length === 0) {
    return undefined;
  }
  if (!Array.isArray(draft.moveIds) || draft.moveIds.length > MAX_MOVE_COUNT) {
    return undefined;
  }
  if (!draft.moveIds.every((id) => id === null || id === undefined || typeof id === "string")) {
    return undefined;
  }
  if (draft.abilityId !== undefined && typeof draft.abilityId !== "string") {
    return undefined;
  }
  if (draft.itemId !== undefined && draft.itemId !== null && typeof draft.itemId !== "string") {
    return undefined;
  }
  if (draft.shiny !== undefined && typeof draft.shiny !== "boolean") {
    return undefined;
  }
  const next: PokemonSetDraft = {
    pokemonId: draft.pokemonId,
    moveIds: Array.from({ length: MAX_MOVE_COUNT }, (_, index) => {
      const id = draft.moveIds?.[index];
      return typeof id === "string" ? id : undefined;
    }),
  };
  if (typeof draft.abilityId === "string") {
    next.abilityId = draft.abilityId;
  }
  if (draft.itemId === null || typeof draft.itemId === "string") {
    next.itemId = draft.itemId;
  }
  if (draft.shiny) {
    next.shiny = true;
  }
  return next;
}

function parseDraftLocks(value: unknown): DraftLocks | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const locks = value as Partial<DraftLocks>;
  if (typeof locks.ability !== "boolean" || typeof locks.item !== "boolean" || !Array.isArray(locks.moveSlots)) {
    return undefined;
  }
  if (locks.moveSlots.length > MAX_MOVE_COUNT || locks.moveSlots.some((slot) => typeof slot !== "boolean")) {
    return undefined;
  }
  return {
    ability: locks.ability,
    item: locks.item,
    moveSlots: Array.from({ length: MAX_MOVE_COUNT }, (_, index) => locks.moveSlots?.[index] === true),
  };
}

function isStatSpread(value: unknown): value is StatSpread {
  if (!value || typeof value !== "object") {
    return false;
  }
  const spread = value as Partial<StatSpread>;
  return STAT_IDS.every((stat) => typeof spread[stat] === "number");
}
