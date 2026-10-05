"use client";

import { useState } from "react";
import { TypeBadge } from "@/components/recap/type-badge";
import { formatMoveTableAccuracy, formatMoveTablePower, formatMoveTablePp } from "@/lib/data/moveDisplay";
import { MOVE_CATEGORY_LABELS, type MoveCategory } from "@/lib/types/catalog-entities";
import type { RecapMoveView } from "@/lib/recap/entries";

export function MovePanel({ moves }: { moves: readonly RecapMoveView[] }) {
  const [selected, setSelected] = useState(0);
  const move = moves[selected] ?? moves[0];
  if (!move) {
    return null;
  }

  return (
    <div className="space-y-3">
      <ol aria-label="Moves" className="space-y-1.5">
        {moves.map((candidate, index) => {
          const pressed = index === selected;
          return (
            <li key={`${candidate.name}-${index}`}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => setSelected(index)}
                className={`flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#f2c14e] ${
                  pressed ? "border-[#f2c14e] bg-[#245fb4]" : "border-transparent bg-[#12367a] hover:bg-[#1a4694]"
                }`}
              >
                <TypeBadge type={candidate.type} />
                <span className="min-w-0 flex-1 truncate font-medium">{candidate.name}</span>
                <span className="rounded-md bg-[#0c2b62] px-2 py-0.5 text-xs font-semibold tabular-nums">
                  PP {formatMoveTablePp(candidate.pp)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="space-y-3 rounded-lg bg-[#12367a] px-3 py-3" aria-live="polite">
        {move.description ? <p className="text-sm leading-6 text-[#e7f1ff]">{move.description}</p> : null}
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[#b7d4ff]">Category</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-medium">
              <CategoryMark category={move.category} />
              {MOVE_CATEGORY_LABELS[move.category]}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[#b7d4ff]">Power</dt>
            <dd className="mt-1 font-semibold tabular-nums">{formatMoveTablePower(move.power)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[#b7d4ff]">Accuracy</dt>
            <dd className="mt-1 font-semibold tabular-nums">{formatMoveTableAccuracy(move.accuracy)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function CategoryMark({ category }: { category: MoveCategory }) {
  const label = MOVE_CATEGORY_LABELS[category];
  return (
    <span title={label} className="inline-flex">
      {category === "physical" ? <PhysicalMark /> : category === "special" ? <SpecialMark /> : <StatusMark />}
    </span>
  );
}

function PhysicalMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill="#e67e22" />
      <path
        d="M8 1.2 9.1 5.2 13.2 4.4 10.4 7.2 13.8 9.6 9.4 9.2 8 13.2 6.6 9.2 2.2 9.6 5.6 7.2 2.8 4.4 6.9 5.2Z"
        fill="#f39c12"
      />
    </svg>
  );
}

function SpecialMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="#9eb0ff" strokeWidth="1.6" />
      <circle cx="8" cy="8" r="2.4" fill="#c5d0ff" />
    </svg>
  );
}

function StatusMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="#c5c5c5" />
      <rect x="4" y="7.1" width="8" height="1.8" rx="0.4" fill="#1a1a1a" />
    </svg>
  );
}
