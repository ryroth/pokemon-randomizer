import { describe, expect, it } from "vitest";
import { DEFAULT_RANDOMIZER_CONFIG } from "@/lib/randomizer/defaults";

describe("DEFAULT_RANDOMIZER_CONFIG", () => {
  it("enables only base formes by default", () => {
    expect(DEFAULT_RANDOMIZER_CONFIG.formTypes).toEqual(["base"]);
  });
});
