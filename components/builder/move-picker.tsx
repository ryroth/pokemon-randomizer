"use client";

import { useState } from "react";
import { CommandPalette, type PaletteSection } from "@/components/builder/command-palette";
import { ToggleChip, toggleFilterValue } from "@/components/randomizer/filter-dropdown";
import { LEARN_METHODS, type LearnMethod } from "@/lib/builder/learnsets";
import { TYPE_COLORS } from "@/components/type-colors";
import { Button } from "@/components/ui/button";
import { isStabMove } from "@/lib/builder/stab";
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

type ColumnAlign = "start" | "center" | "end";

const SORT_COLUMNS: ReadonlyArray<{ column: MoveSortColumn; label: string; align: ColumnAlign }> = [
  { column: "name", label: "Name", align: "start" },
  { column: "type", label: "Type", align: "start" },
  { column: "category", label: "Cat", align: "center" },
  { column: "power", label: "Pow", align: "end" },
  { column: "accuracy", label: "Acc", align: "end" },
  { column: "pp", label: "PP", align: "end" },
];

const LEARN_SHORT_LABELS: Record<LearnMethod, string> = {
  "level-up": "Lv.",
  tm: "TM",
  egg: "Egg",
  tutor: "Tutor",
};

/** Name, type, category, power, accuracy, PP, then (when shown) how it is learned, then the effect. */
function gridClass(showLearned: boolean): string {
  return cn(
    "grid items-center gap-x-3",
    showLearned
      ? "grid-cols-[minmax(7.5rem,1.3fr)_4.75rem_2.25rem_2.75rem_2.75rem_2.5rem_6.5rem_minmax(11rem,3fr)]"
      : "grid-cols-[minmax(7.5rem,1.3fr)_4.75rem_2.25rem_2.75rem_2.75rem_2.5rem_minmax(11rem,3fr)]",
  );
}

/**
 * Four move slots. Choosing a slot opens a search palette over the standard list or the
 * Pokémon's learnset. Every row is one line of aligned columns, and each column heading sorts.
 */
