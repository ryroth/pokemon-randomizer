import { TYPE_LABELS, type TeraType } from "@/lib/types/pokemon-type";

const TYPE_COLORS: Record<Exclude<TeraType, "stellar">, { background: string; color: string }> = {
  normal: { background: "#9fa19f", color: "#fff" },
  fire: { background: "#e62829", color: "#fff" },
  water: { background: "#2980ef", color: "#fff" },
  electric: { background: "#fac000", color: "#1a1a1a" },
  grass: { background: "#3fa129", color: "#fff" },
  ice: { background: "#3dcef3", color: "#1a1a1a" },
  fighting: { background: "#ff8000", color: "#fff" },
  poison: { background: "#9141cb", color: "#fff" },
  ground: { background: "#915121", color: "#fff" },
  flying: { background: "#81b9ef", color: "#1a1a1a" },
  psychic: { background: "#ef4179", color: "#fff" },
  bug: { background: "#91a119", color: "#fff" },
  rock: { background: "#afa981", color: "#1a1a1a" },
  ghost: { background: "#704170", color: "#fff" },
  dragon: { background: "#5060e1", color: "#fff" },
  dark: { background: "#624d4e", color: "#fff" },
  steel: { background: "#60a1b8", color: "#fff" },
  fairy: { background: "#ef70ef", color: "#1a1a1a" },
};

export function TypeBadge({ type }: { type: TeraType }) {
  const colors = type === "stellar" ? { background: "#6d7394", color: "#fff" } : TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase"
      style={{ backgroundColor: colors.background, color: colors.color }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}
