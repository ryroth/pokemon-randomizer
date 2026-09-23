import { describe, expect, it } from "vitest";
import { createRng, createSeed, InsufficientPoolError, pickUniqueBy } from "@/lib/randomizer/randomUtils";

describe("createSeed", () => {
  it("returns a hex string from crypto, not Math.random", () => {
    expect(createSeed()).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("pickUniqueBy", () => {
  it("skips later items that share a key", () => {
    const pool = [
      { id: "honedge", line: "honedge" },
      { id: "doublade", line: "honedge" },
      { id: "squirtle", line: "squirtle" },
      { id: "aegislash", line: "honedge" },
    ];
    const picked = pickUniqueBy(pool, 2, (item) => item.line, createRng("line-seed"), "Pokémon");

    expect(picked).toHaveLength(2);
    expect(new Set(picked.map((item) => item.line)).size).toBe(2);
  });

  it("throws when unique keys cannot fill the requested count", () => {
    expect(() =>
      pickUniqueBy(
        [
          { id: "honedge", line: "honedge" },
          { id: "doublade", line: "honedge" },
        ],
        2,
        (item) => item.line,
        createRng("short-line"),
        "Pokémon",
      ),
    ).toThrow(InsufficientPoolError);
  });
});
