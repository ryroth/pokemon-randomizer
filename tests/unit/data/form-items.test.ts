import { describe, expect, it } from "vitest";
import { requiredFormItemId } from "@/lib/data/formItems";

describe("requiredFormItemId", () => {
  it("uses the item that changes the base Pokémon into that other form", () => {
    expect(requiredFormItemId("giratinaorigin")).toBe("griseouscore");
    expect(requiredFormItemId("dialgaorigin")).toBe("adamantcrystal");
    expect(requiredFormItemId("palkiaorigin")).toBe("lustrousglobe");
    expect(requiredFormItemId("zaciancrowned")).toBe("rustedsword");
    expect(requiredFormItemId("zamazentacrowned")).toBe("rustedshield");
    expect(requiredFormItemId("ogerponhearthflame")).toBe("hearthflamemask");
    expect(requiredFormItemId("silvallyfire")).toBe("firememory");
    expect(requiredFormItemId("genesectburn")).toBe("burndrive");
  });

  it("prefers the plate over the Z-Crystal when either item changes Arceus", () => {
    expect(requiredFormItemId("arceusfire")).toBe("flameplate");
    expect(requiredFormItemId("arceusghost")).toBe("spookyplate");
  });

  it("uses the Mega Stone that changes the base Pokémon into that Mega", () => {
    expect(requiredFormItemId("venusaurmega")).toBe("venusaurite");
    expect(requiredFormItemId("charizardmegax")).toBe("charizarditex");
    expect(requiredFormItemId("charizardmegay")).toBe("charizarditey");
    expect(requiredFormItemId("mewtwomegax")).toBe("mewtwonitex");
    expect(requiredFormItemId("mewtwomegay")).toBe("mewtwonitey");
  });

  it("is empty for a base form, Mega Rayquaza, and a form that does not need an item", () => {
    expect(requiredFormItemId("giratina")).toBeUndefined();
    expect(requiredFormItemId("venusaur")).toBeUndefined();
    expect(requiredFormItemId("rayquazamega")).toBeUndefined();
    expect(requiredFormItemId("pichuspikyeared")).toBeUndefined();
    expect(requiredFormItemId("hoopaunbound")).toBeUndefined();
    expect(requiredFormItemId(undefined)).toBeUndefined();
  });
});
