import { describe, expect, it } from "vitest";
import { TERA_TYPES } from "@/lib/types/pokemon-type";
import { GLOW_ALPHA, typeColors, typeGlow } from "@/components/type-colors";

function contrast(foreground: string, background: string): number {
  const ratio = (lighter: number, darker: number) => (lighter + 0.05) / (darker + 0.05);
  const first = luminance(foreground);
  const second = luminance(background);
  return first > second ? ratio(first, second) : ratio(second, first);
}

function luminance(hex: string): number {
  const red = linearize(Number.parseInt(hex.slice(1, 3), 16) / 255);
  const green = linearize(Number.parseInt(hex.slice(3, 5), 16) / 255);
  const blue = linearize(Number.parseInt(hex.slice(5, 7), 16) / 255);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

describe("type chip colors", () => {
  it("keeps text readable on every type", () => {
    for (const type of TERA_TYPES) {
      const colors = typeColors(type);
      expect(contrast(colors.color, colors.background), type).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("type glow", () => {
  it("has no glow without types", () => {
    expect(typeGlow([])).toBeUndefined();
  });

  it("tints from the first type, and adds a second layer for a dual type", () => {
    expect(typeGlow(["fire"])?.match(/radial-gradient/g)).toHaveLength(1);
    const dual = typeGlow(["fire", "flying"]);
    expect(dual?.match(/radial-gradient/g)).toHaveLength(2);
    expect(dual).toContain("rgba(239, 68, 68, 0.2)");
    expect(dual).toContain("rgba(129, 140, 248, 0.2)");
  });

  it("never tints stronger than the readable cap", () => {
    expect(GLOW_ALPHA).toBeLessThanOrEqual(0.2);
    for (const type of TERA_TYPES) {
      expect(typeGlow([type])).toContain(`, ${GLOW_ALPHA})`);
    }
  });
});
