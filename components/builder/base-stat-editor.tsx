"use client";

import { NumberInput } from "@/components/builder/number-input";
import { baseStatTotal, editingBaseStats } from "@/lib/pokemon/customAttributes";
import { MAX_CUSTOM_BASE_STAT, MIN_CUSTOM_BASE_STAT } from "@/lib/formats/schema";
import { STAT_IDS, STAT_LABELS, type StatId, type StatSpread } from "@/lib/types/stats";

const controlClass =
  "h-9 w-24 rounded-lg border border-input bg-background px-2.5 font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Edits this set's base stats. The species stats stay on the catalog. */
export function BaseStatEditor({
  species,
  custom,
  onChange,
  onReset,
  idPrefix = "base",
  changing = true,
  onChanging,
}: {
  species: StatSpread;
  custom: StatSpread | undefined;
  onChange: (stat: StatId, value: number) => void;
  onReset: () => void;
  idPrefix?: string;
  /** When `onChanging` is set, the stat inputs stay hidden until `changing` is on. */
  changing?: boolean;
  onChanging?: (enabled: boolean) => void;
}) {
  const shown = editingBaseStats(species, custom);
  const speciesTotal = baseStatTotal(species);
  const shownTotal = baseStatTotal(shown);
  const pickerOpen = onChanging ? changing : true;

  return (
    <section id={`${idPrefix}-base-stats`} tabIndex={-1} className="scroll-mt-24 space-y-3 outline-none">
      <h2 className="text-lg font-medium">Base stats</h2>
      {onChanging ? (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={changing}
            onChange={(event) => onChanging(event.target.checked)}
          />
          Change this Pokémon&apos;s base stats
        </label>
      ) : null}
      {pickerOpen ? (
        <>
          <p className="text-sm text-muted-foreground">
            These are the species base stats, before level, IVs, EVs, and Nature. Leave them as they are,
            or type new ones for this set. A format decides whether a battle can use the new numbers.
          </p>
          <p className="font-mono text-sm tabular-nums">
            Total {shownTotal}
            {custom ? ` (${shownTotal - speciesTotal >= 0 ? "+" : ""}${shownTotal - speciesTotal} from ${speciesTotal})` : ` (species total ${speciesTotal})`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {STAT_IDS.map((stat) => {
              const changed = custom !== undefined && custom[stat] !== species[stat];
              return (
                <div key={stat} className="flex flex-wrap items-end gap-2">
                  <label className="space-y-1 text-sm font-medium">
                    {STAT_LABELS[stat]}
                    <NumberInput
                      aria-label={`${STAT_LABELS[stat]} base stat`}
                      className={controlClass}
                      min={MIN_CUSTOM_BASE_STAT}
                      max={MAX_CUSTOM_BASE_STAT}
                      value={shown[stat]}
                      onCommit={(value) => onChange(stat, value)}
                    />
                  </label>
                  <p className="pb-2 text-xs text-muted-foreground">
                    Species {species[stat]}
                    {changed ? ` · now ${shown[stat]}` : ""}
                  </p>
                  {changed ? (
                    <button
                      type="button"
                      className="mb-1 rounded-md px-2 py-1 text-xs underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      onClick={() => onChange(stat, species[stat])}
                    >
                      Reset {STAT_LABELS[stat]}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {custom ? (
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={onReset}
            >
              Reset all base stats
            </button>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Using this Pokémon&apos;s species base stats.</p>
      )}
    </section>
  );
}
