import { describe, expect, it } from "vitest";
import {
  learnMethodsForMove,
  learnsetMoveIds,
  learnsetMoveIdsByMethod,
} from "@/lib/builder/learnsets";
import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";

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

  it("gives a form with no learnset of its own the same moves as the form it changes from", () => {
    expect([...learnsetMoveIds("giratinaorigin")].sort()).toEqual([...learnsetMoveIds("giratina")].sort());
    expect([...learnsetMoveIds("dialgaorigin")].sort()).toEqual([...learnsetMoveIds("dialga")].sort());
    expect([...learnsetMoveIds("palkiaorigin")].sort()).toEqual([...learnsetMoveIds("palkia")].sort());
    expect(learnsetMoveIds("shayminsky").length).toBeGreaterThan(0);
    expect([...learnsetMoveIds("arceusfire")].sort()).toEqual([...learnsetMoveIds("arceus")].sort());
  });

  it("keeps a form's own move and the moves of the form it changes from", () => {
    const heat = learnsetMoveIds("rotomheat");
    expect(heat).toContain("overheat");
    expect(heat).toEqual(expect.arrayContaining([...learnsetMoveIds("rotom")]));
    expect(learnMethodsForMove("rotomheat", "overheat")).toEqual(["form"]);

    const crowned = learnsetMoveIds("zaciancrowned");
    expect(crowned).toContain("behemothblade");
    expect(crowned).toEqual(expect.arrayContaining([...learnsetMoveIds("zacian")]));

    expect(learnsetMoveIds("zygarde10")).toEqual(
      expect.arrayContaining([...learnsetMoveIds("zygarde")]),
    );
  });

  it("leaves Kyurem-Black its own learnset instead of adding Glaciate", () => {
    expect(learnsetMoveIds("kyuremblack")).not.toContain("glaciate");
    expect(learnsetMoveIds("kyurem")).toContain("glaciate");
  });

  it("still lists Spiky-eared Pichu's own moves", () => {
    expect(learnsetMoveIds("pichuspikyeared").length).toBeGreaterThan(10);
  });

  it("gives every form a learnset, including Unown's Hidden Power", () => {
    const catalog = loadGeneratedCatalog();
    const empty = catalog.pokemon
      .filter((form) => learnsetMoveIds(form.id).length === 0)
      .map((form) => form.id);
    expect(empty).toEqual([]);
    expect(learnsetMoveIds("unown")).toContain("hiddenpower");
    expect(learnsetMoveIds("unown")).toContain("hiddenpowerfire");
    expect(learnsetMoveIds("pikachu")).toEqual(
      expect.arrayContaining(["return", "frustration", "hiddenpower", "hiddenpowerbug"]),
    );
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
    expect(egg).toContain("curse");
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
