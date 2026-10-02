"use client";

import { useState } from "react";
import { searchMovesByName, moveNameMatchSpan } from "@/lib/builder/moveSearch";
import { nextMoveSort, sortMoves, type MoveSort, type MoveSortColumn } from "@/lib/builder/moveSort";
import {
  formatMoveTableAccuracy,
  formatMoveTablePower,
  formatMoveTablePp,
} from "@/lib/data/moveDisplay";
import { MOVE_CATEGORY_LABELS, type Move, type MoveCategory } from "@/lib/types/catalog-entities";
import { TYPE_LABELS, type PokemonType } from "@/lib/types/pokemon-type";
import { REQUIRED_MOVE_COUNT } from "@/lib/validation/moves";
import { cn } from "@/lib/utils";

const ROW_GRID =
  "grid grid-cols-[minmax(7rem,1.15fr)_4.75rem_1.75rem_2.75rem_3.25rem_2.25rem_minmax(12rem,2.2fr)] items-center gap-x-2";

const TYPE_COLORS: Record<PokemonType, { background: string; color: string }> = {
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

export function MovePicker({
  moves,
  poolIds,
  selectedIds,
  lockedSlots,
  onSelect,
}: {
  moves: readonly Move[];
  poolIds: readonly string[];
  selectedIds: readonly (string | undefined)[];
  lockedSlots?: readonly boolean[];
  onSelect: (slot: number, moveId: string | undefined) => void;
}) {
  const firstOpen = lockedSlots?.findIndex((locked) => !locked) ?? 0;
  const [query, setQuery] = useState("");
  const [activeSlot, setActiveSlot] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [sort, setSort] = useState<MoveSort | null>(null);
  const allLocked = lockedSlots?.every(Boolean) ?? false;
  const movesById = new Map(moves.map((move) => [move.id, move]));
  const taken = new Set(selectedIds.filter((id, index) => index !== activeSlot && id));
  const pool = poolIds.flatMap((id) => {
    if (taken.has(id)) return [];
    const move = movesById.get(id);
    return move ? [move] : [];
  });
  const { matches } = searchMovesByName(pool, query);
  const listed = sort ? sortMoves(matches, sort) : matches;
  const selected = movesById.get(selectedIds[activeSlot] ?? "");

  function choose(moveId: string) {
    if (lockedSlots?.[activeSlot]) {
      return;
    }
    onSelect(activeSlot, moveId);
    setQuery("");
    const nextEmpty = selectedIds.findIndex((id, index) => index !== activeSlot && !id);
    if (nextEmpty !== -1) {
      setActiveSlot(nextEmpty);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: REQUIRED_MOVE_COUNT }, (_, slot) => {
          const move = movesById.get(selectedIds[slot] ?? "");
          const locked = Boolean(lockedSlots?.[slot]);
          const active = slot === activeSlot;
          return (
            <div key={slot} className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={active}
                className={cn(
                  "h-9 min-w-0 flex-1 rounded-lg border px-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  locked
                    ? active
                      ? "border-ring bg-muted"
                      : "border-input bg-muted text-foreground"
                    : active
                      ? "border-ring bg-accent"
                      : "border-input bg-background",
                )}
                onClick={() => setActiveSlot(slot)}
              >
                <span className="font-medium">Move {slot + 1}</span>
                <span className="ml-2 text-muted-foreground">{move?.name ?? "Empty"}</span>
              </button>
              {move && !locked ? (
                <button
                  type="button"
                  className="text-sm text-muted-foreground underline-offset-2 outline-none hover:underline focus-visible:underline"
                  onClick={() => onSelect(slot, undefined)}
                >
                  Clear move {slot + 1}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {lockedSlots?.[activeSlot] && selected ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className={cn(ROW_GRID, "border-b border-border bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground")}>
            <span>Name</span>
            <span>Type</span>
            <span>Cat</span>
            <span>Pow</span>
            <span>Acc</span>
            <span>PP</span>
            <span>Effect</span>
          </div>
          <div className={cn(ROW_GRID, "bg-primary/15 px-2 py-1.5 text-foreground")}>
            <MoveColumns move={selected} descriptionClassName="text-foreground" />
          </div>
        </div>
      ) : allLocked ? null : (
        <>
      <label className="block space-y-1.5 text-sm font-medium">
        Search moves
        <input
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="text-sm text-muted-foreground">Choosing move {activeSlot + 1}.</p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <div className={cn(ROW_GRID, "border-b border-border bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground")}>
          <SortHeader label="Name" column="name" sort={sort} onSort={setSort} />
          <SortHeader label="Type" column="type" sort={sort} onSort={setSort} />
          <SortHeader label="Cat" column="category" sort={sort} onSort={setSort} />
          <SortHeader label="Pow" column="power" sort={sort} onSort={setSort} />
          <SortHeader label="Acc" column="accuracy" sort={sort} onSort={setSort} />
          <SortHeader label="PP" column="pp" sort={sort} onSort={setSort} />
          <SortHeader label="Effect" column="effect" sort={sort} onSort={setSort} />
        </div>
        {selected ? (
          <div className={cn(ROW_GRID, "border-b border-border bg-primary/15 px-2 py-1.5 text-foreground")}>
            <MoveColumns move={selected} descriptionClassName="text-foreground" />
          </div>
        ) : null}
        {listed.length > 0 ? (
          <ul aria-label="Matching moves" className="max-h-80 overflow-y-auto">
            {listed.map((move) => (
              <li key={move.id} className="border-b border-border/70 last:border-b-0">
                <button
                  type="button"
                  aria-label={`${move.name}, ${TYPE_LABELS[move.type]}, ${MOVE_CATEGORY_LABELS[move.category]}, power ${formatMoveTablePower(move.power)}, accuracy ${formatMoveTableAccuracy(move.accuracy)}, PP ${formatMoveTablePp(move.pp)}`}
                  className={cn(
                    ROW_GRID,
                    "w-full px-2 py-1.5 text-left outline-none hover:bg-muted/70 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  )}
                  onClick={() => choose(move.id)}
                >
                  <MoveColumns move={move} query={query} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-muted-foreground">No moves match that search.</p>
        )}
      </div>
        </>
      )}
    </div>
  );
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: MoveSortColumn;
  sort: MoveSort | null;
  onSort: (sort: MoveSort) => void;
}) {
  const active = sort?.column === column;
  const directionLabel = active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
  return (
    <button
      type="button"
      aria-label={directionLabel ? `${label}, sorted ${directionLabel}` : `Sort by ${label}`}
      className="inline-flex items-center gap-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onSort(nextMoveSort(sort, column))}
    >
      {label}
      <span aria-hidden="true" className="inline-block w-3">
        {active ? (sort.direction === "asc" ? "↑" : "↓") : ""}
      </span>
    </button>
  );
}

function MoveColumns({
  move,
  query = "",
  descriptionClassName = "text-muted-foreground",
}: {
  move: Move;
  query?: string;
  descriptionClassName?: string;
}) {
  const typeColor = TYPE_COLORS[move.type];
  return (
    <>
      <HighlightedName name={move.name} query={query} />
      <TypePill type={move.type} background={typeColor.background} color={typeColor.color} />
      <CategoryMark category={move.category} />
      <span className="tabular-nums">{formatMoveTablePower(move.power)}</span>
      <span className="tabular-nums">{formatMoveTableAccuracy(move.accuracy)}</span>
      <span className="tabular-nums">{formatMoveTablePp(move.pp)}</span>
      <span className={cn("truncate", descriptionClassName)}>{move.description}</span>
    </>
  );
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const span = moveNameMatchSpan(name, query);
  if (!span) {
    return <span className="truncate font-medium">{name}</span>;
  }
  return (
    <span className="truncate font-medium">
      {name.slice(0, span.start)}
      <span className="font-bold text-primary">{name.slice(span.start, span.end)}</span>
      {name.slice(span.end)}
    </span>
  );
}

function TypePill({
  type,
  background,
  color,
}: {
  type: PokemonType;
  background: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex h-5 items-center justify-center rounded-sm px-1.5 text-[10px] font-bold tracking-wide uppercase"
      style={{ backgroundColor: background, color }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

function CategoryMark({ category }: { category: MoveCategory }) {
  const label = MOVE_CATEGORY_LABELS[category];
  return (
    <span title={label} aria-label={label} className="inline-flex justify-center">
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
      <circle cx="8" cy="8" r="6" fill="none" stroke="#5b6ee1" strokeWidth="1.6" />
      <circle cx="8" cy="8" r="2.4" fill="#7f8cff" />
    </svg>
  );
}

function StatusMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="#8d8d8d" />
      <rect x="4" y="7.1" width="8" height="1.8" rx="0.4" fill="#fff" />
    </svg>
  );
}
