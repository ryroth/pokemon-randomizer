import { describe, expect, it } from "vitest";
import {
  applyDraftIvPreset,
  clearDraftEvs,
  evBudgetPercent,
  IV_PRESETS,
  matchingIvPreset,
  openBuilder,
  setDraftEv,
  setDraftIv,
} from "@/lib/builder";
import { createInitialSession } from "@/lib/randomizer/session";
import { STAT_IDS } from "@/lib/types/stats";
import { MAX_IV, MIN_IV } from "@/lib/validation";

function builderSession() {
  return openBuilder({
    ...createInitialSession(),
    selectedPokemonId: "mudkip",
    evolvedPokemonId: "mudkip",
  });
}

describe("IV presets", () => {
  it("keeps every IV inside the legal range", () => {
    for (const preset of IV_PRESETS) {
      for (const stat of STAT_IDS) {
        expect(preset.ivs[stat], `${preset.id} ${stat}`).toBeGreaterThanOrEqual(MIN_IV);
        expect(preset.ivs[stat], `${preset.id} ${stat}`).toBeLessThanOrEqual(MAX_IV);
      }
    }
  });

  it("matches the Showdown spreads", () => {
    const byId = Object.fromEntries(IV_PRESETS.map((preset) => [preset.id, preset.ivs]));
    expect(byId["all-31"]).toEqual({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });
    expect(byId["min-atk"]).toEqual({ hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 });
    expect(byId["min-spe"]).toEqual({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 0 });
    expect(byId["min-atk-min-spe"]).toEqual({ hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 0 });
  });

  it("fills every IV, replacing an earlier spread, and leaves the EVs alone", () => {
    let session = setDraftIv(builderSession(), "def", 12);
    session = setDraftEv(session, "atk", 100);

    session = applyDraftIvPreset(session, "min-atk-min-spe");
    expect(session.draft.ivs).toEqual({ hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 0 });
    expect(session.draft.evs).toEqual({ atk: 100 });
  });

  it("ignores an unknown preset", () => {
    const session = builderSession();
    expect(applyDraftIvPreset(session, "nope")).toBe(session);
  });

  it("recognizes a preset and reports a custom spread as no match", () => {
    expect(matchingIvPreset(applyDraftIvPreset(builderSession(), "min-spe").draft.ivs)?.id).toBe("min-spe");
    expect(matchingIvPreset(setDraftIv(builderSession(), "hp", 30).draft.ivs)).toBeUndefined();
    expect(matchingIvPreset(undefined)).toBeUndefined();
  });
});

describe("clearing EVs", () => {
  it("goes back to blank slots", () => {
    const session = clearDraftEvs(setDraftEv(builderSession(), "spe", 200));
    expect(session.draft.evs).toBeUndefined();
  });
});

describe("EV budget percent", () => {
  it("measures against 508 and stops at 100", () => {
    expect(evBudgetPercent(0)).toBe(0);
    expect(evBudgetPercent(254)).toBe(50);
    expect(evBudgetPercent(508)).toBe(100);
    expect(evBudgetPercent(600)).toBe(100);
    expect(evBudgetPercent(Number.NaN)).toBe(0);
  });
});
