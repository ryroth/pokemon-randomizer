import { describe, expect, it } from "vitest";
import {
  collectEvolutionTargetIds,
  evolutionChoices,
  evolutionConflictContext,
  evolutionFormsConflict,
  isValidBattlePokemonId,
  maximumCompatiblePokemonCount,
} from "@/lib/data/evolution";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EMPTY_EVS } from "@/lib/types/stats";
import type { EvolutionStage, FormType } from "@/lib/types/taxonomy";

function makeForm(
  id: string,
  overrides: Partial<PokemonForm> & {
    evolutionStage?: EvolutionStage;
    formType?: FormType;
    nationalDexNumber?: number;
    displayName?: string;
  } = {},
): PokemonForm {
  const evolutionStage = overrides.evolutionStage ?? "basic";
  return {
    id,
    pokeApiId: 0,
    pokeApiSlug: id,
    name: id,
    displayName: overrides.displayName ?? id,
    showdownName: id,
    nationalDexNumber: overrides.nationalDexNumber ?? 0,
    generation: 1,
    types: ["normal"],
    abilityIds: [],
    speciesId: id,
    form: "",
    formType: overrides.formType ?? "base",
    evolutionStage,
    isBasic: evolutionStage === "basic",
    isStage1: evolutionStage === "stage1",
    isStage2: evolutionStage === "stage2",
    isPseudoLegendary: false,
    isSubLegendary: false,
    isLegendary: false,
    isMythical: false,
    isParadox: false,
    isUltraBeast: false,
    isBaby: false,
    dexEntries: [],
    sprites: { sprite: null, spriteShiny: null, artwork: null },
    baseStats: EMPTY_EVS,
    genderRule: "genderless",
    evolutionTargetIds: [],
    ...overrides,
  };
}

describe("collectEvolutionTargetIds", () => {
  it("walks later stages and skips Mega formes", () => {
    const charmander = makeForm("charmander", { evolutionStage: "basic", nationalDexNumber: 4 });
    const charmeleon = makeForm("charmeleon", { evolutionStage: "stage1", nationalDexNumber: 5 });
    const charizard = makeForm("charizard", { evolutionStage: "stage2", nationalDexNumber: 6 });
    const mega = makeForm("charizardmegax", {
      evolutionStage: "stage2",
      formType: "mega",
      nationalDexNumber: 6,
    });
    const formById = new Map(
      [charmander, charmeleon, charizard, mega].map((form) => [form.id, form]),
    );
    const evosById = new Map([
      ["charmander", ["charmeleon"]],
      ["charmeleon", ["charizard"]],
      ["charizard", ["charizardmegax"]],
      ["charizardmegax", []],
    ]);

    expect(collectEvolutionTargetIds("charmander", evosById, formById)).toEqual([
      "charmeleon",
      "charizard",
    ]);
    expect(collectEvolutionTargetIds("charizard", evosById, formById)).toEqual([]);
  });

  it("keeps Wurmple branches on the chosen path", () => {
    const wurmple = makeForm("wurmple", { evolutionStage: "basic", nationalDexNumber: 265 });
    const silcoon = makeForm("silcoon", { evolutionStage: "stage1", nationalDexNumber: 266 });
    const cascoon = makeForm("cascoon", { evolutionStage: "stage1", nationalDexNumber: 268 });
    const beautifly = makeForm("beautifly", { evolutionStage: "stage2", nationalDexNumber: 267 });
    const dustox = makeForm("dustox", { evolutionStage: "stage2", nationalDexNumber: 269 });
    const formById = new Map(
      [wurmple, silcoon, cascoon, beautifly, dustox].map((form) => [form.id, form]),
    );
    const evosById = new Map([
      ["wurmple", ["silcoon", "cascoon"]],
      ["silcoon", ["beautifly"]],
      ["cascoon", ["dustox"]],
    ]);

    expect(collectEvolutionTargetIds("wurmple", evosById, formById)).toEqual([
      "silcoon",
      "cascoon",
      "beautifly",
      "dustox",
    ]);
    expect(collectEvolutionTargetIds("silcoon", evosById, formById)).toEqual(["beautifly"]);
  });

  it("includes regional later stages such as Alolan Raichu", () => {
    const pikachu = makeForm("pikachu", { evolutionStage: "stage1", nationalDexNumber: 25 });
    const raichu = makeForm("raichu", {
      evolutionStage: "stage2",
      nationalDexNumber: 26,
      displayName: "Raichu",
    });
    const alola = makeForm("raichualola", {
      evolutionStage: "stage2",
      formType: "regional",
      nationalDexNumber: 26,
      displayName: "Raichu-Alola",
    });
    const formById = new Map([pikachu, raichu, alola].map((form) => [form.id, form]));
    const evosById = new Map([["pikachu", ["raichu", "raichualola"]]]);

    expect(collectEvolutionTargetIds("pikachu", evosById, formById)).toEqual([
      "raichu",
      "raichualola",
    ]);
  });
});

