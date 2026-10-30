import { describe, expect, it } from "vitest";
import { createSinglesBattle, submitSinglesChoice, type SinglesBattle, type SinglesChoice, type SinglesFighterInput } from "@/lib/battle/singles";
import { presetById } from "@/lib/formats/presets";
import { rulesThisAppChecks } from "@/lib/formats/schema";
import { createRng } from "@/lib/randomizer/randomUtils";
import type { PokemonType } from "@/lib/types/pokemon-type";
import { EMPTY_EVS, PERFECT_IVS, type StatSpread } from "@/lib/types/stats";

const openLab = presetById("open-lab");
const doubles = presetById("gen9doublesou");

function spread(hp: number, atk: number, def: number, spa: number, spd: number, spe: number): StatSpread {
  return { hp, atk, def, spa, spd, spe };
}

function fighter(partial: Partial<SinglesFighterInput> & Pick<SinglesFighterInput, "speciesName" | "types" | "baseStats">): SinglesFighterInput {
  return {
    speciesId: partial.speciesName.toLowerCase(),
    level: 100,
    ivs: { ...PERFECT_IVS },
    evs: { ...EMPTY_EVS },
    plusStat: null,
    minusStat: null,
    abilityId: "",
    abilityName: "",
    itemId: null,
    itemName: null,
    moves: [{ id: "tackle", name: "Tackle", type: "normal", category: "physical", power: 40, pp: 35 }],
    ...partial,
  };
}

function attack(power = 40, type: SinglesFighterInput["moves"][number]["type"] = "normal"): SinglesFighterInput["moves"] {
  return [{ id: "hit", name: "Hit", type, category: "physical", power, pp: 10 }];
}

function start(
  left: SinglesFighterInput[],
  right: SinglesFighterInput[],
  seed = "singles-test",
): SinglesBattle {
  if (!openLab) {
    throw new Error("missing open lab");
  }
  const started = createSinglesBattle({
    battleId: "battle-1",
    format: openLab,
    seed,
    sides: [
      { name: "Red", fighters: left },
      { name: "Blue", fighters: right },
    ],
  });
  if (!started.ok) {
    throw new Error(started.errors.map((error) => error.message).join(" "));
  }
  return started.battle;
}

function turn(battle: SinglesBattle, left: SinglesChoice, right: SinglesChoice): SinglesBattle {
  const first = submitSinglesChoice(battle, 0, left);
  if (!first.ok) {
    throw new Error(first.message);
  }
  const second = submitSinglesChoice(first.battle, 1, right);
  if (!second.ok) {
    throw new Error(second.message);
  }
  return second.battle;
}

function seedWithFirstRoll(crit: boolean): string {
  for (let index = 0; index < 400; index += 1) {
    const seed = `crit-scan-${index}`;
    const landed = createRng(`${seed}:0`)() < 1 / 24;
    if (landed === crit) {
      return seed;
    }
  }
  throw new Error("no seed matched that critical-hit roll");
}

function damageTaken(battle: SinglesBattle, name: string): number {
  const line = battle.log.find((entry) => entry === `${name} took ${entry.match(/took (\d+) damage/)?.[1]} damage.`);
  const match = battle.log.join("\n").match(new RegExp(`${name} took (\\d+) damage`));
  if (!match?.[1]) {
    throw new Error(`no damage for ${name} in ${line ?? battle.log.join(" | ")}`);
  }
  return Number(match[1]);
}

