"use client";

import { Shuffle } from "lucide-react";
import { RerollButton } from "@/components/randomizer/reroll-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoveAccuracy, formatMovePower } from "@/lib/data/moveDisplay";
import { MOVES_ASSIGNED_PER_POKEMON } from "@/lib/randomizer/applyExtras";
import { filledMoveCount } from "@/lib/randomizer/session";
import { MOVE_CATEGORY_LABELS } from "@/lib/types/catalog-entities";
import type { Move } from "@/lib/types/catalog-entities";
import { TYPE_LABELS } from "@/lib/types/pokemon-type";
import { cn } from "@/lib/utils";

interface MoveResultsProps {
  moves: readonly Move[];
  selectedMoveIds: readonly (string | undefined)[];
  selectable: boolean;
  errorMessage: string | null;
  onGenerate: () => void;
  onSelect: (moveId: string) => void;
  onReroll: (moveId: string) => void;
}

export function MoveResults({
  moves,
  selectedMoveIds,
  selectable,
  errorMessage,
  onGenerate,
  onSelect,
  onReroll,
}: MoveResultsProps) {
  const selectedCount = filledMoveCount(selectedMoveIds);

  return (
    <section id="moves" aria-label="Move results" className="space-y-4">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}
      <Button type="button" size="lg" onClick={onGenerate}>
        <Shuffle />
        Generate moves
      </Button>
      {selectable && moves.length > 0 ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {selectedCount} of {MOVES_ASSIGNED_PER_POKEMON} moves selected.
        </p>
      ) : null}
      {moves.length > 0 ? (
        <ul
          aria-label="Generated moves"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {moves.map((move) => {
            const selected = selectable && selectedMoveIds.includes(move.id);
            const canPick = !selectable || selected || selectedCount < MOVES_ASSIGNED_PER_POKEMON;

            return (
              <li key={move.id}>
                <Card
                  className={cn(
                    "flex h-full flex-col",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {selectable ? (
                    <button
                      type="button"
                      className="flex w-full flex-1 flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-pressed={selected}
                      disabled={!canPick}
                      onClick={() => onSelect(move.id)}
                    >
                      <MoveCardBody
                        move={move}
                        selected={selected}
                        selectable
                        canPick={canPick}
                      />
                    </button>
                  ) : (
                    <MoveCardBody move={move} selected={false} selectable={false} canPick />
                  )}
                  <RerollButton name={move.name} onClick={() => onReroll(move.id)} />
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function MoveCardBody({
  move,
  selected,
  selectable,
  canPick,
}: {
  move: Move;
  selected: boolean;
  selectable: boolean;
  canPick: boolean;
}) {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h3 className="contents">{move.name}</h3>
        </CardTitle>
        {selectable ? (
          selected ? (
            <p className="text-sm font-medium text-primary">Selected</p>
          ) : canPick ? (
            <p className="text-sm text-muted-foreground">Click to select</p>
          ) : (
            <p className="text-sm text-muted-foreground">Four moves already selected</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">In this pool</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
            {TYPE_LABELS[move.type]}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
            {MOVE_CATEGORY_LABELS[move.category]}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
            {formatMovePower(move.power)}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
            {formatMoveAccuracy(move.accuracy)}
          </span>
        </p>
        {move.description ? (
          <p className="text-sm leading-6 text-muted-foreground">{move.description}</p>
        ) : null}
      </CardContent>
    </>
  );
}
