import { describe, expect, it } from "vitest";
import { EMPTY_EVS } from "@/lib/types/stats";
import { maxEvForStat, validateEvs } from "@/lib/validation/ev";

describe("validateEvs", () => {
  it("accepts a 508 spread with a 252 cap", () => {
    const result = validateEvs({
      hp: 252,
      atk: 252,
      def: 0,
      spa: 0,
      spd: 4,
      spe: 0,
    });

    expect(result.ok).toBe(true);
  });

  it("accepts a 0 spread", () => {
    const result = validateEvs(EMPTY_EVS);
    expect(result.ok).toBe(true);
  });

  it("rejects a total above 508", () => {
    const result = validateEvs({
      hp: 252,
      atk: 252,
      def: 8,
      spa: 0,
      spd: 0,
      spe: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.code === "evs.total-limit")).toBe(true);
    }
  });

  it("leaves only the remaining EVs for the other stats", () => {
    const evs = { atk: 252, spe: 252 };
    expect(maxEvForStat(evs, "def")).toBe(4);
    expect(maxEvForStat(evs, "hp")).toBe(4);
    expect(maxEvForStat(evs, "atk")).toBe(252);
  });

  it("rejects a single stat above 252", () => {
    const result = validateEvs({
      hp: 253,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.code === "evs.stat-limit")).toBe(true);
    }
  });
});
