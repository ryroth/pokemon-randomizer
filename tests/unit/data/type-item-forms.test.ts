import { describe, expect, it } from "vitest";
import {
  copyTypeChangeCries,
  inheritTypeChangeFormBodies,
  isTypeChangeHeldItem,
} from "@/lib/data/typeItemForms";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { StatSpread } from "@/lib/types/stats";

const ARCEUS_STATS: StatSpread = { hp: 120, atk: 120, def: 120, spa: 120, spd: 120, spe: 120 };
const DIALGA_STATS: StatSpread = { hp: 100, atk: 120, def: 120, spa: 150, spd: 100, spe: 90 };
const ORIGIN_STATS: StatSpread = { hp: 100, atk: 100, def: 120, spa: 150, spd: 120, spe: 90 };

function form(partial: Pick<PokemonForm, "id" | "speciesId" | "formType"> & Partial<PokemonForm>): PokemonForm {
  return {
    pokeApiId: 0,
    pokeApiSlug: partial.id,
    name: partial.id,
    displayName: partial.id,
    showdownName: partial.id,
    nationalDexNumber: 1,
    generation: 4,
    types: ["normal"],
    abilityIds: [],
    form: "base",
    evolutionStage: "basic",
    isBasic: true,
    isStage1: false,
    isStage2: false,
    isPseudoLegendary: false,
    isSubLegendary: false,
    isLegendary: false,
    isMythical: false,
    isParadox: false,
    isUltraBeast: false,
    isBaby: false,
    dexEntries: [],
    sprites: { sprite: null, spriteShiny: null, artwork: null, artworkShiny: null },
    baseStats: ARCEUS_STATS,
    genderRule: "genderless",
    pokedexColor: null,
    shape: "quadruped",
    heightM: null,
    weightKg: null,
    eggGroups: [],
    evolutionTargetIds: [],
    ...partial,
  };
}

const forms = [
  form({
    id: "arceus",
    speciesId: "arceus",
    formType: "base",
    heightM: 3.2,
    weightKg: 320,
    eggGroups: ["Undiscovered"],
  }),
  form({
    id: "arceusbug",
    speciesId: "arceus",
    formType: "other",
    form: "Bug",
    types: ["bug"],
  }),
  form({
    id: "dialga",
    speciesId: "dialga",
    formType: "base",
    baseStats: DIALGA_STATS,
    heightM: 5.4,
    weightKg: 683,
    eggGroups: ["Undiscovered"],
  }),
  form({
    id: "dialgaorigin",
    speciesId: "dialga",
    formType: "other",
    baseStats: ORIGIN_STATS,
    heightM: 7,
    weightKg: 848.7,
    eggGroups: ["Undiscovered"],
  }),
];

const items: Record<string, string> = {
  arceusbug: "insectplate",
  dialgaorigin: "adamantcrystal",
};

describe("type-change held item forms", () => {
  it("treats plates, memories, and drives as type-change items", () => {
    expect(isTypeChangeHeldItem("insectplate")).toBe(true);
    expect(isTypeChangeHeldItem("firememory")).toBe(true);
    expect(isTypeChangeHeldItem("burndrive")).toBe(true);
    expect(isTypeChangeHeldItem("adamantcrystal")).toBe(false);
    expect(isTypeChangeHeldItem("wellspringmask")).toBe(false);
  });

  it("copies the base body onto a type form and leaves a different body alone", () => {
    const next = inheritTypeChangeFormBodies(forms, (id) => items[id]);
    const bug = next.find((entry) => entry.id === "arceusbug");
    const origin = next.find((entry) => entry.id === "dialgaorigin");
    expect(bug?.heightM).toBe(3.2);
    expect(bug?.weightKg).toBe(320);
    expect(bug?.eggGroups).toEqual(["Undiscovered"]);
    expect(bug?.types).toEqual(["bug"]);
    expect(origin?.heightM).toBe(7);
    expect(origin?.weightKg).toBe(848.7);
  });

  it("copies the base cry when the type form has none", () => {
    const cries = copyTypeChangeCries({ arceus: "https://example.test/arceus.ogg" }, forms, (id) => items[id]);
    expect(cries.arceusbug).toBe("https://example.test/arceus.ogg");
    expect(cries.dialgaorigin).toBeUndefined();
  });
});
