import { describe, expect, it } from "vitest";
import { formCry } from "@/lib/data/cries";

describe("formCry", () => {
  it("returns the official latest cry for Bulbasaur", () => {
    expect(formCry("bulbasaur")).toBe(
      "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg",
    );
  });

  it("returns null when a form has no cry on file", () => {
    expect(formCry("not-a-pokemon")).toBeNull();
  });
});
