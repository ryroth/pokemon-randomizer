import { describe, expect, it } from "vitest";
import { speciesGenus } from "@/lib/data/genera";
import { englishGenusBySpeciesId } from "../../../scripts/import/genera";

describe("species genus", () => {
  it("uses the English PokéAPI genus", () => {
    expect(speciesGenus("eelektross")).toBe("EleFish Pokémon");
    expect(speciesGenus("missingno")).toBeNull();
  });

  it("reads only the English genus column", () => {
    const genera = englishGenusBySpeciesId(
      ["pokemon_species_id,local_language_id,name,genus", "604,1,シビルドン,でんきうおポケモン", "604,9,Eelektross,EleFish Pokémon"].join(
        "\n",
      ),
    );
    expect(genera.get(604)).toBe("EleFish Pokémon");
  });
});
