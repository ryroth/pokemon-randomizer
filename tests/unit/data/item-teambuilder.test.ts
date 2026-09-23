import { describe, expect, it } from "vitest";
import { classifyShowdownItemTeambuilderCategory } from "@/lib/data/item-teambuilder";

describe("classifyShowdownItemTeambuilderCategory", () => {
  it("matches pokemonshowdown.com Gen 9 singles buckets", () => {
    expect(classifyShowdownItemTeambuilderCategory({ id: "leftovers", name: "Leftovers" })).toBe(
      "popular",
    );
    expect(
      classifyShowdownItemTeambuilderCategory({ id: "heavydutyboots", name: "Heavy-Duty Boots" }),
    ).toBe("popular");
    expect(classifyShowdownItemTeambuilderCategory({ id: "sitrusberry", name: "Sitrus Berry" })).toBe(
      "items",
    );
    expect(
      classifyShowdownItemTeambuilderCategory({ id: "boosterenergy", name: "Booster Energy" }),
    ).toBe("items");
    expect(classifyShowdownItemTeambuilderCategory({ id: "thickclub", name: "Thick Club" })).toBe(
      "pokemon-specific",
    );
    expect(
      classifyShowdownItemTeambuilderCategory({
        id: "wellspringmask",
        name: "Wellspring Mask",
        itemUser: ["Ogerpon-Wellspring"],
      }),
    ).toBe("pokemon-specific");
    expect(
      classifyShowdownItemTeambuilderCategory({
        id: "venusaurite",
        name: "Venusaurite",
        megaStone: { Venusaur: "Venusaur-Mega" },
      }),
    ).toBe("pokemon-specific");
    expect(classifyShowdownItemTeambuilderCategory({ id: "oranberry", name: "Oran Berry" })).toBe(
      "usually-useless",
    );
    expect(classifyShowdownItemTeambuilderCategory({ id: "rarebone", name: "Rare Bone" })).toBe(
      "useless",
    );
    expect(classifyShowdownItemTeambuilderCategory({ id: "firegem", name: "Fire Gem" })).toBe(
      "useless",
    );
    expect(classifyShowdownItemTeambuilderCategory({ id: "mail", name: "Mail" })).toBe("useless");
    expect(classifyShowdownItemTeambuilderCategory({ id: "helixfossil", name: "Helix Fossil" })).toBe(
      "useless",
    );
  });

  it("keeps Light Ball Pokémon-specific instead of treating Ball as useless", () => {
    expect(classifyShowdownItemTeambuilderCategory({ id: "lightball", name: "Light Ball" })).toBe(
      "pokemon-specific",
    );
  });

  it("keeps Normal Gem in Items and other Gems in Useless", () => {
    expect(classifyShowdownItemTeambuilderCategory({ id: "normalgem", name: "Normal Gem" })).toBe(
      "items",
    );
    expect(classifyShowdownItemTeambuilderCategory({ id: "watergem", name: "Water Gem" })).toBe(
      "useless",
    );
  });
});
