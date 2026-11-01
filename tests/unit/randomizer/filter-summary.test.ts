import { describe, expect, it } from "vitest";
import { describeItemCategoryFilter } from "@/components/randomizer/item-filter-summary";
import {
  describeMoveCategoryFilter,
  describeMoveTypeFilter,
} from "@/components/randomizer/move-filter-summary";
import {
  describeEvolutionStageFilter,
  describeFormTypeFilter,
  describeGenerationFilter,
  describeMoreFilters,
  describeSpecialFilter,
  describeTypeFilter,
} from "@/components/randomizer/pokemon-filter-summary";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";

describe("Pokémon filter dropdown summaries", () => {
  it("describes the default filters", () => {
    expect(describeGenerationFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("All generations");
    expect(describeTypeFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("All types");
    expect(describeFormTypeFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("Base forms, Regional forms, Other forms");
    expect(describeEvolutionStageFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("All stages");
    expect(describeSpecialFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("All allowed");
    expect(describeMoveCategoryFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("All categories");
    expect(describeMoveTypeFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("All types");
    expect(describeItemCategoryFilter(DEFAULT_RANDOMIZER_CONFIG)).toBe("All categories");
  });

  it("describes narrowed and empty filter groups", () => {
    const config = {
      ...DEFAULT_RANDOMIZER_CONFIG,
      generations: [7, 1] as typeof DEFAULT_RANDOMIZER_CONFIG.generations,
      types: ["fire", "water"] as typeof DEFAULT_RANDOMIZER_CONFIG.types,
      typeMatchMode: "and" as const,
      formTypes: ["mega", "gmax"] as typeof DEFAULT_RANDOMIZER_CONFIG.formTypes,
      evolutionStages: ["basic"] as typeof DEFAULT_RANDOMIZER_CONFIG.evolutionStages,
      allowLegendary: false,
      moveCategories: ["physical", "status"] as typeof DEFAULT_RANDOMIZER_CONFIG.moveCategories,
      moveTypes: ["fire", "water"] as typeof DEFAULT_RANDOMIZER_CONFIG.moveTypes,
      itemCategories: ["popular", "useless"] as typeof DEFAULT_RANDOMIZER_CONFIG.itemCategories,
    };

    expect(describeGenerationFilter(config)).toBe("Gen 1, Gen 7");
    expect(describeTypeFilter(config)).toBe("Fire, Water (every selected type)");
    expect(describeFormTypeFilter(config)).toBe("Mega Evolutions, Gigantamax");
    expect(describeEvolutionStageFilter(config)).toBe("Basic");
    expect(describeSpecialFilter(config)).toBe("Excluding Legendary (Restricted)");
    expect(describeMoveCategoryFilter(config)).toBe("Physical, Status");
    expect(describeMoveTypeFilter(config)).toBe("Fire, Water");
    expect(describeItemCategoryFilter(config)).toBe("Popular Items, Useless Items");
  });

  it("describes cleared filter groups", () => {
    const config = {
      ...DEFAULT_RANDOMIZER_CONFIG,
      generations: [],
      types: [],
      formTypes: [],
      evolutionStages: [],
      moveCategories: [],
      moveTypes: [],
      itemCategories: [],
    };

    expect(describeGenerationFilter(config)).toBe("No generations");
    expect(describeTypeFilter(config)).toBe("No types");
    expect(describeFormTypeFilter(config)).toBe("No forms");
    expect(describeEvolutionStageFilter(config)).toBe("No evolution stages");
    expect(describeMoveCategoryFilter(config)).toBe("No categories");
    expect(describeMoveTypeFilter(config)).toBe("No types");
    expect(describeItemCategoryFilter(config)).toBe("No categories");
  });

  it("describes extra filters on one line", () => {
    expect(describeMoreFilters(DEFAULT_RANDOMIZER_CONFIG)).toBe("Any");
    expect(
      describeMoreFilters({
        ...DEFAULT_RANDOMIZER_CONFIG,
        nameInitials: ["S"],
        bstMax: 400,
        genusQuery: "  Mouse Pokémon ",
        lowestStats: ["atk"],
      }),
    ).toBe("Starts with S · BST at most 400 · Lowest Attack · Mouse Pokémon");
    expect(describeMoreFilters({ ...DEFAULT_RANDOMIZER_CONFIG, nameInitials: [] })).toBe("No letters");
    expect(
      describeMoreFilters({
        ...DEFAULT_RANDOMIZER_CONFIG,
        heightMinM: 0.7,
        weightMinKg: 6.9,
      }),
    ).toBe("At least 2 ft 4 in · At least 15.2 lb");
    expect(
      describeMoreFilters({
        ...DEFAULT_RANDOMIZER_CONFIG,
        measurementSystem: "metric",
        heightMinM: 0.7,
        weightMinKg: 6.9,
      }),
    ).toBe("At least 0.7 m · At least 6.9 kg · Metric");
  });
});
