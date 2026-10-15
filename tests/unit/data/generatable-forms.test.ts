import { describe, expect, it } from "vitest";
import {
  isGeneratablePokemon,
  NON_GENERATABLE_POKEMON_ID_LIST,
} from "@/lib/data/generatableForms";

describe("isGeneratablePokemon", () => {
  it("rejects costume Pikachu, weather Castform, and mid-battle forms", () => {
    for (const id of NON_GENERATABLE_POKEMON_ID_LIST) {
      expect(isGeneratablePokemon({ id }), id).toBe(false);
    }
  });

  it("keeps the base forms and the three Vivillon patterns that can be rolled", () => {
    for (const id of [
      "pikachu",
      "pikachugmax",
      "castform",
      "darmanitan",
      "darmanitangalar",
      "meloetta",
      "wishiwashi",
      "mimikyu",
      "cramorant",
      "eiscue",
      "morpeko",
      "eternatus",
      "palafin",
      "raichualola",
      "vivillon",
      "vivillonfancy",
      "vivillonpokeball",
    ]) {
      expect(isGeneratablePokemon({ id }), id).toBe(true);
    }
  });

  it("rejects Vivillon patterns other than Meadow, Fancy, and Poké Ball", () => {
    expect(isGeneratablePokemon({ id: "vivillonarchipelago" })).toBe(false);
    expect(isGeneratablePokemon({ id: "vivillonicysnow" })).toBe(false);
    expect(isGeneratablePokemon({ id: "vivillon" })).toBe(true);
  });
});