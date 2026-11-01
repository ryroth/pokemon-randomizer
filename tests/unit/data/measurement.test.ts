import { describe, expect, it } from "vitest";
import {
  feetInchesToMeters,
  formatHeight,
  formatHeightBoth,
  formatWeight,
  formatWeightBoth,
  kilogramsToPounds,
  metersToFeetInches,
  poundsToKilograms,
} from "@/lib/data/measurement";

describe("measurement display", () => {
  it("shows meters and kilograms, or feet and inches and pounds", () => {
    expect(formatHeight(0.7, "metric")).toBe("0.7 m");
    expect(formatHeight(0.7, "imperial")).toBe("2 ft 4 in");
    expect(formatWeight(6.9, "metric")).toBe("6.9 kg");
    expect(formatWeight(6.9, "imperial")).toBe("15.2 lb");
    expect(formatHeightBoth(0.7)).toBe("0.7 m (2 ft 4 in)");
    expect(formatWeightBoth(6.9)).toBe("6.9 kg (15.2 lb)");
  });

  it("turns feet and inches back into meters", () => {
    const { feet, inches } = metersToFeetInches(0.7);
    expect(feet).toBe(2);
    expect(inches).toBe(4);
    expect(metersToFeetInches(feetInchesToMeters(1, 14))).toEqual({ feet: 2, inches: 2 });
    expect(kilogramsToPounds(poundsToKilograms(15.2))).toBe(15.2);
  });
});
