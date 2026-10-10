import type { PokemonType, TeraType } from "@/lib/types/pokemon-type";

const DARK_TEXT = "#020617"; // slate-950
const LIGHT_TEXT = "#ffffff";

/**
 * Type hues from the design system. Each chip uses whichever text color gives the higher
 * contrast, so every type meets WCAG AA (4.5:1). The unit test checks this.
 */
export const TYPE_COLORS: Record<PokemonType, { background: string; color: string }> = {
  normal: { background: "#a8a77a", color: DARK_TEXT },
  fire: { background: "#ef4444", color: DARK_TEXT },
  water: { background: "#3b82f6", color: DARK_TEXT },
  electric: { background: "#facc15", color: DARK_TEXT },
  grass: { background: "#22c55e", color: DARK_TEXT },
  ice: { background: "#67e8f9", color: DARK_TEXT },
  fighting: { background: "#b91c1c", color: LIGHT_TEXT },
  poison: { background: "#9333ea", color: LIGHT_TEXT },
  ground: { background: "#e2b35e", color: DARK_TEXT },
  flying: { background: "#818cf8", color: DARK_TEXT },
  psychic: { background: "#ec4899", color: DARK_TEXT },
  bug: { background: "#65a30d", color: DARK_TEXT },
  rock: { background: "#78716c", color: LIGHT_TEXT },
  ghost: { background: "#7c3aed", color: LIGHT_TEXT },
  dragon: { background: "#4f46e5", color: LIGHT_TEXT },
  dark: { background: "#374151", color: LIGHT_TEXT },
  steel: { background: "#64748b", color: LIGHT_TEXT },
  fairy: { background: "#f472b6", color: DARK_TEXT },
};

const STELLAR_COLORS = { background: "#6d7394", color: LIGHT_TEXT };

/** Strongest tint a glow may add. Kept low so body text on the card stays readable. */
export const GLOW_ALPHA = 0.2;

function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/**
 * CSS `background-image` for a soft radial glow behind a card's artwork, tinted by the Pokémon's
 * types: the first type glows from the top center and a second type from the top right.
 * Returns undefined when there is no type to tint with.
 */
export function typeGlow(types: readonly TeraType[]): string | undefined {
  const [first, second] = types;
  if (!first) {
    return undefined;
  }
  const layers = [
    `radial-gradient(circle at 50% 0%, ${withAlpha(typeColors(first).background, GLOW_ALPHA)}, transparent 70%)`,
  ];
  if (second) {
    layers.unshift(
      `radial-gradient(circle at 100% 0%, ${withAlpha(typeColors(second).background, GLOW_ALPHA)}, transparent 55%)`,
    );
  }
  return layers.join(", ");
}

export function typeColors(type: TeraType): { background: string; color: string } {
  if (type === "stellar") {
    return STELLAR_COLORS;
  }
  return TYPE_COLORS[type];
}
