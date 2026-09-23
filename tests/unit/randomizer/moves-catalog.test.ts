import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatedCatalogPath, loadGeneratedCatalog } from "@/lib/data/loadCatalog";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";
import { randomizeMoves } from "@/lib/randomizer/moves";

const catalogPath = generatedCatalogPath();
const catalogAvailable = existsSync(catalogPath);

describe.skipIf(!catalogAvailable)("catalog move randomizer", () => {
  const catalog = loadGeneratedCatalog();

  it("rolls unique standard moves for a fixed seed", () => {
    const result = randomizeMoves(
      catalog.moves,
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true },
      "catalog-move-seed",
    );
    const ids = result.moves.map((move) => move.id);

    expect(ids).toHaveLength(DEFAULT_RANDOMIZER_CONFIG.moveCount);
    expect(new Set(ids).size).toBe(DEFAULT_RANDOMIZER_CONFIG.moveCount);
    expect(result.poolSize).toBe(catalog.moves.length);
    expect(catalog.moves.length).toBeGreaterThan(800);
    expect(ids.includes("maxguard")).toBe(false);
    expect(catalog.moves.some((move) => move.id === "maxguard")).toBe(false);
    expect(catalog.moves.some((move) => move.id === "clangoroussoulblaze")).toBe(false);
    expect(catalog.moves.some((move) => move.id === "gmaxwildfire")).toBe(false);

    const again = randomizeMoves(
      catalog.moves,
      { ...DEFAULT_RANDOMIZER_CONFIG, randomizeMoves: true },
      "catalog-move-seed",
    );
    expect(again.moves.map((move) => move.id)).toEqual(ids);
  });

  it("rolls only physical moves when that category is selected", () => {
    const result = randomizeMoves(
      catalog.moves,
      {
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeMoves: true,
        moveCategories: ["physical"],
      },
      "catalog-physical-seed",
    );

    expect(result.moves).toHaveLength(DEFAULT_RANDOMIZER_CONFIG.moveCount);
    expect(result.moves.every((move) => move.category === "physical")).toBe(true);
    expect(result.poolSize).toBe(
      catalog.moves.filter((move) => move.category === "physical").length,
    );
    expect(result.poolSize).toBeLessThan(catalog.moves.length);
    expect(result.poolSize).toBeGreaterThan(DEFAULT_RANDOMIZER_CONFIG.moveCount);
  });

  it("rolls only fire special moves when those filters are selected", () => {
    const result = randomizeMoves(
      catalog.moves,
      {
        ...DEFAULT_RANDOMIZER_CONFIG,
        randomizeMoves: true,
        moveCategories: ["special"],
        moveTypes: ["fire"],
      },
      "catalog-fire-special-seed",
    );

    expect(result.moves).toHaveLength(DEFAULT_RANDOMIZER_CONFIG.moveCount);
    expect(
      result.moves.every((move) => move.category === "special" && move.type === "fire"),
    ).toBe(true);
    expect(result.poolSize).toBe(
      catalog.moves.filter((move) => move.category === "special" && move.type === "fire")
        .length,
    );
    expect(result.poolSize).toBeLessThan(catalog.moves.length);
    expect(result.poolSize).toBeGreaterThan(DEFAULT_RANDOMIZER_CONFIG.moveCount);
  });
});
