import { formatGuessedSpread, type EvSuggestion } from "@/lib/builder";
import { natureChoiceLabel } from "@/lib/builder/labels";
import { calculateBattleStats } from "@/lib/stats/battleStat";
import type { Nature } from "@/lib/types/catalog-entities";
import type { PokemonForm } from "@/lib/types/pokemon";
import { STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";
import { MAX_EV_PER_STAT, MAX_EV_TOTAL, MAX_IV, MIN_IV, maxEvForStat } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const ROW_LABELS: Record<StatId, string> = {
  hp: "HP",
  atk: "Attack",
  def: "Defense",
  spa: "Sp. Atk.",
  spd: "Sp. Def.",
  spe: "Speed",
};

const numberClass =
  "h-8 w-12 rounded-md border border-input bg-background px-1 text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function StatSpreadSheet({
  pokemon,
  ivs,
  evs,
  level,
  nature,
  natures,
  suggestion,
  evTotal,
  evsConfirmed,
  canConfirm,
  onEvChange,
  onIvChange,
  onNatureChange,
  onApplySuggestion,
  onConfirm,
}: {
  pokemon: PokemonForm;
  ivs?: Partial<StatSpread>;
  evs?: Partial<StatSpread>;
  level?: number;
  nature?: Nature;
  natures: readonly Nature[];
  suggestion?: EvSuggestion;
  evTotal: number;
  evsConfirmed: boolean;
  canConfirm: boolean;
  onEvChange: (stat: StatId, value: number | undefined) => void;
  onIvChange: (stat: StatId, value: number | undefined) => void;
  onNatureChange: (natureId: string | undefined) => void;
  onApplySuggestion: (suggestion: EvSuggestion) => void;
  onConfirm: (confirmed: boolean) => void;
}) {
  const calculated = calculateBattleStats({
    base: pokemon.baseStats,
    ivs,
    evs,
    level,
    plusStat: nature?.plusStat,
    minusStat: nature?.minusStat,
  });
  const remaining = MAX_EV_TOTAL - evTotal;
  return (
    <section className="space-y-3" aria-labelledby="battle-stats-heading">
      <h2 id="battle-stats-heading" className="text-lg font-medium">
        Stats
      </h2>
      {suggestion ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <p>
            <span className="font-medium">Guessed spread: </span>
            {formatGuessedSpread(suggestion)}
          </p>
          <button
            type="button"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            onClick={() => onApplySuggestion(suggestion)}
          >
            Use this spread
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Choose four moves to see a guessed spread.</p>
      )}
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Scroll the stat table sideways if it does not fit"
      >
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <caption className="sr-only">Stats at level {calculated.level}</caption>
          <thead>
            <tr className="text-left text-xs font-medium text-muted-foreground">
              <th scope="col" className="w-24" />
              <th scope="col" colSpan={2}>
                Base
              </th>
              <th scope="col" colSpan={2}>
                EVs
              </th>
              <th scope="col">IVs</th>
              <th scope="col" className="text-right">
                At lv. {calculated.level}
              </th>
            </tr>
          </thead>
          <tbody>
            {calculated.stats.map((stat) => {
              const base = pokemon.baseStats[stat.stat];
              const ev = evs?.[stat.stat];
              const evCap = maxEvForStat(evs, stat.stat);
              const sign = stat.natureEffect === "boost" ? "+" : stat.natureEffect === "drop" ? "−" : "";
              return (
                <tr key={stat.stat}>
                  <th scope="row" className="pr-2 text-left font-medium">
                    {ROW_LABELS[stat.stat]}
                  </th>
                  <td className="w-10 tabular-nums">{base}</td>
                  <td className="w-24 pr-3">
                    <span className="block h-2.5 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
                      <span
                        className="block h-full"
                        style={{
                          width: `${Math.min(100, (base / 255) * 100)}%`,
                          backgroundColor: baseStatColor(base),
                        }}
                      />
                    </span>
                  </td>
                  <td className="pr-2">
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={evCap}
                        aria-label={`${STAT_LABELS[stat.stat]} EVs`}
                        className={numberClass}
                        value={ev ?? ""}
                        onChange={(event) => {
                          const raw = event.target.value;
                          onEvChange(stat.stat, raw === "" ? undefined : Number(raw));
                        }}
                      />
                      <span
                        className={cn(
                          "w-3 text-sm font-medium",
                          stat.natureEffect === "boost" && "text-emerald-700 dark:text-emerald-300",
                          stat.natureEffect === "drop" && "text-red-700 dark:text-red-300",
                        )}
                        aria-hidden="true"
                      >
                        {sign}
                      </span>
                    </span>
                  </td>
                  <td className="pr-3">
                    <input
                      type="range"
                      min={0}
                      max={MAX_EV_PER_STAT}
                      step={1}
                      aria-label={`${STAT_LABELS[stat.stat]} EV slider`}
                      className="w-full min-w-16 accent-foreground"
                      value={ev ?? 0}
                      onChange={(event) => onEvChange(stat.stat, Number(event.target.value))}
                    />
                  </td>
                  <td className="pr-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={MIN_IV}
                      max={MAX_IV}
                      aria-label={`${STAT_LABELS[stat.stat]} IVs`}
                      className={numberClass}
                      value={ivs?.[stat.stat] ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        onIvChange(stat.stat, raw === "" ? undefined : Number(raw));
                      }}
                    />
                  </td>
                  <td className="text-right tabular-nums">
                    <span
                      aria-label={`${ROW_LABELS[stat.stat]} ${stat.value}${
                        stat.natureEffect === "boost"
                          ? ", raised by Nature"
                          : stat.natureEffect === "drop"
                            ? ", lowered by Nature"
                            : ""
                      }`}
                    >
                      {stat.value}
                      {sign}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={cn("text-sm", remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
        Remaining: {remaining}
      </p>
      <label className="block max-w-sm space-y-1.5 text-sm font-medium">
        Nature
        <select
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={nature?.id ?? ""}
          onChange={(event) => onNatureChange(event.target.value || undefined)}
        >
          <option value="">Choose a Nature</option>
          {[...natures]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {natureChoiceLabel(entry)}
              </option>
            ))}
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        Blank EV slots count as 0. The total cannot pass {MAX_EV_TOTAL}. Confirm the spread once it
        looks right.
      </p>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={evsConfirmed}
          disabled={!canConfirm}
          onChange={(event) => onConfirm(event.target.checked)}
        />
        I confirm this EV spread
      </label>
    </section>
  );
}

function baseStatColor(base: number): string {
  const hue = Math.max(0, Math.min(120, (base - 20) * 1.5));
  return `hsl(${hue} 75% 42%)`;
}
