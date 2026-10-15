import { describe, expect, it } from "vitest";
import { setDraftItem } from "@/lib/builder/draft";
import { itemLockedByForm, savedSetEditAccess } from "@/lib/builder/locks";
import { openSavedSetInBuilder } from "@/lib/builder/saved-set";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import {
  applyItemRoll,
  applyItemToRolledPokemon,
  applyPokemonRoll,
  createInitialSession,
  selectRolledItem,
  selectRolledPokemon,
} from "@/lib/randomizer/session";
import type { Item } from "@/lib/types/catalog-entities";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { PokemonSet } from "@/lib/types/session";

function roll(ids: readonly string[], session = createInitialSession()) {
  return applyPokemonRoll(session, {
    seed: "form-item",
    poolSize: ids.length,
    pokemon: ids.map((id) => ({ id }) as PokemonForm),
  });
}

const leftovers = { id: "leftovers" } as Item;

describe("required form items", () => {
  it("equips the form item on select and drops it when another Pokémon is chosen", () => {
    const rolled = roll(["giratinaorigin", "pikachu"]);
    const origin = selectRolledPokemon(rolled, "giratinaorigin");
    expect(origin.draft.itemId).toBe("griseouscore");
    expect(itemLockedByForm(origin)).toBe(true);
    expect(selectRolledItem(origin, "leftovers")).toBe(origin);
    expect(setDraftItem(origin, "leftovers", [null, "leftovers", "griseouscore"])).toBe(origin);

    const pikachu = selectRolledPokemon(origin, "pikachu");
    expect(pikachu.draft.itemId).toBeUndefined();
    expect(itemLockedByForm(pikachu)).toBe(false);
    expect(setDraftItem(pikachu, "leftovers", [null, "leftovers"])).not.toBe(pikachu);
  });

  it("locks a Mega to its Mega Stone until another Pokémon is chosen", () => {
    const rolled = roll(["venusaurmega", "pikachu"]);
    const mega = selectRolledPokemon(rolled, "venusaurmega");
    expect(mega.draft.itemId).toBe("venusaurite");
    expect(itemLockedByForm(mega)).toBe(true);
    expect(setDraftItem(mega, "leftovers", [null, "leftovers", "venusaurite"])).toBe(mega);

    const pikachu = selectRolledPokemon(mega, "pikachu");
    expect(pikachu.draft.itemId).toBeUndefined();
    expect(itemLockedByForm(pikachu)).toBe(false);
  });

  it("keeps the form item when the item randomizer runs after Pokémon", () => {
    const session = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
    });
    const selected = selectRolledPokemon(roll(["giratinaorigin"], session), "giratinaorigin");
    expect(selected.draft.itemId).toBe("griseouscore");

    const rolledItems = applyItemRoll(
      selected,
      { seed: "items", poolSize: 1, items: [leftovers] },
      "giratinaorigin",
    );
    expect(rolledItems).toBe(selected);
    expect(selectRolledItem(selected, "leftovers")).toBe(selected);
    expect(selected.draft.itemId).toBe("griseouscore");
  });

  it("lets the user select the form before applying a randomizer item", () => {
    const before = createInitialSession({
      ...DEFAULT_RANDOMIZER_CONFIG,
      randomizeItems: true,
      randomizerOrder: ["item", "pokemon", "ability", "move"],
    });
    const withPool = applyItemRoll(before, {
      seed: "items",
      poolSize: 2,
      items: [leftovers, { id: "lifeorb" } as Item],
    });
    const rolled = roll(["giratinaorigin", "pikachu"], withPool);
    expect(selectRolledPokemon(rolled, "pikachu")).toBe(rolled);

    const origin = selectRolledPokemon(rolled, "giratinaorigin");
    expect(origin.selectedPokemonId).toBe("giratinaorigin");
    expect(origin.draft.itemId).toBe("griseouscore");

    const applied = applyItemToRolledPokemon(rolled, "giratinaorigin", "leftovers");
    expect(selectRolledPokemon(applied, "giratinaorigin").draft.itemId).toBe("griseouscore");
  });

  it("keeps the form item when a saved set is opened in the builder", () => {
    const set: PokemonSet = {
      pokemonId: "giratinaorigin",
      itemId: "leftovers",
      abilityId: "levitate",
      moveIds: ["shadowball"],
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      natureId: "modest",
      teraType: "ghost",
      gender: null,
      level: 50,
      shiny: false,
      happiness: 255,
    };
    const session = openSavedSetInBuilder(createInitialSession(), set, "team-1", 0);
    expect(session.draft.itemId).toBe("griseouscore");
    expect(itemLockedByForm(session)).toBe(true);
    expect(savedSetEditAccess(set).item).toBe(false);
  });
});
