import { describe, expect, it } from "vitest";
import { EMPTY_EVS } from "@/lib/types/stats";
import { validateEvs } from "@/lib/validation/ev";

describe("validateEvs", () => {
  it("accepts a 510 spread with a 252 cap", () => {
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

  it("rejects a total above 510", () => {
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
