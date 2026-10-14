import { cloneRandomizerConfig, DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import type { RandomizerConfig } from "@/lib/types/randomizer";

export const PRESET_STORAGE_KEY = "pokemon-randomizer.presets.v1";
export const MAX_PRESET_NAME_LENGTH = 24;
export const MAX_PRESET_COUNT = 20;

export interface RandomizerPreset {
  id: string;
  name: string;
  config: RandomizerConfig;
}

export type SavePresetResult =
  | { ok: true; presets: RandomizerPreset[]; preset: RandomizerPreset }
  | { ok: false; message: string };

export function parseStoredPresets(raw: string): RandomizerPreset[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return [];
    }
    return value.flatMap((entry) => {
      const preset = normalizePreset(entry);
      return preset ? [preset] : [];
    });
  } catch {
    return [];
  }
}

export function saveRandomizerPreset(
  presets: readonly RandomizerPreset[],
  name: string,
  config: RandomizerConfig,
): SavePresetResult {
  const presetName = normalizePresetName(name);
  if (!presetName) {
    return { ok: false, message: "Enter a name for this preset." };
  }
  if (presets.length >= MAX_PRESET_COUNT) {
    return { ok: false, message: `You can save ${MAX_PRESET_COUNT} presets. Delete one to save another.` };
  }
  const preset: RandomizerPreset = {
    id: createPresetId(),
    name: presetName,
    config: configForPreset(config),
  };
  return { ok: true, presets: [...presets, preset], preset };
}

export function deleteRandomizerPreset(
  presets: readonly RandomizerPreset[],
  presetId: string,
): RandomizerPreset[] {
  return presets.filter((preset) => preset.id !== presetId);
}

/** A preset restores filters and randomizers. It does not reuse the seed from the roll that saved it. */
export function configForPreset(config: RandomizerConfig): RandomizerConfig {
  const next = cloneRandomizerConfig({
    ...cloneRandomizerConfig(DEFAULT_RANDOMIZER_CONFIG),
    ...config,
  });
  delete next.seed;
  return next;
}

export function normalizePresetName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_PRESET_NAME_LENGTH);
}

function normalizePreset(value: unknown): RandomizerPreset | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entry = value as Partial<RandomizerPreset>;
  if (typeof entry.id !== "string" || typeof entry.name !== "string" || !entry.config) {
    return undefined;
  }
  const name = normalizePresetName(entry.name);
  if (!name) {
    return undefined;
  }
  return { id: entry.id, name, config: configForPreset(entry.config) };
}

function createPresetId(): string {
  return crypto.randomUUID();
}
