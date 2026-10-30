import { cloneRandomizerConfig, DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { MAX_MOVE_COUNT } from "@/lib/validation/moves";
import type { BuildingDraft, DraftLocks, RandomizerSession } from "@/lib/types/session";

export const RANDOMIZER_SESSION_STORAGE_KEY = "pokemon-randomizer.session.v1";

export function parseStoredSession(raw: string): RandomizerSession | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isSession(value)) {
      return null;
    }
    // Sessions saved before a setting existed get that setting's default.
    return sanitizeDraftBuild({
      ...value,
      config: { ...cloneRandomizerConfig(DEFAULT_RANDOMIZER_CONFIG), ...value.config },
    });
  } catch {
    return null;
  }
}

function isSession(value: unknown): value is RandomizerSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const session = value as Partial<RandomizerSession>;
  if (!session.config || typeof session.config !== "object") {
    return false;
  }
  if (!Array.isArray(session.pokemonRolls) || !Array.isArray(session.abilityOptions)) {
    return false;
  }
  if (!Array.isArray(session.moveOptions) || !Array.isArray(session.itemOptions)) {
    return false;
  }
  if (!session.draft || typeof session.draft !== "object" || !Array.isArray(session.draft.moveIds)) {
    return false;
  }
  return true;
}

function sanitizeDraftBuild(session: RandomizerSession): RandomizerSession {
  const buildingDraft = parseBuildingDraft(session.buildingDraft);
  const draftLocks = parseDraftLocks(session.draftLocks);
  if (buildingDraft && draftLocks) {
    return { ...session, buildingDraft, draftLocks };
  }
  if (!session.buildingDraft && !session.draftLocks) {
    return session;
  }
  const rest = { ...session };
  delete rest.buildingDraft;
  delete rest.draftLocks;
  return rest;
}

function parseBuildingDraft(value: unknown): BuildingDraft | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const draft = value as Partial<BuildingDraft>;
  if (typeof draft.rosterId !== "string" || !Number.isInteger(draft.index) || (draft.index ?? -1) < 0) {
    return undefined;
  }
  return { rosterId: draft.rosterId, index: draft.index as number };
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
