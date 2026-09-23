import { describe, expect, it } from "vitest";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { InvalidItemCountError, matchingItemPoolSize, randomizeItems } from "@/lib/randomizer/items";
import { userFacingRandomizerMessage } from "@/lib/randomizer/pokemon";
import { InsufficientPoolError } from "@/lib/randomizer/randomUtils";
import type { Item } from "@/lib/types/catalog-entities";

function makeItem(id: string, overrides: Partial<Item> = {}): Item {
  return {
    id,
    pokeApiSlug: id,
    name: id,
    showdownName: id,
    description: `${id} description`,
    category: "items",
    kind: "held",
    ...overrides,
  };
}

const leftovers = makeItem("leftovers", { category: "popular" });
const lifeOrb = makeItem("lifeorb", { name: "Life Orb", category: "popular" });
const choiceBand = makeItem("choiceband", { name: "Choice Band", category: "popular" });
const sitrusBerry = makeItem("sitrusberry", { name: "Sitrus Berry", kind: "berry" });
const pool = [leftovers, lifeOrb, choiceBand, sitrusBerry];

function config(
  overrides: Partial<typeof DEFAULT_RANDOMIZER_CONFIG> = {},
): typeof DEFAULT_RANDOMIZER_CONFIG {
  return { ...DEFAULT_RANDOMIZER_CONFIG, randomizeItems: true, itemCount: 3, ...overrides };
}

describe("randomizeItems", () => {
  it("returns unique items by id", () => {
    const result = randomizeItems(pool, config({ itemCount: 3 }), "item-unique");
    const ids = result.items.map((item) => item.id);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(result.poolSize).toBe(4);
    expect(result.seed).toBe("item-unique");
    expect(ids.includes("none")).toBe(false);
  });

  it("only rolls items from the selected Showdown teambuilder categories", () => {
    const mixed = [
      leftovers,
      sitrusBerry,
      makeItem("thickclub", { name: "Thick Club", category: "pokemon-specific" }),
      makeItem("oranberry", { name: "Oran Berry", kind: "berry", category: "usually-useless" }),
    ];
    const result = randomizeItems(
      mixed,
      config({ itemCount: 2, itemCategories: ["popular", "items"] }),
      "item-category-filter",
    );

    expect(result.poolSize).toBe(2);
    expect(result.items.every((item) => item.category === "popular" || item.category === "items")).toBe(
      true,
    );
  });

  it("reproduces the same roll for the same seed and count", () => {
    const first = randomizeItems(pool, config({ itemCount: 3 }), "repeat-item");
    const second = randomizeItems(pool, config({ itemCount: 3 }), "repeat-item");

    expect(first.items.map((item) => item.id)).toEqual(second.items.map((item) => item.id));
  });

  it("counts catalog holdables only; None is an extra selectable choice", () => {
    expect(matchingItemPoolSize(pool, config())).toBe(4);
  });

  it("throws when the pool is smaller than the requested count", () => {
    expect(() => randomizeItems(pool, config({ itemCount: 5 }), "short-item-pool")).toThrow(
      InsufficientPoolError,
    );
    expect(() =>
      randomizeItems(pool, config({ itemCount: 3, itemCategories: [] }), "no-item-categories"),
    ).toThrow(InsufficientPoolError);
    expect(() =>
      randomizeItems(
        pool,
        config({ itemCount: 3, itemCategories: ["usually-useless"] }),
        "usually-useless-only",
      ),
    ).toThrow(InsufficientPoolError);
  });

  it("throws a user-facing error for an out-of-range count", () => {
    expect(() => randomizeItems(pool, config({ itemCount: 0 }), "bad-count")).toThrow(
      InvalidItemCountError,
    );
    expect(() => randomizeItems(pool, config({ itemCount: 13 }), "bad-count")).toThrow(
      InvalidItemCountError,
    );
  });
});

describe("userFacingRandomizerMessage for items", () => {
  it("returns the insufficient-pool and invalid-count messages", () => {
    const poolError = new InsufficientPoolError("items", 2, 5);
    expect(userFacingRandomizerMessage(poolError)).toBe(poolError.message);
    expect(userFacingRandomizerMessage(new InvalidItemCountError(0))).toBe(
      "Choose between 1 and 12 items. You asked for 0.",
    );
  });
});
