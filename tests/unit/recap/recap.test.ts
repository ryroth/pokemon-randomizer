import { describe, expect, it } from "vitest";
import { buildRecap, type RecapCatalog } from "@/lib/recap/entries";
import { calculateBattleStats } from "@/lib/stats/battleStat";
import { createInitialSession } from "@/lib/randomizer/session";
import type { PokemonSet, RandomizerSession } from "@/lib/types/session";

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

function sessionWith(set: PokemonSet | undefined): RandomizerSession {
  return { ...createInitialSession(), finalizedSet: set };
}

describe("buildRecap", () => {
  const catalog: RecapCatalog = {
    pokemon: [
      {
        id: "swampert",
        speciesId: "swampert",
        nationalDexNumber: 260,
        form: "base",
        displayName: "Swampert",
        showdownName: "Swampert",
        types: ["water", "ground"],
        dexEntries: [{ text: "It can swim while towing a large ship." }],
        baseStats: { hp: 100, atk: 110, def: 90, spa: 85, spd: 90, spe: 60 },
        sprites: { sprite: null, spriteShiny: "shiny.png", artwork: "art.png", artworkShiny: "art-shiny.png" },
      },
    ],
    abilities: [{ id: "damp", showdownName: "Damp", description: "Prevents explosive moves." }],
    moves: [
      {
        id: "stealthrock",
        showdownName: "Stealth Rock",
        type: "rock",
        category: "status",
        power: null,
        accuracy: null,
        pp: 20,
        description: "Lays a trap of levitating stones.",
      },
      {
        id: "flipturn",
        showdownName: "Flip Turn",
        type: "water",
        category: "physical",
        power: 60,
        accuracy: 100,
        pp: 20,
        description: "Attacks and switches out.",
      },
      {
        id: "earthquake",
        showdownName: "Earthquake",
        type: "ground",
        category: "physical",
        power: 100,
        accuracy: 100,
        pp: 10,
        description: "Strikes everything around the user.",
      },
      {
        id: "knockoff",
        showdownName: "Knock Off",
        type: "dark",
        category: "physical",
        power: 65,
        accuracy: 100,
        pp: 20,
        description: "Knocks away the target's held item.",
      },
    ],
    items: [{ id: "leftovers", showdownName: "Leftovers", description: "Restores HP every turn." }],
    natures: [{ id: "adamant", showdownName: "Adamant", plusStat: "atk", minusStat: "spa" }],
  };

  it("stays empty until a set is finalized", () => {
    expect(buildRecap(createInitialSession(), catalog)).toEqual({ status: "empty" });
  });

  it("builds one export card whose Showdown text matches the exporter", () => {
    const recap = buildRecap(sessionWith({ ...swampertSet, nickname: "Mud", happiness: 0 }), catalog);
    expect(recap.status).toBe("ready");
    if (recap.status !== "ready") {
      return;
    }
    expect(recap.entries).toHaveLength(1);
    const entry = recap.entries[0];
    expect(entry?.speciesName).toBe("Swampert");
    expect(entry?.genus).toBe("Mud Fish Pokémon");
    expect(entry?.nickname).toBe("Mud");
    expect(entry?.dexNumber).toBe("0260");
    expect(entry?.dexText).toBe("It can swim while towing a large ship.");
    expect(entry?.itemDescription).toBe("Restores HP every turn.");
    expect(entry?.moves[0]).toMatchObject({ name: "Stealth Rock", category: "status", pp: 20 });
    expect(entry?.stats).toEqual(
      calculateBattleStats({
        base: catalog.pokemon[0]!.baseStats,
        ivs: swampertSet.ivs,
        evs: swampertSet.evs,
        level: 100,
        plusStat: "atk",
        minusStat: "spa",
      }).stats,
    );
    expect(entry?.imageUrl).toBe("art.png");
    expect(entry?.showdownText).toBe(
      [
        "Mud (Swampert) @ Leftovers",
        "Ability: Damp",
        "Happiness: 0",
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

  function shinyEntry(sprites: RecapCatalog["pokemon"][number]["sprites"]) {
    const recap = buildRecap(sessionWith({ ...swampertSet, shiny: true }), {
      ...catalog,
      pokemon: [{ ...catalog.pokemon[0]!, sprites }],
    });
    expect(recap.status).toBe("ready");
    if (recap.status !== "ready") {
      throw new Error("Expected a recap");
    }
    return recap.entries[0]!;
  }

  it("shows the shiny artwork for a shiny Pokémon and the regular artwork otherwise", () => {
    const sprites = { sprite: "sprite.png", spriteShiny: "sprite-shiny.png", artwork: "art.png", artworkShiny: "art-shiny.png" };
    expect(shinyEntry(sprites).imageUrl).toBe("art-shiny.png");
    const regular = buildRecap(sessionWith(swampertSet), { ...catalog, pokemon: [{ ...catalog.pokemon[0]!, sprites }] });
    expect(regular.status === "ready" && regular.entries[0]?.imageUrl).toBe("art.png");
  });

  it("never shows a shiny Pokémon in regular colors when shiny artwork is missing", () => {
    const sprites = { sprite: "sprite.png", spriteShiny: "sprite-shiny.png", artwork: "art.png", artworkShiny: null };
    expect(shinyEntry(sprites).imageUrl).toBe("sprite-shiny.png");
  });

  it("builds a recap for a set with fewer than four moves", () => {
    const recap = buildRecap(sessionWith({ ...swampertSet, moveIds: ["stealthrock"] }), catalog);
    expect(recap.status).toBe("ready");
    if (recap.status !== "ready") {
      return;
    }
    expect(recap.entries[0]?.moves).toHaveLength(1);
    expect(recap.entries[0]?.showdownText).toContain("- Stealth Rock");
    expect(recap.entries[0]?.showdownText).not.toContain("- Flip Turn");
  });

  it("carries the held item icon", () => {
    const recap = buildRecap(sessionWith(swampertSet), {
      ...catalog,
      items: [{ id: "leftovers", showdownName: "Leftovers", description: "Restores HP.", iconUrl: "leftovers.png" }],
    });
    expect(recap.status === "ready" && recap.entries[0]?.itemIconUrl).toBe("leftovers.png");
  });
  it("explains when the finished Pokémon is not in the catalog", () => {
    expect(buildRecap(sessionWith({ ...swampertSet, pokemonId: "missingno" }), catalog)).toEqual({
      status: "invalid",
      message: "This finished set does not match the current catalog.",
    });
  });
});
