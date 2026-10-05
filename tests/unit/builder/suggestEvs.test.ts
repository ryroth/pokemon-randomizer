import { describe, expect, it } from "vitest";
import { formatGuessedSpread, guessEvSpread, type EvGuessInput } from "@/lib/builder/suggestEvs";

const LEDIAN: EvGuessInput = {
  showdownName: "Ledian",
  baseStats: { hp: 55, atk: 35, def: 50, spa: 55, spd: 110, spe: 85 },
  types: ["bug", "flying"],
  abilityName: "Swarm",
  moves: [
    { showdownName: "Acrobatics", category: "physical" },
    { showdownName: "Brick Break", category: "physical" },
    { showdownName: "Defog", category: "status" },
    { showdownName: "Encore", category: "status" },
  ],
};

describe("guessEvSpread", () => {
  it("guesses the Showdown teambuilder spread for Ledian", () => {
    const suggestion = guessEvSpread(LEDIAN);

    expect(suggestion).toEqual({
      role: "Fast Physical Sweeper",
      plusStat: "spe",
      minusStat: "spa",
      evs: { atk: 252, spd: 4, spe: 252 },
    });
    expect(formatGuessedSpread(suggestion!)).toBe(
      "Fast Physical Sweeper: 252 Atk / 4 SpD / 252 Spe / (+Spe, −SpA)",
    );
  });

  it("waits until four moves are filled", () => {
    expect(
      guessEvSpread({
        ...LEDIAN,
        moves: [
          { showdownName: "Acrobatics", category: "physical" },
          { showdownName: "Brick Break", category: "physical" },
          { showdownName: "Defog", category: "status" },
          undefined,
        ],
      }),
    ).toBeUndefined();
  });

  it("guesses from Last Resort before the other slots are filled", () => {
    const suggestion = guessEvSpread({
      ...LEDIAN,
      moves: [{ showdownName: "Last Resort", category: "physical" }, undefined, undefined, undefined],
    });

    expect(suggestion?.role).toBe("Fast Bulky Support");
    expect(suggestion?.plusStat).toBe("spe");
    expect(suggestion?.evs.spe).toBe(252);
    expect(suggestion?.evs.hp).toBe(248);
  });

  it("treats a Choice Band on a slow attacker as a bulky band", () => {
    const suggestion = guessEvSpread({
      showdownName: "Snorlax",
      baseStats: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 },
      types: ["normal"],
      itemName: "Choice Band",
      moves: [
        { showdownName: "Body Slam", category: "physical" },
        { showdownName: "Earthquake", category: "physical" },
        { showdownName: "Crunch", category: "physical" },
        { showdownName: "Heavy Slam", category: "physical" },
      ],
    });

    expect(suggestion).toMatchObject({
      role: "Bulky Band",
      plusStat: "atk",
      minusStat: "spa",
      evs: { hp: 252, atk: 252, spd: 4 },
    });
  });

  it("puts the plus nature on Attack when Dragon Dance makes Speed free", () => {
    const suggestion = guessEvSpread({
      showdownName: "Garchomp",
      baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
      types: ["dragon", "ground"],
      moves: [
        { showdownName: "Dragon Dance", category: "status" },
        { showdownName: "Earthquake", category: "physical" },
        { showdownName: "Outrage", category: "physical" },
        { showdownName: "Stone Edge", category: "physical" },
      ],
    });

    expect(suggestion?.role).toBe("Fast Physical Sweeper");
    expect(suggestion?.plusStat).toBe("atk");
    expect(suggestion?.minusStat).toBe("spa");
    expect(suggestion?.evs.atk).toBe(252);
    expect(suggestion?.evs.spe).toBe(252);
  });

  it("guesses Ditto from Imposter without four moves", () => {
    const suggestion = guessEvSpread({
      showdownName: "Ditto",
      baseStats: { hp: 48, atk: 48, def: 48, spa: 48, spd: 48, spe: 48 },
      types: ["normal"],
      abilityName: "Imposter",
      moves: [{ showdownName: "Transform", category: "status" }, undefined, undefined, undefined],
    });

    expect(suggestion?.role).toBe("Physically Defensive");
    expect(suggestion?.plusStat).toBe("def");
    expect(suggestion?.evs.def).toBe(252);
    expect(suggestion?.evs.hp).toBe(248);
  });
});
