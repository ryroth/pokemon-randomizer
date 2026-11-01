import { describe, expect, it } from "vitest";
import { setSoFar } from "@/lib/randomizer/setSoFar";
import type { Ability, Item, Move } from "@/lib/types/catalog-entities";

const punkRock = ability("punkrock", "Punk Rock", "Powers up sound moves by 1.3×.");
const plus = ability("plus", "Plus", "Boosts Sp. Atk if a teammate has Plus or Minus.");
const voltSwitch = move("voltswitch", "Volt Switch");
const leftovers = item("leftovers", "Leftovers");
const griseous = item("griseouscore", "Griseous Core");

const abilitiesById = new Map([punkRock, plus].map((entry) => [entry.id, entry]));
const movesById = new Map([[voltSwitch.id, voltSwitch]]);
const itemsById = new Map([
  [leftovers.id, leftovers],
  [griseous.id, griseous],
]);

describe("setSoFar", () => {
  it("hides the species abilities while abilities are being randomized", () => {
    const hidden = setSoFar({
      speciesAbilityIds: ["punkrock", "plus"],
      randomizingAbilities: true,
      abilitiesById,
      movesById,
      itemsById,
    });
    const chosen = setSoFar({
      speciesAbilityIds: ["punkrock", "plus"],
      randomizingAbilities: true,
      abilityId: "plus",
      abilitiesById,
      movesById,
      itemsById,
    });
    expect(hidden.chosenAbility).toBeUndefined();
    expect(hidden.speciesAbilities).toEqual([]);
    expect(chosen.chosenAbility?.id).toBe("plus");
    expect(chosen.speciesAbilities).toEqual([]);
  });

  it("keeps the species abilities when abilities are not randomized", () => {
    const parts = setSoFar({
      speciesAbilityIds: ["punkrock", "plus", "missing"],
      abilitiesById,
      movesById,
      itemsById,
    });
    expect(parts.chosenAbility).toBeUndefined();
    expect(parts.speciesAbilities.map((entry) => entry.id)).toEqual(["punkrock", "plus"]);
    expect(parts.moves).toEqual([]);
    expect(parts.item).toBeUndefined();
    expect(parts.itemIsNone).toBe(false);
  });

  it("shows a chosen ability, filled moves, and a chosen item", () => {
    const parts = setSoFar({
      speciesAbilityIds: ["punkrock", "plus"],
      abilityId: "plus",
      moveIds: [undefined, "voltswitch", "missing"],
      itemId: "leftovers",
      abilitiesById,
      movesById,
      itemsById,
    });
    expect(parts.chosenAbility?.id).toBe("plus");
    expect(parts.moves.map((entry) => entry.id)).toEqual(["voltswitch"]);
    expect(parts.item?.id).toBe("leftovers");
    expect(parts.itemIsNone).toBe(false);
  });

  it("treats an unset item as blank and None as an explicit choice", () => {
    const unset = setSoFar({
      speciesAbilityIds: [],
      itemId: undefined,
      abilitiesById,
      movesById,
      itemsById,
    });
    const none = setSoFar({
      speciesAbilityIds: [],
      itemId: null,
      abilitiesById,
      movesById,
      itemsById,
    });
    expect(unset.item).toBeUndefined();
    expect(unset.itemIsNone).toBe(false);
    expect(none.item).toBeUndefined();
    expect(none.itemIsNone).toBe(true);
  });

  it("shows the required form item when no other item has been chosen", () => {
    const parts = setSoFar({
      speciesAbilityIds: [],
      itemId: null,
      requiredItemId: "griseouscore",
      abilitiesById,
      movesById,
      itemsById,
    });
    expect(parts.item?.id).toBe("griseouscore");
    expect(parts.itemIsNone).toBe(false);
  });
});

function ability(id: string, name: string, description: string): Ability {
  return { id, pokeApiSlug: id, name, showdownName: name, description };
}

function move(id: string, name: string): Move {
  return {
    id,
    pokeApiSlug: id,
    name,
    showdownName: name,
    type: "electric",
    category: "special",
    power: 70,
    accuracy: 100,
    pp: 20,
    description: "Attacks, then switches.",
  };
}

function item(id: string, name: string): Item {
  return {
    id,
    pokeApiSlug: id,
    name,
    showdownName: name,
    kind: "held",
    category: "popular",
    description: "A held item.",
  };
}
