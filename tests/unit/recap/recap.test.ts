import { describe, expect, it } from "vitest";
import { loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { preferredIdleAnimation } from "@/lib/recap/animation";
import { buildRecap, type RecapCatalog } from "@/lib/recap/entries";
import { calculateBattleStats } from "@/lib/stats/battleStat";
import {
  idleModelPlan,
  loadPokemonModelIndex,
  pokemonIdleModelUrl,
  pokemonShinyModelUrl,
  type PokemonModelIndex,
} from "@/lib/recap/model";
import { createInitialSession } from "@/lib/randomizer/session";
import type { PokemonSet, RandomizerSession } from "@/lib/types/session";

const index: PokemonModelIndex = {
  repository: "Pokemon-3D-api/assets",
  commit: "abc123",
  paths: [
    "regular/1.glb",
    "regular/260.glb",
    "regular/469.glb",
    "shiny/1.glb",
    "alolan/26.glb",
    "mega/3.glb",
    "megaShiny/3.glb",
    "x/6.glb",
    "gmax/6.glb",
    "primal/382.glb",
    "origin/487.glb",
    "multiform/RotomHeat.glb",
  ],
};

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

describe("preferredIdleAnimation", () => {
  it("prefers the game idle clip over later battle animations", () => {
    expect(
      preferredIdleAnimation([
        "model_skeleton|001fight_b",
        "model_skeleton|001aidle",
        "model_skeleton|001walk",
      ]),
    ).toBe("model_skeleton|001aidle");
  });

  it("accepts an Idle label and falls back to the first clip", () => {
    expect(preferredIdleAnimation(["Walk", "Idle"])).toBe("Idle");
    expect(preferredIdleAnimation(["Walk"])).toBe("Walk");
    expect(preferredIdleAnimation([])).toBeNull();
  });
});

describe("pokemonIdleModelUrl", () => {
  it("maps base, shiny, regional, mega, gmax, primal, and origin formes", () => {
    expect(pokemonIdleModelUrl({ id: "bulbasaur", nationalDexNumber: 1, form: "base" }, false, index)).toBe(
      "https://raw.githubusercontent.com/Pokemon-3D-api/assets/abc123/models/opt/regular/1.glb",
    );
    expect(pokemonIdleModelUrl({ id: "bulbasaur", nationalDexNumber: 1, form: "base" }, true, index)).toContain(
      "/shiny/1.glb",
    );
    expect(pokemonIdleModelUrl({ id: "raichualola", nationalDexNumber: 26, form: "Alola" }, false, index)).toContain(
      "/alolan/26.glb",
    );
    expect(pokemonIdleModelUrl({ id: "venusaurmega", nationalDexNumber: 3, form: "Mega" }, true, index)).toContain(
      "/megaShiny/3.glb",
    );
    expect(pokemonIdleModelUrl({ id: "charizardmegax", nationalDexNumber: 6, form: "Mega-X" }, false, index)).toContain(
      "/x/6.glb",
    );
    expect(pokemonIdleModelUrl({ id: "charizardgmax", nationalDexNumber: 6, form: "Gmax" }, false, index)).toContain(
      "/gmax/6.glb",
    );
    expect(pokemonIdleModelUrl({ id: "kyogreprimal", nationalDexNumber: 382, form: "Primal" }, false, index)).toContain(
      "/primal/382.glb",
    );
    expect(
      pokemonIdleModelUrl({ id: "giratinaorigin", nationalDexNumber: 487, form: "Origin" }, false, index),
    ).toContain("/origin/487.glb");
    expect(pokemonIdleModelUrl({ id: "rotomheat", nationalDexNumber: 479, form: "Heat" }, false, index)).toContain(
      "/multiform/RotomHeat.glb",
    );
  });

  it("keeps Yanmega on the regular model because its forme is base", () => {
    const url = pokemonIdleModelUrl({ id: "yanmega", nationalDexNumber: 469, form: "base" }, false, index);
    expect(url).toContain("/regular/469.glb");
  });

  it("uses the regular model when a shiny file was not snapshotted so the idle animation still plays", () => {
    const shinyOnlyMissing: PokemonModelIndex = { ...index, paths: ["regular/1.glb"] };
    expect(pokemonIdleModelUrl({ id: "bulbasaur", nationalDexNumber: 1, form: "base" }, true, shinyOnlyMissing)).toContain(
      "/regular/1.glb",
    );
  });

  it("uses the only published model when a forme has no separate shiny file", () => {
    expect(pokemonIdleModelUrl({ id: "raichualola", nationalDexNumber: 26, form: "Alola" }, true, index)).toContain(
      "/alolan/26.glb",
    );
  });

  it("returns null when that forme has no published model", () => {
    expect(
      pokemonIdleModelUrl({ id: "taurospaldeacombat", nationalDexNumber: 128, form: "Paldea-Combat" }, false, index),
    ).toBeNull();
  });
});

describe("shiny 3D models", () => {
  const bulbasaur = { id: "bulbasaur", nationalDexNumber: 1, form: "base" };

  it("only returns a shiny model when a separate shiny file was published", () => {
    expect(pokemonShinyModelUrl(bulbasaur, index)).toContain("/shiny/1.glb");
    expect(pokemonShinyModelUrl(bulbasaur, { ...index, paths: ["regular/1.glb"] })).toBeNull();
    expect(pokemonShinyModelUrl({ id: "raichualola", nationalDexNumber: 26, form: "Alola" }, index)).toBeNull();
    expect(pokemonShinyModelUrl({ id: "taurospaldeacombat", nationalDexNumber: 128, form: "Paldea-Combat" }, index)).toBeNull();
  });

  it("plans the regular model for a regular Pokémon and regular plus shiny textures for a shiny one", () => {
    expect(idleModelPlan(bulbasaur, false, index)).toEqual({
      src: expect.stringContaining("/regular/1.glb"),
      shinySrc: null,
    });
    expect(idleModelPlan(bulbasaur, true, index)).toEqual({
      src: expect.stringContaining("/regular/1.glb"),
      shinySrc: expect.stringContaining("/shiny/1.glb"),
    });
  });

  it("has no plan for a shiny Pokémon without a shiny model, so the shiny picture is used", () => {
    expect(idleModelPlan(bulbasaur, true, { ...index, paths: ["regular/1.glb"] })).toBeNull();
    expect(idleModelPlan(bulbasaur, true, { ...index, paths: ["shiny/1.glb"] })).toBeNull();
    expect(idleModelPlan(bulbasaur, false, { ...index, paths: [] })).toBeNull();
  });
});

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
    expect(buildRecap(createInitialSession(), catalog, index)).toEqual({ status: "empty" });
  });

  it("builds one export card whose Showdown text matches the exporter", () => {
    const recap = buildRecap(sessionWith({ ...swampertSet, nickname: "Mud", happiness: 0 }), catalog, index);
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
    expect(entry?.idleModel?.src).toContain("/regular/260.glb");
    expect(entry?.idleModel?.shinySrc).toBeNull();
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

  function shinyEntry(overrides: Partial<RecapCatalog["pokemon"][number]>, modelIndex: PokemonModelIndex = index) {
    const recap = buildRecap(
      sessionWith({ ...swampertSet, pokemonId: overrides.id ?? "swampert", shiny: true }),
      { ...catalog, pokemon: [{ ...catalog.pokemon[0]!, id: "swampert", ...overrides }] },
      modelIndex,
    );
    expect(recap.status).toBe("ready");
    if (recap.status !== "ready") {
      throw new Error("Expected a recap");
    }
    return recap.entries[0]!;
  }

  it("uses the shiny 3D model when the set is shiny and a shiny model exists", () => {
    const entry = shinyEntry({ nationalDexNumber: 1 });
    // The viewer animates the regular file, which has the idle clip, and paints the shiny file's textures on it.
    expect(entry.idleModel?.src).toContain("/regular/1.glb");
    expect(entry.idleModel?.shinySrc).toContain("/shiny/1.glb");
  });

  it("never shows a shiny Pokémon in a regular-colored 3D model", () => {
    // Swampert (#260) has a regular model but no shiny model in this index.
    const noShinyFile = shinyEntry({ nationalDexNumber: 260 });
    expect(noShinyFile.idleModel).toBeNull();
    // Alolan Raichu has one model for both colors, so there is nothing shiny to show in 3D.
    const sharedFile = shinyEntry({ id: "raichualola", form: "Alola", nationalDexNumber: 26 });
    expect(sharedFile.idleModel).toBeNull();
  });

  it("falls back to the shiny sprite, then the shiny artwork, when there is no shiny 3D model", () => {
    const sprites = { sprite: "sprite.png", spriteShiny: "sprite-shiny.png", artwork: "art.png", artworkShiny: "art-shiny.png" };
    expect(shinyEntry({ nationalDexNumber: 260, sprites }).imageUrl).toBe("sprite-shiny.png");
    expect(
      shinyEntry({ nationalDexNumber: 260, sprites: { ...sprites, spriteShiny: null } }).imageUrl,
    ).toBe("art-shiny.png");
  });

  it("explains when the finished Pokémon is not in the catalog", () => {
    expect(buildRecap(sessionWith({ ...swampertSet, pokemonId: "missingno" }), catalog, index)).toEqual({
      status: "invalid",
      message: "This finished set does not match the current catalog.",
    });
  });
});

