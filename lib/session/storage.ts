import { cloneRandomizerConfig, DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import type { RandomizerSession } from "@/lib/types/session";

export const RANDOMIZER_SESSION_STORAGE_KEY = "pokemon-randomizer.session.v1";

export function parseStoredSession(raw: string): RandomizerSession | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isSession(value)) {
      return null;
    }
    // Sessions saved before a setting existed get that setting's default.
    return {
      ...value,
      config: { ...cloneRandomizerConfig(DEFAULT_RANDOMIZER_CONFIG), ...value.config },
    };
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
