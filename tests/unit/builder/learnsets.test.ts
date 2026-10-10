import { describe, expect, it } from "vitest";
import {
  learnMethodsForMove,
  learnsetMoveIds,
  learnsetMoveIdsByMethod,
} from "@/lib/builder/learnsets";

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

  it("returns plain move ids, never the stored method codes", () => {
    for (const id of learnsetMoveIds("pikachu")) {
      expect(id).toMatch(/^[a-z0-9]+$/);
    }
  });
});

describe("learnsetMoveIdsByMethod", () => {
  it("keeps the whole list when no method is chosen", () => {
    expect(learnsetMoveIdsByMethod("venusaur", [])).toEqual(learnsetMoveIds("venusaur"));
  });

  it("narrows to level-up, TM, egg, or tutor moves", () => {
    const levelUp = learnsetMoveIdsByMethod("venusaur", ["level-up"]);
    const tm = learnsetMoveIdsByMethod("venusaur", ["tm"]);
    const egg = learnsetMoveIdsByMethod("venusaur", ["egg"]);
    expect(levelUp).toContain("vinewhip");
    expect(tm).toContain("solarbeam");
    expect(egg).toContain("skullbash");
    expect(levelUp.length).toBeLessThan(learnsetMoveIds("venusaur").length);
    expect(tm).not.toContain("vinewhip");
  });

  it("shows moves that match any of several chosen methods", () => {
    const both = learnsetMoveIdsByMethod("venusaur", ["level-up", "egg"]);
    expect(both).toEqual(
      expect.arrayContaining([
        ...learnsetMoveIdsByMethod("venusaur", ["level-up"]),
        ...learnsetMoveIdsByMethod("venusaur", ["egg"]),
      ]),
    );
  });

  it("returns nothing for an unknown form", () => {
    expect(learnsetMoveIdsByMethod("not-a-pokemon", ["tm"])).toEqual([]);
  });
});

describe("learnMethodsForMove", () => {
  it("lists every way one move is learned", () => {
    expect(learnMethodsForMove("venusaur", "petaldance")).toEqual(["level-up", "egg"]);
    expect(learnMethodsForMove("venusaur", "charm")).toEqual(["tm", "egg"]);
  });

  it("is empty for a move that is not in the learnset", () => {
    expect(learnMethodsForMove("venusaur", "flamethrower")).toEqual([]);
  });
});
