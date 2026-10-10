import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatedCatalogPath, loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import {
  DEFAULT_RANDOMIZER_CONFIG,
  DEFAULT_SHINY_CHANCE,
  resetPokemonFilters,
} from "@/lib/randomizer/defaults";
import {
  randomizePokemon,
  rerollPokemon,
  userFacingRandomizerMessage,
} from "@/lib/randomizer/pokemon";
import { assertShinyChance, InvalidShinyChanceError, rollShinyIds } from "@/lib/randomizer/shiny";
import { parseStoredSession } from "@/lib/session/storage";
import { createInitialSession } from "@/lib/randomizer/session";

const forms = Array.from({ length: 1000 }, (_, index) => ({ id: `mon-${index}` }));

describe("rollShinyIds", () => {
  it("never rolls shiny at 0% and always at 100%", () => {
    expect(rollShinyIds(forms, 0, "seed")).toEqual([]);
    expect(rollShinyIds(forms, 100, "seed")).toEqual(forms.map((form) => form.id));
  });

  it("gives the same answer for the same seed and a different one for another seed", () => {
    const first = rollShinyIds(forms, 10, "seed-a");
    expect(rollShinyIds(forms, 10, "seed-a")).toEqual(first);
    expect(rollShinyIds(forms, 10, "seed-b")).not.toEqual(first);
  });

  it("rolls each Pokémon at the chosen percentage", () => {
    // 1000 draws at 10% average 100, with a standard deviation of about 9.5.
    const tenPercent = rollShinyIds(forms, 10, "spread").length;
    expect(tenPercent).toBeGreaterThan(60);
    expect(tenPercent).toBeLessThan(140);

    const onePercent = rollShinyIds(forms, 1, "spread").length;
    expect(onePercent).toBeLessThan(30);
  });

  it("keeps a Pokémon's result when other Pokémon are added before it", () => {
    const small = rollShinyIds(forms.slice(0, 5), 50, "stable");
    const large = rollShinyIds(forms.slice(0, 50), 50, "stable");
    expect(large.filter((id) => forms.slice(0, 5).some((form) => form.id === id))).toEqual(small);
  });

  it("rejects a chance below 0, above 100, or not a number", () => {
    for (const chance of [-1, 100.01, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => assertShinyChance(chance)).toThrow(InvalidShinyChanceError);
      expect(() => rollShinyIds(forms, chance, "seed")).toThrow(InvalidShinyChanceError);
    }
    expect(() => assertShinyChance(0.0244)).not.toThrow();
    expect(userFacingRandomizerMessage(new InvalidShinyChanceError(150))).toBe(
      "Choose a shiny chance between 0% and 100%. You asked for 150%.",
    );
  });
});

describe("shiny chance setting", () => {
  it("defaults to 1% and returns there on Reset", () => {
    expect(DEFAULT_RANDOMIZER_CONFIG.shinyChance).toBe(DEFAULT_SHINY_CHANCE);
    expect(DEFAULT_SHINY_CHANCE).toBe(1);
    expect(resetPokemonFilters({ ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 40 }).shinyChance).toBe(1);
  });

  it("fills the default into a session saved before the setting existed", () => {
    const session = createInitialSession();
    const { shinyChance: _removed, ...oldConfig } = session.config;
    void _removed;
    const restored = parseStoredSession(JSON.stringify({ ...session, config: oldConfig }));
    expect(restored?.config.shinyChance).toBe(1);
    expect(restored?.config.pokemonCount).toBe(session.config.pokemonCount);
  });
});

describe.skipIf(!existsSync(generatedCatalogPath()))("catalog Pokémon shiny rolls", () => {
  const catalog = loadGeneratedCatalog();

  it("returns the shiny subset of the rolled Pokémon", () => {
    const all = randomizePokemon(catalog.pokemon, { ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 100 }, "shiny-all");
    expect(all.shinyIds).toEqual(all.pokemon.map((form) => form.id));

    const none = randomizePokemon(catalog.pokemon, { ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 0 }, "shiny-all");
    expect(none.shinyIds).toEqual([]);
  });

  it("does not change which Pokémon are rolled", () => {
    const withShiny = randomizePokemon(catalog.pokemon, { ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 100 }, "same-picks");
    const without = randomizePokemon(catalog.pokemon, { ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 0 }, "same-picks");
    expect(withShiny.pokemon.map((form) => form.id)).toEqual(without.pokemon.map((form) => form.id));
  });

  it("rolls shiny again for a re-rolled replacement", () => {
    const first = randomizePokemon(catalog.pokemon, DEFAULT_RANDOMIZER_CONFIG, "reroll-base");
    const ids = first.pokemon.map((form) => form.id);
    const replaced = ids[0];
    if (!replaced) {
      throw new Error("Expected a rolled Pokémon");
    }
    const always = rerollPokemon(catalog.pokemon, { ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 100 }, ids, replaced, "r1");
    expect(always.shinyIds).toEqual(always.pokemon.map((form) => form.id));
    const never = rerollPokemon(catalog.pokemon, { ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 0 }, ids, replaced, "r1");
    expect(never.shinyIds).toEqual([]);
  });

  it("refuses an out-of-range chance instead of rolling", () => {
    expect(() =>
      randomizePokemon(catalog.pokemon, { ...DEFAULT_RANDOMIZER_CONFIG, shinyChance: 101 }, "bad"),
    ).toThrow(InvalidShinyChanceError);
  });
});
