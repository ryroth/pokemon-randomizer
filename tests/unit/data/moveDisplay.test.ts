import { describe, expect, it } from "vitest";
import { formatMoveAccuracy, formatMovePower, formatMoveTableAccuracy, formatMoveTablePower, formatMoveTablePp } from "@/lib/data/moveDisplay";

describe("move display labels", () => {
  it("labels power and omits a number when the move has none", () => {
    expect(formatMovePower(40)).toBe("Power 40");
    expect(formatMovePower(null)).toBe("No power");
    expect(formatMovePower(1)).toBe("No power");
  });

  it("shows accuracy as a percentage next to power, and can't-miss when there is no check", () => {
    expect(formatMoveAccuracy(100)).toBe("Accuracy 100%");
    expect(formatMoveAccuracy(70)).toBe("Accuracy 70%");
    expect(formatMoveAccuracy(0)).toBe("Can't miss");
    expect(formatMoveAccuracy(null)).toBe("Can't miss");
  });

  it("uses a dash in the move table when power, accuracy, or PP is missing", () => {
    expect(formatMoveTablePower(55)).toBe("55");
    expect(formatMoveTablePower(0)).toBe("—");
    expect(formatMoveTablePower(null)).toBe("—");
    expect(formatMoveTablePower(1)).toBe("—");
    expect(formatMoveTableAccuracy(100)).toBe("100%");
    expect(formatMoveTableAccuracy(null)).toBe("—");
    expect(formatMoveTablePp(24)).toBe("24");
    expect(formatMoveTablePp(null)).toBe("—");
  });
});
