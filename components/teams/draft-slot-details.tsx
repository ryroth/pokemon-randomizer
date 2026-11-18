import { TypeBadge } from "@/components/recap/type-badge";
import type { DraftSlotPreview } from "@/lib/teams/draftPreview";

/** Ability, moves, item, and base stats for one Pokémon that is not built yet. */
export function DraftSlotDetails({ preview }: { preview: DraftSlotPreview }) {
  const item =
    preview.itemName === undefined ? "Not chosen yet" : preview.itemName === null ? "None" : preview.itemName;

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-1">
        {preview.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
        {preview.shiny ? <span className="text-xs font-medium">Shiny</span> : null}
      </div>
      <p>
        <span className="font-medium">Base stats. </span>
        <span className="font-mono text-xs tabular-nums">{preview.statLine}</span>
      </p>
      <p>
        <span className="font-medium">Ability. </span>
        {preview.abilityName ?? "Not chosen yet"}
      </p>
      <p>
        <span className="font-medium">Item. </span>
        {item}
      </p>
      <p>
        <span className="font-medium">Moves. </span>
        {preview.moves.length > 0 ? preview.moves.join(", ") : "Not chosen yet"}
      </p>
    </div>
  );
}