export function MovePicker({
  moves,
  poolIds,
  selectedIds,
  lockedSlots,
  pokemonTypes,
  onSelect,
  learnFilter,
}: {
  moves: readonly Move[];
  poolIds: readonly string[];
  selectedIds: readonly (string | undefined)[];
  lockedSlots?: readonly boolean[];
  pokemonTypes: readonly PokemonType[];
  onSelect: (slot: number, moveId: string | undefined) => void;
  /** Present when the list is the Pokémon's own moves: chips to narrow it, and how each move is learned. */
  learnFilter?: {
    methods: readonly LearnMethod[];
    onChange: (methods: LearnMethod[]) => void;
    methodsFor: (moveId: string) => readonly LearnMethod[];
  };
}) {
  const showLearned = learnFilter !== undefined;
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MoveSort | null>(null);
  const movesById = new Map(moves.map((move) => [move.id, move]));

  function close() {
    setOpenSlot(null);
    setQuery("");
  }

  const sections: PaletteSection[] = [];
  if (openSlot !== null) {
    const taken = new Set(selectedIds.filter((id, index) => index !== openSlot && id));
    const pool = poolIds.flatMap((id) => {
      if (taken.has(id)) return [];
      const move = movesById.get(id);
      return move ? [move] : [];
    });
    const { matches } = searchMovesByName(pool, query);
    const listed = sort ? sortMoves(matches, sort) : matches;
    const current = selectedIds[openSlot];
    sections.push({
      id: "moves",
      options: listed.map((move) => ({
        id: move.id,
        label: moveLabel(move, pokemonTypes),
        selected: move.id === current,
        content: (
          <MoveRow
            move={move}
            query={query}
            stab={isStabMove(move, pokemonTypes)}
            learned={learnFilter ? learnFilter.methodsFor(move.id) : undefined}
          />
        ),
      })),
    });
  }

  const listedCount = sections[0]?.options.length ?? 0;

  return (
    <div className="space-y-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: REQUIRED_MOVE_COUNT }, (_, slot) => {
          const move = movesById.get(selectedIds[slot] ?? "");
          const locked = Boolean(lockedSlots?.[slot]);
          return (
            <li key={slot} className="space-y-1.5 rounded-lg border border-border bg-card p-2.5">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                <span>Move {slot + 1}</span>
                {locked ? <span>Set by the randomizer</span> : null}
              </div>
              {locked ? (
                <MoveSummary move={move} stab={move ? isStabMove(move, pokemonTypes) : false} />
              ) : (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Choose move ${slot + 1}${move ? `, currently ${move.name}` : ""}`}
                  className="block w-full rounded-md border border-input bg-background px-2 py-1.5 text-left outline-none hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => setOpenSlot(slot)}
                >
                  <MoveSummary move={move} stab={move ? isStabMove(move, pokemonTypes) : false} />
                </button>
              )}
              {move && !locked ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(slot, undefined)}>
                  Clear move {slot + 1}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <CommandPalette
        open={openSlot !== null}
        onClose={close}
        title={openSlot === null ? "Choose a move" : `Choose move ${openSlot + 1}`}
        searchLabel="Search moves"
        listLabel="Matching moves"
        query={query}
        onQueryChange={setQuery}
        sections={sections}
        emptyText="No moves match that search."
        toolbar={
          learnFilter ? (
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="sr-only">How the move is learned</legend>
              <span aria-hidden="true" className="text-xs font-medium text-muted-foreground">
                Learned by
              </span>
              {LEARN_METHODS.map((method) => (
                <ToggleChip
                  key={method.id}
                  label={method.label}
                  checked={learnFilter.methods.includes(method.id)}
                  onChange={() => learnFilter.onChange(toggleFilterValue(learnFilter.methods, method.id))}
                />
              ))}
              <span className="text-xs text-muted-foreground">
                {learnFilter.methods.length === 0
                  ? "Showing every move."
                  : `${listedCount} ${listedCount === 1 ? "move" : "moves"} match.`}
              </span>
            </fieldset>
          ) : undefined
        }
        columns={{
          minWidth: showLearned ? "52rem" : "44rem",
          header: (
            <div className={cn(gridClass(showLearned), "text-xs font-medium text-muted-foreground")}>
              {SORT_COLUMNS.map(({ column, label, align }) => (
                <div
                  key={column}
                  className={cn(
                    "flex",
                    align === "end" ? "justify-end" : align === "center" ? "justify-center" : "justify-start",
                  )}
                >
                  <SortButton label={label} column={column} sort={sort} onSort={setSort} />
                </div>
              ))}
              {showLearned ? <span>Learned</span> : null}
              <div>
                <SortButton label="Effect" column="effect" sort={sort} onSort={setSort} />
              </div>
            </div>
          ),
        }}
        onSelect={(moveId) => {
          if (openSlot === null || lockedSlots?.[openSlot]) {
            return;
          }
          onSelect(openSlot, moveId);
          close();
        }}
      />
    </div>
  );
}

function moveLabel(move: Move, pokemonTypes: readonly PokemonType[]): string {
  const stab = isStabMove(move, pokemonTypes) ? ", same-type attack bonus" : "";
  return `${move.name}, ${TYPE_LABELS[move.type]}, ${MOVE_CATEGORY_LABELS[move.category]}, power ${formatMoveTablePower(move.power)}, accuracy ${formatMoveTableAccuracy(move.accuracy)}, PP ${formatMoveTablePp(move.pp)}${stab}`;
}

function SortButton({
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
      className={cn(
        "inline-flex min-h-6 items-center gap-0.5 rounded px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        active && "font-semibold text-foreground",
      )}
      onClick={() => onSort(nextMoveSort(sort, column))}
    >
      {label}
      <span aria-hidden="true" className="inline-block w-3">
        {active ? (sort.direction === "asc" ? "↑" : "↓") : ""}
      </span>
    </button>
  );
}

/** One slot's chosen move: name, type, category, power, accuracy, STAB, then the effect. */
function MoveSummary({ move, stab }: { move: Move | undefined; stab: boolean }) {
  if (!move) {
    return <span className="block py-1 text-sm text-muted-foreground">Choose a move</span>;
  }
  return (
    <span className="block space-y-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{move.name}</span>
        <TypePill type={move.type} />
        <CategoryMark category={move.category} />
        <MoveNumbers move={move} />
        {stab ? <StabTag /> : null}
      </span>
      {move.description ? (
        <span className="line-clamp-2 block text-xs text-muted-foreground">{move.description}</span>
      ) : null}
    </span>
  );
}

/** One palette row. Its columns line up with the headings in `columns.header`. */
function MoveRow({
  move,
  query,
  stab,
  learned,
}: {
  move: Move;
  query: string;
  stab: boolean;
  learned: readonly LearnMethod[] | undefined;
}) {
  return (
    <div className={gridClass(learned !== undefined)}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <HighlightedName name={move.name} query={query} />
        {stab ? <StabTag /> : null}
      </div>
      <div className="justify-self-start">
        <TypePill type={move.type} />
      </div>
      <div className="justify-self-center">
        <CategoryMark category={move.category} />
      </div>
      <span className="text-right font-mono text-xs tabular-nums">{formatMoveTablePower(move.power)}</span>
      <span className="text-right font-mono text-xs tabular-nums">{formatMoveTableAccuracy(move.accuracy)}</span>
      <span className="text-right font-mono text-xs tabular-nums">{formatMoveTablePp(move.pp)}</span>
      {learned !== undefined ? (
        <span className="text-xs">
          {learned.length > 0 ? learned.map((method) => LEARN_SHORT_LABELS[method]).join(", ") : "Transfer"}
        </span>
      ) : null}
      <p className="line-clamp-2 text-xs text-muted-foreground">{move.description}</p>
    </div>
  );
}

function MoveNumbers({ move }: { move: Move }) {
  return (
    <span className="flex items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground">
      <span>
        <span className="font-sans">Pow </span>
        {formatMoveTablePower(move.power)}
      </span>
      <span>
        <span className="font-sans">Acc </span>
        {formatMoveTableAccuracy(move.accuracy)}
      </span>
      <span>
        <span className="font-sans">PP </span>
        {formatMoveTablePp(move.pp)}
      </span>
    </span>
  );
}

function StabTag() {
  return (
    <span
      title="Same-type attack bonus: 1.5× power"
      className="inline-flex h-5 items-center rounded-sm border border-foreground/40 px-1 text-[10px] font-bold tracking-wide"
    >
      STAB
    </span>
  );
}

function HighlightedName({ name, query }: { name: string; query: string }) {
  const span = moveNameMatchSpan(name, query);
  if (!span) {
    return <span className="font-medium">{name}</span>;
  }
  return (
    <span className="font-medium">
      {name.slice(0, span.start)}
      <span className="font-bold text-primary">{name.slice(span.start, span.end)}</span>
      {name.slice(span.end)}
    </span>
  );
}

function TypePill({ type }: { type: PokemonType }) {
  const colors = TYPE_COLORS[type];
  return (
    <span
      className="inline-flex h-5 items-center justify-center rounded-sm px-1.5 text-[10px] font-bold tracking-wide uppercase"
      style={{ backgroundColor: colors.background, color: colors.color }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

function CategoryMark({ category }: { category: MoveCategory }) {
  const label = MOVE_CATEGORY_LABELS[category];
  return (
    <span title={label} role="img" aria-label={label} className="inline-flex justify-center">
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
