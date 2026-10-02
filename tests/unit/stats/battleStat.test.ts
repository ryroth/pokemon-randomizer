import { describe, expect, it } from "vitest";
import { calculateBattleStats, calculateStat } from "@/lib/stats/battleStat";
import type { StatSpread } from "@/lib/types/stats";

const mew: StatSpread = { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };

describe("calculateStat", () => {
  it("matches a neutral level 100 spread with 31 IVs and 0 EVs", () => {
    expect(calculateStat({ stat: "hp", base: 100, iv: 31, ev: 0, level: 100, natureEffect: "neutral" })).toBe(
      341,
    );
    expect(calculateStat({ stat: "atk", base: 100, iv: 31, ev: 0, level: 100, natureEffect: "neutral" })).toBe(
      236,
    );
  });

  it("applies Adamant as 1.1× Attack and 0.9× Special Attack", () => {
    expect(calculateStat({ stat: "atk", base: 100, iv: 31, ev: 0, level: 100, natureEffect: "boost" })).toBe(
      259,
    );
    expect(calculateStat({ stat: "spa", base: 100, iv: 31, ev: 0, level: 100, natureEffect: "drop" })).toBe(
      212,
    );
  });

  it("adds 252 Attack EVs before the Nature multiplier", () => {
    expect(calculateStat({ stat: "atk", base: 100, iv: 31, ev: 252, level: 100, natureEffect: "boost" })).toBe(
      328,
    );
  });

  it("keeps a base HP of 1 at 1", () => {
    expect(calculateStat({ stat: "hp", base: 1, iv: 31, ev: 252, level: 100, natureEffect: "neutral" })).toBe(
      1,
    );
  });
});

describe("calculateBattleStats", () => {
  it("uses level 100, 31 IVs, and 0 EVs when those fields are blank", () => {
    const result = calculateBattleStats({ base: mew });
    expect(result.level).toBe(100);
    expect(result.stats.map((stat) => stat.value)).toEqual([341, 236, 236, 236, 236, 236]);
  });

  it("raises Attack and lowers Special Attack for Adamant", () => {
    const result = calculateBattleStats({
      base: mew,
      plusStat: "atk",
      minusStat: "spa",
    });
    const attack = result.stats.find((stat) => stat.stat === "atk");
    const specialAttack = result.stats.find((stat) => stat.stat === "spa");
    expect(attack).toMatchObject({ value: 259, natureEffect: "boost" });
    expect(specialAttack).toMatchObject({ value: 212, natureEffect: "drop" });
  });

  it("uses the chosen level", () => {
    const result = calculateBattleStats({ base: mew, level: 50 });
    expect(result.level).toBe(50);
    expect(result.stats[0]?.value).toBe(175);
  });
});
