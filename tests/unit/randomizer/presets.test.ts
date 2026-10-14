import { describe, expect, it } from "vitest";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import {
  configForPreset,
  deleteRandomizerPreset,
  parseStoredPresets,
  saveRandomizerPreset,
} from "@/lib/randomizer/presets";

describe("randomizer presets", () => {
  it("saves the current filters without the roll seed and loads them back", () => {
    const config = {
      ...DEFAULT_RANDOMIZER_CONFIG,
      generations: [1, 2] as typeof DEFAULT_RANDOMIZER_CONFIG.generations,
      randomizeMoves: true,
      seed: "do-not-keep",
    };
    const saved = saveRandomizerPreset([], "  Rain  ", config);
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    expect(saved.preset.name).toBe("Rain");
    expect(saved.preset.config.generations).toEqual([1, 2]);
    expect(saved.preset.config.randomizeMoves).toBe(true);
    expect(saved.preset.config.seed).toBeUndefined();
    expect(saved.preset.config).not.toBe(config);

    const stored = parseStoredPresets(JSON.stringify(saved.presets));
    expect(stored).toHaveLength(1);
    expect(configForPreset(stored[0]?.config ?? DEFAULT_RANDOMIZER_CONFIG).generations).toEqual([1, 2]);
    expect(deleteRandomizerPreset(stored, saved.preset.id)).toEqual([]);
  });

  it("refuses a blank name and ignores junk storage", () => {
    expect(saveRandomizerPreset([], "   ", DEFAULT_RANDOMIZER_CONFIG)).toEqual({
      ok: false,
      message: "Enter a name for this preset.",
    });
    expect(parseStoredPresets("not json")).toEqual([]);
    expect(parseStoredPresets("[]")).toEqual([]);
  });
});