describe("evolutionChoices", () => {
  it("resolves stored target ids and validates the battle form", () => {
    const charmeleon = makeForm("charmeleon", { evolutionStage: "stage1" });
    const charizard = makeForm("charizard", { evolutionStage: "stage2" });
    const charmander = makeForm("charmander", {
      evolutionTargetIds: ["charmeleon", "charizard"],
    });
    const formById = new Map(
      [charmander, charmeleon, charizard].map((form) => [form.id, form]),
    );

    expect(evolutionChoices(charmander, formById).map((form) => form.id)).toEqual([
      "charmeleon",
      "charizard",
    ]);
    expect(isValidBattlePokemonId(charmander, "charmander")).toBe(true);
    expect(isValidBattlePokemonId(charmander, "charizard")).toBe(true);
    expect(isValidBattlePokemonId(charmander, "gyarados")).toBe(false);
  });
});

describe("evolution path conflicts", () => {
  const honedge = makeForm("honedge", { evolutionStage: "basic", nationalDexNumber: 679 });
  const doublade = makeForm("doublade", { evolutionStage: "stage1", nationalDexNumber: 680 });
  const aegislash = makeForm("aegislash", { evolutionStage: "stage2", nationalDexNumber: 681 });
  const aegislashBlade = makeForm("aegislashblade", {
    evolutionStage: "stage2",
    nationalDexNumber: 681,
    speciesId: "aegislash",
  });
  honedge.evolutionTargetIds = ["doublade", "aegislash"];
  doublade.evolutionTargetIds = ["aegislash"];

  const wurmple = makeForm("wurmple", { nationalDexNumber: 265 });
  const silcoon = makeForm("silcoon", { evolutionStage: "stage1", nationalDexNumber: 266 });
  const beautifly = makeForm("beautifly", { evolutionStage: "stage2", nationalDexNumber: 267 });
  const cascoon = makeForm("cascoon", { evolutionStage: "stage1", nationalDexNumber: 268 });
  const dustox = makeForm("dustox", { evolutionStage: "stage2", nationalDexNumber: 269 });
  wurmple.evolutionTargetIds = ["silcoon", "cascoon", "beautifly", "dustox"];
  silcoon.evolutionTargetIds = ["beautifly"];
  cascoon.evolutionTargetIds = ["dustox"];

  const pikachu = makeForm("pikachu", { evolutionStage: "stage1", nationalDexNumber: 25 });
  const raichu = makeForm("raichu", { evolutionStage: "stage2", nationalDexNumber: 26, speciesId: "raichu" });
  const alolanRaichu = makeForm("raichualola", {
    evolutionStage: "stage2",
    formType: "regional",
    nationalDexNumber: 26,
    speciesId: "raichu",
  });
  pikachu.evolutionTargetIds = ["raichu", "raichualola"];

  const family = [
    honedge,
    doublade,
    aegislash,
    aegislashBlade,
    wurmple,
    silcoon,
    beautifly,
    cascoon,
    dustox,
    pikachu,
    raichu,
    alolanRaichu,
  ];
  const context = evolutionConflictContext(family);

  it("blocks later stages and other formes on the same path", () => {
    expect(evolutionFormsConflict(honedge, doublade, context)).toBe(true);
    expect(evolutionFormsConflict(honedge, aegislash, context)).toBe(true);
    expect(evolutionFormsConflict(aegislash, aegislashBlade, context)).toBe(true);
    expect(maximumCompatiblePokemonCount([honedge, doublade, aegislash], context)).toBe(1);
  });

  it("allows split branches while blocking the shared ancestor and the rest of the same branch", () => {
    expect(evolutionFormsConflict(wurmple, cascoon, context)).toBe(true);
    expect(evolutionFormsConflict(cascoon, dustox, context)).toBe(true);
    expect(evolutionFormsConflict(cascoon, silcoon, context)).toBe(false);
    expect(evolutionFormsConflict(cascoon, beautifly, context)).toBe(false);
    expect(maximumCompatiblePokemonCount([wurmple, silcoon, beautifly, cascoon, dustox], context)).toBe(
      2,
    );
  });

  it("treats regional split evolutions as parallel branches", () => {
    expect(evolutionFormsConflict(pikachu, raichu, context)).toBe(true);
    expect(evolutionFormsConflict(raichu, alolanRaichu, context)).toBe(false);
    expect(maximumCompatiblePokemonCount([pikachu, raichu, alolanRaichu], context)).toBe(2);
  });
});
