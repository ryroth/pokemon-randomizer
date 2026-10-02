import { describe, expect, it } from "vitest";
import { learnsetMoveIds } from "@/lib/builder/learnsets";

describe("learnsetMoveIds", () => {
  it("includes Maushold's level-up and TM moves and leaves out moves it cannot learn", () => {
    const moves = learnsetMoveIds("maushold");
    expect(moves).toContain("populationbomb");
    expect(moves).toContain("tidyup");
    expect(moves).toContain("encore");
    expect(moves).not.toContain("flamethrower");
  });

  it("includes egg moves from earlier in the line", () => {
    expect(learnsetMoveIds("venusaur")).toContain("leechseed");
  });

  it("returns nothing for an unknown form", () => {
    expect(learnsetMoveIds("not-a-pokemon")).toEqual([]);
  });
});