describe("generated model index", () => {
  const catalog = loadGeneratedCatalog();
  const generated = loadPokemonModelIndex();

  function urlFor(id: string, shiny = false) {
    const form = catalog.pokemon.find((pokemon) => pokemon.id === id);
    expect(form).toBeTruthy();
    return pokemonIdleModelUrl(
      { id: form!.id, nationalDexNumber: form!.nationalDexNumber, form: form!.form },
      shiny,
      generated,
    );
  }

  it("resolves published models for the formes the recap needs to show", () => {
    expect(urlFor("bulbasaur")).toContain("/regular/1.glb");
    expect(urlFor("bulbasaur", true)).toContain("/shiny/1.glb");
    expect(urlFor("raichualola")).toContain("/alolan/26.glb");
    expect(urlFor("venusaurmega")).toContain("/mega/3.glb");
    expect(urlFor("charizardmegax")).toContain("/x/6.glb");
    expect(urlFor("charizardgmax")).toContain("/gmax/6.glb");
    expect(urlFor("kyogreprimal")).toContain("/primal/382.glb");
    expect(urlFor("giratinaorigin")).toContain("/origin/487.glb");
    expect(urlFor("yanmega")).toContain("/regular/469.glb");
    expect(urlFor("rotomheat")).toContain("/multiform/RotomHeat.glb");
    expect(urlFor("taurospaldeacombat")).toBeNull();
  });
});
