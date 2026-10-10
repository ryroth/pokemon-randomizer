"use client";

import { TriangleAlert } from "lucide-react";
import { TypeBadge } from "@/components/recap/type-badge";
import type { TeamDetailsState } from "@/components/teams/use-team-details";
import { analyzeTeam, type DefenseRow, type OffenseRow } from "@/lib/analysis/teamAnalysis";
import { describeMultiplier, formatMultiplier } from "@/lib/analysis/typeChart";
import { TYPE_LABELS, type PokemonType } from "@/lib/types/pokemon-type";
import { cn } from "@/lib/utils";

function typeList(types: readonly PokemonType[]): string {
  return types.map((type) => TYPE_LABELS[type]).join(", ");
}

/**
 * Defensive and offensive type coverage for the active team. It is computed from the team's own
 * types and the types of its damaging moves, so it updates the moment the roster changes.
 */
export function TeamAnalysisPanel({ state }: { state: TeamDetailsState }) {
  if (state.status === "loading") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Reading the team…
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.message}
      </p>
    );
  }
  if (state.members.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a Pokémon to see how the team covers each type.</p>;
  }

  const analysis = analyzeTeam(state.members);
  const labels = state.members.map((member) => member.label);

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-sm" aria-live="polite">
        <p>
          <span className="font-semibold">Shared weaknesses: </span>
          {analysis.sharedWeaknesses.length > 0
            ? typeList(analysis.sharedWeaknesses)
            : "None. No type hits more of the team than it resists."}
        </p>
        <p>
          <span className="font-semibold">Coverage gaps: </span>
          {analysis.coverageGaps.length > 0
            ? typeList(analysis.coverageGaps)
            : "None. Every type is hit super effectively by a move."}
        </p>
      </div>

      <DefenseTable rows={analysis.defense} labels={labels} />
      <OffenseTable rows={analysis.offense} />

      <p className="text-xs leading-5 text-muted-foreground">
        Based on each Pokémon&apos;s types and the types of its damaging moves. Abilities, items, and Tera types
        are not counted.
      </p>
    </div>
  );
}

function DefenseTable({ rows, labels }: { rows: DefenseRow[]; labels: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <caption className="pb-2 text-left text-sm font-semibold">
          Defense: damage each attacking type does to your team
        </caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-1 pr-2 font-medium">
              Attacker
            </th>
            {labels.map((label, index) => (
              <th key={index} scope="col" className="px-0.5 py-1 text-center font-mono font-medium tabular-nums" title={label}>
                {index + 1}
                <span className="sr-only"> {label}</span>
              </th>
            ))}
            <th scope="col" className="px-1 py-1 text-center font-medium">
              Weak
            </th>
            <th scope="col" className="px-1 py-1 text-center font-medium">
              Resist
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.attacker} className={cn("border-b border-border/60", row.net > 0 && "bg-destructive/10")}>
              <th scope="row" className="py-1 pr-2 text-left font-normal">
                <TypeBadge type={row.attacker} />
                {row.net > 0 ? <span className="sr-only"> Team weakness</span> : null}
              </th>
              {row.multipliers.map((multiplier, index) => (
                <td
                  key={index}
                  className={cn(
                    "px-0.5 py-1 text-center font-mono tabular-nums",
                    multiplier > 1 && "font-bold",
                    multiplier === 0 && "text-muted-foreground",
                  )}
                >
                  {multiplier === 1 ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="sr-only">{describeMultiplier(multiplier)}</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">{formatMultiplier(multiplier)}</span>
                      <span className="sr-only">{describeMultiplier(multiplier)}</span>
                    </>
                  )}
                </td>
              ))}
              <td className={cn("px-1 py-1 text-center font-mono tabular-nums", row.net > 0 && "font-bold")}>
                {row.weak}
              </td>
              <td className="px-1 py-1 text-center font-mono tabular-nums">{row.resist + row.immune}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pt-1 text-xs text-muted-foreground">Columns follow the roster slots. A dot means normal damage.</p>
    </div>
  );
}

function OffenseTable({ rows }: { rows: OffenseRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <caption className="pb-2 text-left text-sm font-semibold">
          Offense: damaging moves that are super effective against each type
        </caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-1 pr-2 font-medium">
              Defender
            </th>
            <th scope="col" className="px-1 py-1 text-center font-medium">
              Moves
            </th>
            <th scope="col" className="py-1 pl-2 font-medium">
              Which
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const names = [...new Set(row.moves.map((entry) => entry.move))];
            return (
              <tr key={row.defender} className={cn("border-b border-border/60", row.gap && "bg-destructive/10")}>
                <th scope="row" className="py-1 pr-2 text-left font-normal">
                  <TypeBadge type={row.defender} />
                </th>
                <td className={cn("px-1 py-1 text-center font-mono tabular-nums", row.gap && "font-bold")}>
                  {row.moves.length}
                </td>
                <td className="py-1 pl-2 leading-4">
                  {row.gap ? (
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                      Gap: no coverage
                    </span>
                  ) : (
                    names.join(", ")
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
