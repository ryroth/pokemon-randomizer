"use client";

import Link from "next/link";
import { useState } from "react";
import { useTeams } from "@/components/teams/team-provider";
import { Button } from "@/components/ui/button";
import type { RecapCatalog } from "@/lib/recap/entries";
import { TEAM_SIZE, type SavedTeam } from "@/lib/teams/teams";
import type { PokemonSet } from "@/lib/types/session";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SaveToTeam({ set, catalog }: { set: PokemonSet; catalog: RecapCatalog }) {
  const { box, ready, chooseTeam, saveToNewTeam, saveToNextSlot, removeFromTeam, moveWithinTeam } = useTeams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading saved teams…
      </p>
    );
  }

  const active = box.teams.find((team) => team.id === box.activeTeamId) ?? null;
  const full = active !== null && active.sets.length >= TEAM_SIZE;

  function remember(result: { ok: true; teamName: string; slot: number } | { ok: false; message: string }) {
    if (result.ok) {
      setError(null);
      setMessage(`Saved to ${result.teamName}, slot ${result.slot} of ${TEAM_SIZE}.`);
      return;
    }
    setMessage(null);
    setError(result.message);
  }

  return (
    <section aria-labelledby="save-team-heading" className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-1">
        <h2 id="save-team-heading" className="text-lg font-semibold">
          Save to a team
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Copy this Pokémon on its own, add it to the next open slot, or start another team of {TEAM_SIZE}. Saved
          teams stay put when you start the next randomizer.
        </p>
      </div>

      {box.teams.length > 1 ? (
        <label className="block max-w-sm space-y-1.5 text-sm font-medium">
          Team that receives the next Pokémon
          <select
            className={controlClass}
            value={box.activeTeamId ?? ""}
            onChange={(event) => chooseTeam(event.target.value)}
          >
            {box.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.sets.length} of {TEAM_SIZE})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {active ? (
        <TeamSlots
          team={active}
          catalog={catalog}
          onRemove={(slotIndex) => {
            const result = removeFromTeam(active.id, slotIndex);
            if (result.ok) {
              setError(null);
              setMessage(`Removed the Pokémon in slot ${result.slot} of ${result.teamName}.`);
              return;
            }
            setMessage(null);
            setError(result.message);
          }}
          onMove={(fromIndex, toIndex) => {
            const result = moveWithinTeam(active.id, fromIndex, toIndex);
            if (result.ok) {
              setError(null);
              setMessage(`Moved the Pokémon from slot ${result.fromSlot} to slot ${result.toSlot} of ${result.teamName}.`);
              return;
            }
            setMessage(null);
            setError(result.message);
          }}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {active ? (
          <Button type="button" size="lg" className="w-fit" disabled={full} onClick={() => remember(saveToNextSlot(set))}>
            {full ? `${active.name} is full` : `Save to ${active.name}, slot ${active.sets.length + 1}`}
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant={active ? "outline" : "default"}
          className="w-fit"
          onClick={() => remember(saveToNewTeam(set))}
        >
          Save to a new team
        </Button>
        <Link href="/teams" className="self-center text-sm font-medium text-primary underline-offset-4 hover:underline">
          View teams
        </Link>
      </div>

      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="status" className="text-sm">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function TeamSlots({
  team,
  catalog,
  onRemove,
  onMove,
}: {
  team: SavedTeam;
  catalog: RecapCatalog;
  onRemove: (slotIndex: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  const slots = Array.from({ length: TEAM_SIZE }, (_, index) => team.sets[index] ?? null);
  return (
    <ol aria-label={`${team.name} slots`} className="grid gap-2 sm:grid-cols-2">
      {slots.map((slot, index) => (
        <li
          key={index}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <p className="min-w-0">
            <span className="text-muted-foreground">Slot {index + 1}. </span>
            {slot ? slotLabel(slot, catalog) : "Empty"}
          </p>
          {slot ? (
            <div className="flex flex-wrap items-center gap-2">
              <MoveSlotControl slotIndex={index} filledCount={team.sets.length} onMove={onMove} />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                aria-label={`Remove slot ${index + 1}`}
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

const slotMoveClass =
  "h-7 rounded-md border border-input bg-background px-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MoveSlotControl({
  slotIndex,
  filledCount,
  onMove,
}: {
  slotIndex: number;
  filledCount: number;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  if (filledCount < 2) {
    return null;
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground" aria-hidden="true">
        Move to
      </span>
      <select
        aria-label={`Move slot ${slotIndex + 1} to`}
        className={slotMoveClass}
        value={String(slotIndex)}
        onChange={(event) => {
          const toIndex = Number(event.target.value);
          if (toIndex !== slotIndex) {
            onMove(slotIndex, toIndex);
          }
        }}
      >
        {Array.from({ length: filledCount }, (_, option) => (
          <option key={option} value={String(option)}>
            Slot {option + 1}
          </option>
        ))}
      </select>
    </div>
  );
}

export function slotLabel(set: PokemonSet, catalog: RecapCatalog): string {
  const pokemon = catalog.pokemon.find((form) => form.id === set.pokemonId);
  const species = pokemon?.displayName ?? "Unknown Pokémon";
  const nickname = set.nickname?.trim();
  return nickname ? `${nickname} (${species})` : species;
}
