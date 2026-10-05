import { TYPE_LABELS, type TeraType } from "@/lib/types/pokemon-type";
import { typeColors } from "@/components/type-colors";

export function TypeBadge({ type }: { type: TeraType }) {
  const colors = typeColors(type);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase"
      style={{ backgroundColor: colors.background, color: colors.color }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}
