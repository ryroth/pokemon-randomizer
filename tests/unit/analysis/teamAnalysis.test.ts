import { describe, expect, it } from "vitest";
import { analyzeTeam, type TeamMemberInput } from "@/lib/analysis/teamAnalysis";
import { damageMultiplier, describeMultiplier, formatMultiplier, typesSuperEffectiveAgainst } from "@/lib/analysis/typeChart";
import { POKEMON_TYPES } from "@/lib/types/pokemon-type";

describe("type chart", () => {
  it("multiplies across both types", () => {
    expect(damageMultiplier("ice", ["dragon", "flying"])).toBe(4);
    expect(damageMultiplier("ground", ["flying"])).toBe(0);
    expect(damageMultiplier("ground", ["steel", "flying"])).toBe(0);
    expect(damageMultiplier("fire", ["grass", "steel"])).toBe(4);
    expect(damageMultiplier("grass", ["fire", "flying"])).toBe(0.25);
    expect(damageMultiplier("normal", ["ghost", "dark"])).toBe(0);
    expect(damageMultiplier("water", ["psychic"])).toBe(1);
  });

  it("matches the current chart for newer types", () => {
    expect(damageMultiplier("fairy", ["dragon"])).toBe(2);
    expect(damageMultiplier("dragon", ["fairy"])).toBe(0);
    expect(damageMultiplier("poison", ["steel"])).toBe(0);
    expect(damageMultiplier("ghost", ["steel"])).toBe(1);
    expect(damageMultiplier("dark", ["steel"])).toBe(1);
  });

  it("lists what beats a type", () => {
    expect(typesSuperEffectiveAgainst("fire").sort()).toEqual(["ground", "rock", "water"]);
  });

  it("has an entry for every type pair", () => {
    for (const attacker of POKEMON_TYPES) {
      for (const defender of POKEMON_TYPES) {
        expect([0, 0.5, 1, 2]).toContain(damageMultiplier(attacker, [defender]));
      }
    }
  });

  it("formats multipliers for the matrix and for screen readers", () => {
    expect(formatMultiplier(4)).toBe("4×");
    expect(formatMultiplier(0.5)).toBe("½×");
    expect(formatMultiplier(0.25)).toBe("¼×");
    expect(formatMultiplier(0)).toBe("0×");
    expect(describeMultiplier(2)).toBe("2 times damage");
    expect(describeMultiplier(0)).toBe("no damage");
    expect(describeMultiplier(0.5)).toBe("half damage");
  });
});

const swampert: TeamMemberInput = {
  label: "Swampert",
  types: ["water", "ground"],
  moves: [
    { name: "Earthquake", type: "ground", category: "physical" },
    { name: "Waterfall", type: "water", category: "physical" },
    { name: "Protect", type: "normal", category: "status" },
    { name: "Ice Punch", type: "ice", category: "physical" },
  ],
};
const talonflame: TeamMemberInput = {
  label: "Talonflame",
  types: ["fire", "flying"],
  moves: [
    { name: "Brave Bird", type: "flying", category: "physical" },
    { name: "Flare Blitz", type: "fire", category: "physical" },
    { name: "Will-O-Wisp", type: "fire", category: "status" },
    { name: "U-turn", type: "bug", category: "physical" },
  ],
};

describe("analyzeTeam", () => {
  it("counts weak, resist, and immune members per attacking type", () => {
    const analysis = analyzeTeam([swampert, talonflame]);
    const grass = analysis.defense.find((row) => row.attacker === "grass");
    expect(grass?.multipliers).toEqual([4, 0.25]);
    expect(grass).toMatchObject({ weak: 1, resist: 1, immune: 0, net: 0 });

    const electric = analysis.defense.find((row) => row.attacker === "electric");
    expect(electric?.multipliers).toEqual([0, 2]);
    expect(electric).toMatchObject({ weak: 1, resist: 0, immune: 1, net: 0 });

    const rock = analysis.defense.find((row) => row.attacker === "rock");
    expect(rock?.multipliers).toEqual([0.5, 4]);
    expect(rock?.net).toBe(0);
    expect(analysis.sharedWeaknesses).not.toContain("rock");

    const twoBirds = analyzeTeam([talonflame, { ...talonflame, label: "Talonflame 2" }]);
    expect(twoBirds.defense.find((row) => row.attacker === "rock")?.net).toBe(2);
    expect(twoBirds.sharedWeaknesses).toContain("rock");
  });

  it("keeps team order and one row per type", () => {
    const analysis = analyzeTeam([talonflame, swampert]);
    expect(analysis.defense).toHaveLength(18);
    expect(analysis.offense).toHaveLength(18);
    expect(analysis.defense[0]?.multipliers).toHaveLength(2);
  });

  it("finds offensive coverage from damaging moves only, and reports gaps", () => {
    const analysis = analyzeTeam([swampert, talonflame]);
    const grass = analysis.offense.find((row) => row.defender === "grass");
    expect(grass?.gap).toBe(false);
    expect(grass?.moves.map((move) => move.move).sort()).toEqual(["Brave Bird", "Flare Blitz", "Ice Punch", "U-turn"]);
    // Will-O-Wisp is a status move and never counts.
    expect(analysis.offense.flatMap((row) => row.moves).some((move) => move.move === "Will-O-Wisp")).toBe(false);

    const ghost = analysis.offense.find((row) => row.defender === "ghost");
    expect(ghost?.gap).toBe(true);
    expect(analysis.coverageGaps).toContain("ghost");
    expect(analysis.coverageGaps).not.toContain("grass");
  });

  it("reports nothing for an empty team", () => {
    const analysis = analyzeTeam([]);
    expect(analysis.sharedWeaknesses).toEqual([]);
    expect(analysis.coverageGaps).toEqual([]);
    expect(analysis.defense.every((row) => row.net === 0)).toBe(true);
  });
});
