import type { PokemonType, TeraType } from "@/lib/types/pokemon-type";

/** Type hues with text that stays readable on the chip. */
export const TYPE_COLORS: Record<PokemonType, { background: string; color: string }> = {
  normal: { background: "#9fa19f", color: "#1a1a1a" },
  fire: { background: "#e61819", color: "#ffffff" },
  water: { background: "#3d8cf2", color: "#1a1a1a" },
  electric: { background: "#fac000", color: "#1a1a1a" },
  grass: { background: "#3fa129", color: "#1a1a1a" },
  ice: { background: "#3dcef3", color: "#1a1a1a" },
  fighting: { background: "#ff8000", color: "#1a1a1a" },
  poison: { background: "#9141cb", color: "#ffffff" },
  ground: { background: "#915121", color: "#ffffff" },
  flying: { background: "#81b9ef", color: "#1a1a1a" },
  psychic: { background: "#ef4179", color: "#1a1a1a" },
  bug: { background: "#91a119", color: "#1a1a1a" },
  rock: { background: "#afa981", color: "#1a1a1a" },
  ghost: { background: "#704170", color: "#ffffff" },
  dragon: { background: "#5060e1", color: "#ffffff" },
  dark: { background: "#624d4e", color: "#ffffff" },
  steel: { background: "#60a1b8", color: "#1a1a1a" },
  fairy: { background: "#ef70ef", color: "#1a1a1a" },
};

const STELLAR_COLORS = { background: "#6d7394", color: "#ffffff" };

export function typeColors(type: TeraType): { background: string; color: string } {
  if (type === "stellar") {
    return STELLAR_COLORS;
  }
  return TYPE_COLORS[type];
}
