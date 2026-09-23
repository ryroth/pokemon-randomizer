import { describe, expect, it } from "vitest";
import {
  InvalidAbilityCountError,
  randomizeAbilities,
} from "@/lib/randomizer/abilities";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { userFacingRandomizerMessage } from "@/lib/randomizer/pokemon";
import { InsufficientPoolError } from "@/lib/randomizer/randomUtils";
import type { Ability } from "@/lib/types/catalog-entities";

function makeAbility(id: string, overrides: Partial<Ability> = {}): Ability {
  return {
    id,
    pokeApiSlug: id,
    name: id,
    showdownName: id,
    description: `${id} description`,
    ...overrides,
  };
}

const intimidate = makeAbility("intimidate");
const levitate = makeAbility("levitate");
const flashFire = makeAbility("flashfire", { name: "Flash Fire" });
const torrent = makeAbility("torrent");
const pool = [intimidate, levitate, flashFire, torrent];

function config(
  overrides: Partial<typeof DEFAULT_RANDOMIZER_CONFIG> = {},
): typeof DEFAULT_RANDOMIZER_CONFIG {
  return { ...DEFAULT_RANDOMIZER_CONFIG, randomizeAbilities: true, abilityCount: 3, ...overrides };
}

describe("randomizeAbilities", () => {
  it("returns unique abilities by id", () => {
    const result = randomizeAbilities(pool, config({ abilityCount: 3 }), "ability-unique");
    const ids = result.abilities.map((ability) => ability.id);

    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(result.poolSize).toBe(4);
    expect(result.seed).toBe("ability-unique");
  });

  it("reproduces the same roll for the same seed and count", () => {
    const first = randomizeAbilities(pool, config({ abilityCount: 3 }), "repeat-ability");
    const second = randomizeAbilities(pool, config({ abilityCount: 3 }), "repeat-ability");

    expect(first.abilities.map((ability) => ability.id)).toEqual(
      second.abilities.map((ability) => ability.id),
    );
  });

  it("uses the full catalog even when abilityPoolMode is legal", () => {
    const result = randomizeAbilities(
      pool,
      config({ abilityCount: 4, abilityPoolMode: "legal" }),
      "all-abilities",
    );

    expect(result.abilities.map((ability) => ability.id).sort()).toEqual(
      ["flashfire", "intimidate", "levitate", "torrent"].sort(),
    );
  });

  it("throws when the pool is smaller than the requested count", () => {
    expect(() =>
      randomizeAbilities(pool, config({ abilityCount: 5 }), "short-ability-pool"),
    ).toThrow(InsufficientPoolError);
  });

  it("throws a user-facing error for an out-of-range count", () => {
    expect(() => randomizeAbilities(pool, config({ abilityCount: 0 }), "bad-count")).toThrow(
      InvalidAbilityCountError,
    );
    expect(() => randomizeAbilities(pool, config({ abilityCount: 13 }), "bad-count")).toThrow(
      InvalidAbilityCountError,
    );
  });
});

describe("userFacingRandomizerMessage for abilities", () => {
  it("returns the insufficient-pool and invalid-count messages", () => {
    const poolError = new InsufficientPoolError("abilities", 2, 5);
    expect(userFacingRandomizerMessage(poolError)).toBe(poolError.message);
    expect(userFacingRandomizerMessage(new InvalidAbilityCountError(0))).toBe(
      "Choose between 1 and 12 abilities. You asked for 0.",
    );
  });
});
