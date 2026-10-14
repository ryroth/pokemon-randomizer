import { baseStatTotal } from "@/lib/randomizer/ball";
import { SHOWDOWN_STAT_LABELS, STAT_IDS, type StatSpread } from "@/lib/types/stats";
import { cn } from "@/lib/utils";

/** Base stats for a Pokémon the user is still choosing, before the Builder. */
export function BaseStatLine({
  stats,
  showTotal = false,
  className,
}: {
  stats: StatSpread;
  showTotal?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground", className)}>
      {showTotal ? (
        <span>
          <span className="font-medium text-foreground">BST</span>{" "}
          <span className="font-mono tabular-nums">{baseStatTotal(stats)}</span>
        </span>
      ) : null}
      {STAT_IDS.map((stat) => (
        <span key={stat}>
          <span className="font-medium text-foreground">{SHOWDOWN_STAT_LABELS[stat]}</span>{" "}
          <span className="font-mono tabular-nums">{stats[stat]}</span>
        </span>
      ))}
    </p>
  );
}
