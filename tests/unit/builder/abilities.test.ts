import { describe, expect, it } from "vitest";
import { groupAbilityChoices, hiddenAbilityId } from "@/lib/builder/abilities";

describe("hiddenAbilityId", () => {
  it("returns Maushold and Venusaur's Hidden Abilities", () => {
    expect(hiddenAbilityId("maushold")).toBe("technician");
    expect(hiddenAbilityId("venusaur")).toBe("chlorophyll");
  });

  it("returns null when the form has no Hidden Ability", () => {
    expect(hiddenAbilityId("mew")).toBeNull();
    expect(hiddenAbilityId("not-a-pokemon")).toBeNull();
  });
});

describe("groupAbilityChoices", () => {
  it("lists regular abilities first and the Hidden Ability last", () => {
    expect(groupAbilityChoices(["friendguard", "cheekpouch", "technician"], "technician")).toEqual([
      { id: "abilities", label: "Abilities", abilityIds: ["friendguard", "cheekpouch"] },
      { id: "hidden", label: "Hidden Ability", abilityIds: ["technician"] },
    ]);
  });

  it("omits the Hidden Ability section when the form has none", () => {
    expect(groupAbilityChoices(["synchronize"], null)).toEqual([
      { id: "abilities", label: "Abilities", abilityIds: ["synchronize"] },
    ]);
  });
});
