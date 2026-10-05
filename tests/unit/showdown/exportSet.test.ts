import { describe, expect, it } from "vitest";
import { exportShowdownSet, exportShowdownTeam } from "@/lib/showdown/exportSet";
import type { PokemonSet } from "@/lib/types/session";

const swampertSet: PokemonSet = {
  pokemonId: "swampert",
  itemId: "leftovers",
  abilityId: "damp",
  moveIds: ["stealthrock", "flipturn", "earthquake", "knockoff"],
  evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  natureId: "adamant",
  teraType: "water",
  gender: null,
  level: 100,
  shiny: false,
  happiness: 255,
};

describe("exportShowdownSet", () => {
  it("matches the Swampert golden fixture, including Tera Type", () => {
    const text = exportShowdownSet(swampertSet, {
      pokemon: "Swampert",
      ability: "Damp",
      item: "Leftovers",
      nature: "Adamant",
      moves: ["Stealth Rock", "Flip Turn", "Earthquake", "Knock Off"],
    });

    expect(text).toBe(
      [
        "Swampert @ Leftovers",
        "Ability: Damp",
        "Tera Type: Water",
        "EVs: 252 HP / 252 Atk / 4 SpD",
        "Adamant Nature",
        "- Stealth Rock",
        "- Flip Turn",
        "- Earthquake",
        "- Knock Off",
        "",
      ].join("\n"),
    );
  });

  it("includes gender, level, and shiny when they are not Showdown defaults", () => {
    const text = exportShowdownSet(
      {
        ...swampertSet,
        gender: "M",
        level: 50,
        shiny: true,
        teraType: "ground",
      },
      {
        pokemon: "Swampert",
        ability: "Damp",
        item: "Leftovers",
        nature: "Adamant",
        moves: ["Stealth Rock", "Flip Turn", "Earthquake", "Knock Off"],
      },
    );

    expect(text).toContain("Swampert (M) @ Leftovers");
    expect(text).toContain("Level: 50");
    expect(text).toContain("Shiny: Yes");
    expect(text).toContain("Tera Type: Ground");
  });

  it("writes a nickname and a non-default happiness", () => {
    const text = exportShowdownSet(
      { ...swampertSet, nickname: "Mud Fish", happiness: 0 },
      {
        pokemon: "Swampert",
        ability: "Damp",
        item: "Leftovers",
        nature: "Adamant",
        moves: ["Stealth Rock", "Flip Turn", "Earthquake", "Knock Off"],
      },
    );

    expect(text).toContain("Mud Fish (Swampert) @ Leftovers");
    expect(text).toContain("Happiness: 0");
  });

  it("separates a team with a blank line between sets", () => {
    const names = {
      pokemon: "Swampert",
      ability: "Damp",
      item: "Leftovers",
      nature: "Adamant",
      moves: ["Stealth Rock", "Flip Turn", "Earthquake", "Knock Off"] as [string, string, string, string],
    };
    const first = exportShowdownSet(swampertSet, names);
    const second = exportShowdownSet({ ...swampertSet, nickname: "Mud", pokemonId: "mudkip" }, names);
    expect(exportShowdownTeam([first, second])).toBe(`${first.trimEnd()}\n\n${second.trimEnd()}\n`);
    expect(exportShowdownTeam([])).toBe("");
  });
});
