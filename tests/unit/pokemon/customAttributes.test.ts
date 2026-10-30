import { describe, expect, it } from "vitest";
import { showCustomStatPicker, showCustomTypePicker } from "@/lib/pokemon/customAttributes";
import type { StatSpread } from "@/lib/types/stats";

const stats: StatSpread = { hp: 40, atk: 40, def: 40, spa: 40, spd: 40, spe: 40 };

describe("builder custom attribute pickers", () => {
  it("stays closed until the change is turned on for this Pokémon", () => {
    expect(showCustomTypePicker(false, undefined)).toBe(false);
    expect(showCustomStatPicker(false, undefined)).toBe(false);
    expect(showCustomTypePicker(true, undefined)).toBe(true);
    expect(showCustomStatPicker(true, undefined)).toBe(true);
  });

  it("opens when the set already has an override", () => {
    expect(showCustomTypePicker(false, ["water"])).toBe(true);
    expect(showCustomStatPicker(false, stats)).toBe(true);
  });
});