describe("singles battle", () => {
  it("refuses a doubles format", () => {
    if (!doubles) {
      throw new Error("missing doubles");
    }
    const started = createSinglesBattle({
      battleId: "doubles",
      format: doubles,
      seed: "seed",
      sides: [
        { name: "Red", fighters: [fighter({ speciesName: "A", types: ["normal"], baseStats: spread(50, 50, 50, 50, 50, 50) })] },
        { name: "Blue", fighters: [fighter({ speciesName: "B", types: ["normal"], baseStats: spread(50, 50, 50, 50, 50, 50) })] },
      ],
    });
    expect(started.ok).toBe(false);
    if (started.ok) {
      return;
    }
    expect(started.errors.some((error) => error.message.includes("Doubles"))).toBe(true);
  });

  it("copies the fighters so a later edit does not change this battle", () => {
    const types: PokemonType[] = ["fire"];
    const battle = start(
      [fighter({ speciesName: "Ace", types, baseStats: spread(80, 80, 80, 80, 80, 80) })],
      [fighter({ speciesName: "Foe", types: ["grass"], baseStats: spread(80, 80, 80, 80, 80, 80) })],
    );
    types[0] = "water";
    expect(battle.sides[0].fighters[0]?.types).toEqual(["fire"]);
  });

  it("lets the faster Pokémon move first and knock out a slower one before it moves", () => {
    const battle = turn(
      start(
        [fighter({ speciesName: "Fast", types: ["normal"], baseStats: spread(80, 200, 80, 80, 80, 200), moves: attack(120) })],
        [fighter({ speciesName: "Slow", types: ["normal"], baseStats: spread(20, 200, 20, 20, 20, 10), level: 50, moves: attack(120) })],
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(battle.log.join("\n")).toContain("Fast used Hit.");
    expect(battle.log.join("\n")).not.toContain("Slow used Hit.");
    expect(battle.phase).toBe("end");
    expect(battle.winner).toBe(0);
    expect(battle.log.at(-1)).toBe("Red wins.");
  });

  it("asks for a replacement after a faint and then continues", () => {
    const battle = turn(
      start(
        [
          fighter({ speciesName: "Lead", types: ["normal"], baseStats: spread(20, 10, 20, 20, 20, 10), level: 1 }),
          fighter({ speciesName: "Next", types: ["water"], baseStats: spread(80, 80, 80, 80, 80, 80) }),
        ],
        [fighter({ speciesName: "Hitter", types: ["normal"], baseStats: spread(80, 200, 80, 80, 80, 200), moves: attack(120) })],
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(battle.phase).toBe("switch");
    expect(battle.mustSwitch).toEqual([true, false]);
    const sent = submitSinglesChoice(battle, 0, { kind: "switch", index: 1 });
    expect(sent.ok).toBe(true);
    if (!sent.ok) {
      return;
    }
    expect(sent.battle.phase).toBe("choose");
    expect(sent.battle.sides[0].fighters[sent.battle.sides[0].active]?.speciesName).toBe("Next");
    expect(sent.battle.turn).toBe(2);
  });

  it("switches before the opponent's move and clears a Choice lock", () => {
    const opened = start(
      [
        fighter({
          speciesName: "Band",
          types: ["normal"],
          baseStats: spread(100, 100, 100, 100, 100, 50),
          itemId: "choiceband",
          itemName: "Choice Band",
          moves: [
            { id: "one", name: "One", type: "normal", category: "physical", power: 40, pp: 10 },
            { id: "two", name: "Two", type: "normal", category: "physical", power: 40, pp: 10 },
          ],
        }),
        fighter({ speciesName: "Bench", types: ["water"], baseStats: spread(100, 100, 100, 100, 100, 50) }),
      ],
      [fighter({ speciesName: "Foe", types: ["normal"], baseStats: spread(100, 50, 100, 100, 100, 40) })],
    );
    const locked = turn(opened, { kind: "move", index: 0 }, { kind: "move", index: 0 });
    const rejected = submitSinglesChoice(locked, 0, { kind: "move", index: 1 });
    expect(rejected.ok).toBe(false);
    if (rejected.ok) {
      return;
    }
    expect(rejected.message).toContain("One");
    const switched = turn(locked, { kind: "switch", index: 1 }, { kind: "move", index: 0 });
    expect(switched.log.join("\n")).toContain("Red sent out Bench.");
    expect(switched.log.join("\n")).toContain("Bench took");
    const back = turn(switched, { kind: "switch", index: 0 }, { kind: "move", index: 0 });
    const otherMove = submitSinglesChoice(back, 0, { kind: "move", index: 1 });
    expect(otherMove.ok).toBe(true);
  });

  it("applies Levitate, Huge Power, and Life Orb, and ignores anything else", () => {
    const ground = attack(90, "ground");
    const immune = turn(
      start(
        [fighter({ speciesName: "Quake", types: ["ground"], baseStats: spread(80, 100, 80, 80, 80, 80), moves: ground })],
        [fighter({ speciesName: "Floater", types: ["normal"], baseStats: spread(80, 80, 80, 80, 80, 40), abilityId: "levitate", abilityName: "Levitate" })],
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(immune.log.join("\n")).toContain("Floater's Levitate makes it immune to Ground.");
    expect(immune.sides[1].fighters[0]?.hp).toBe(immune.sides[1].fighters[0]?.maxHp);

    const plain = turn(
      start(
        [fighter({ speciesName: "Quake", types: ["ground"], baseStats: spread(80, 100, 80, 80, 80, 80), moves: ground })],
        [fighter({ speciesName: "Floater", types: ["normal"], baseStats: spread(80, 80, 80, 80, 80, 40), abilityId: "static", abilityName: "Static" })],
        "same-roll",
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    const boosted = turn(
      start(
        [fighter({ speciesName: "Quake", types: ["ground"], baseStats: spread(80, 100, 80, 80, 80, 80), moves: ground, abilityId: "hugepower", abilityName: "Huge Power" })],
        [fighter({ speciesName: "Floater", types: ["normal"], baseStats: spread(80, 80, 80, 80, 80, 40), abilityId: "static", abilityName: "Static" })],
        "same-roll",
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(plain.log.join("\n")).toContain("Static is not applied");
    expect(damageTaken(boosted, "Floater")).toBeGreaterThan(damageTaken(plain, "Floater"));

    const orb = turn(
      start(
        [fighter({ speciesName: "Quake", types: ["ground"], baseStats: spread(80, 100, 80, 80, 80, 80), moves: ground, itemId: "lifeorb", itemName: "Life Orb" })],
        [fighter({ speciesName: "Floater", types: ["normal"], baseStats: spread(200, 80, 80, 80, 80, 40), abilityId: "static", abilityName: "Static" })],
        "same-roll",
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(damageTaken(orb, "Floater")).toBeGreaterThan(damageTaken(plain, "Floater"));
    const attacker = orb.sides[0].fighters[0];
    expect(attacker?.hp).toBeLessThan(attacker?.maxHp ?? 0);
    expect(orb.log.join("\n")).toContain("hurt by its Life Orb");
  });

  it("ends in a draw when Life Orb recoil faints the last attacker", () => {
    const battle = turn(
      start(
        [fighter({ speciesName: "Glass", types: ["normal"], baseStats: spread(1, 200, 80, 80, 80, 200), itemId: "lifeorb", itemName: "Life Orb", moves: attack(200) })],
        [fighter({ speciesName: "Frail", types: ["normal"], baseStats: spread(20, 1, 20, 20, 20, 10), level: 1 })],
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(battle.phase).toBe("end");
    expect(battle.winner).toBeNull();
    expect(battle.log.at(-1)).toBe("The battle is a draw.");
  });

  it("announces a critical hit only when the 1-in-24 roll lands", () => {
    const critSeed = seedWithFirstRoll(true);
    const crit = turn(
      start(
        [fighter({ speciesName: "Ace", types: ["normal"], baseStats: spread(80, 180, 80, 80, 80, 120), moves: attack(200) })],
        [fighter({ speciesName: "Foe", types: ["normal"], baseStats: spread(20, 1, 20, 20, 20, 10), level: 1 })],
        critSeed,
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(crit.log).toContain("A critical hit!");
    expect(crit.log.join("\n")).not.toContain("Foe used");

    const quietSeed = seedWithFirstRoll(false);
    const quiet = turn(
      start(
        [fighter({ speciesName: "Ace", types: ["normal"], baseStats: spread(80, 180, 80, 80, 80, 120), moves: attack(200) })],
        [fighter({ speciesName: "Foe", types: ["normal"], baseStats: spread(20, 1, 20, 20, 20, 10), level: 1 })],
        quietSeed,
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(quiet.log.join("\n")).not.toContain("A critical hit!");
  });

  it("tells a singles format about the battle and leaves doubles unplayed", () => {
    expect(openLab).toBeDefined();
    expect(doubles).toBeDefined();
    if (!openLab || !doubles) {
      return;
    }
    expect(rulesThisAppChecks(openLab).join(" ")).toContain("1-in-24 critical hit");
    expect(rulesThisAppChecks(doubles).join(" ")).toContain("Doubles is not played");
    expect(rulesThisAppChecks(doubles).join(" ")).not.toContain("1-in-24");
  });

  it("keeps two battles from sharing HP", () => {
    const left = [fighter({ speciesName: "Ace", types: ["fire"], baseStats: spread(80, 120, 80, 80, 80, 90), moves: attack(80, "fire") })];
    const right = [fighter({ speciesName: "Plant", types: ["grass"], baseStats: spread(120, 40, 80, 80, 80, 40) })];
    const first = turn(start(left, right, "one"), { kind: "move", index: 0 }, { kind: "move", index: 0 });
    const second = start(left, right, "two");
    expect(first.sides[1].fighters[0]?.hp).toBeLessThan(second.sides[1].fighters[0]?.hp ?? 0);
    expect(second.sides[1].fighters[0]?.hp).toBe(second.sides[1].fighters[0]?.maxHp);
  });

  it("uses a custom type only inside that battle", () => {
    const defender = [fighter({ speciesName: "Plant", types: ["grass"], baseStats: spread(200, 40, 80, 80, 80, 40) })];
    const fire = turn(
      start(
        [fighter({ speciesName: "Ace", types: ["fire"], baseStats: spread(80, 100, 80, 80, 80, 90), moves: attack(80, "fire") })],
        defender,
        "typed",
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    const normal = turn(
      start(
        [fighter({ speciesName: "Ace", types: ["normal"], baseStats: spread(80, 100, 80, 80, 80, 90), moves: attack(80, "normal") })],
        defender,
        "typed",
      ),
      { kind: "move", index: 0 },
      { kind: "move", index: 0 },
    );
    expect(fire.log.join("\n")).toContain("super effective");
    expect(damageTaken(fire, "Plant")).toBeGreaterThan(damageTaken(normal, "Plant"));
  });
});
