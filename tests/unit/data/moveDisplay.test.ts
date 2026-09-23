import { describe, expect, it } from "vitest";
import { formatMoveAccuracy, formatMovePower } from "@/lib/data/moveDisplay";

describe("move display labels", () => {
  it("labels power and omits a number when the move has none", () => {
    expect(formatMovePower(40)).toBe("Power 40");
    expect(formatMovePower(null)).toBe("No power");
  });

  it("shows accuracy as a percentage next to power, and can't-miss when there is no check", () => {
    expect(formatMoveAccuracy(100)).toBe("Accuracy 100%");
    expect(formatMoveAccuracy(70)).toBe("Accuracy 70%");
    expect(formatMoveAccuracy(0)).toBe("Can't miss");
    expect(formatMoveAccuracy(null)).toBe("Can't miss");
  });
});
