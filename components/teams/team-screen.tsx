"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { RouteNotice } from "@/components/layout/route-notice";
import { MoveSlotControl, slotLabel } from "@/components/recap/save-to-team";
import { PokedexCard } from "@/components/recap/pokedex-card";
import { NextRandomizerButton } from "@/components/session/next-randomizer-button";
import { useTeams } from "@/components/teams/team-provider";
import { TeamSlotSprite } from "@/components/teams/team-slot-sprite";
import { Button, buttonVariants } from "@/components/ui/button";
import { buildRecapEntry, type RecapCatalog } from "@/lib/recap/entries";
import { teamShowdownText } from "@/lib/teams/export";
import { slotIndexAfterMove, TEAM_SIZE, type SavedTeam } from "@/lib/teams/teams";
import { cn } from "@/lib/utils";

export function TeamScreen({ catalog }: { catalog: RecapCatalog }) {
  const { box, ready, chooseTeam, removeFromTeam, moveWithinTeam, clearTeam } = useTeams();
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  if (!ready) {
    return <RouteNotice title="Teams" message="Loading your teams…" live />;
  }

  return (
    <PageFrame>
      <header className="hero-panel max-w-3xl space-y-3">
        <Link href="/recap" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
          Back to the recap
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Each team holds up to {TEAM_SIZE} saved Pokémon. Open a saved Pokémon to see its recap and Showdown set, move it
          to another slot, copy one set or the whole team, remove it, or clear the team.
        </p>
        <NextRandomizerButton />
      </header>

      {clearedMessage ? (
        <p role="status" className="text-sm">
          {clearedMessage}
        </p>
      ) : null}

      {box.teams.length === 0 ? (
        <div className="space-y-4">
          <p className="text-base leading-7 text-muted-foreground">
            Finish a Pokémon and save it from the recap to start a team.
          </p>
          <Link href="/recap" className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
            Go to the recap
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {box.teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              catalog={catalog}
              current={team.id === box.activeTeamId}
              onMakeCurrent={() => chooseTeam(team.id)}
              onRemove={(slotIndex) => removeFromTeam(team.id, slotIndex)}
              onMove={(fromIndex, toIndex) => moveWithinTeam(team.id, fromIndex, toIndex)}
              onClear={() => {
                const result = clearTeam(team.id);
                if (result.ok) {
                  setClearedMessage(`Cleared ${result.teamName}.`);
                }
                return result;
              }}
            />
          ))}
        </div>
      )}
    </PageFrame>
  );
}

function TeamCard({
  team,
  catalog,
  current,
  onMakeCurrent,
  onRemove,
  onMove,
  onClear,
}: {
  team: SavedTeam;
  catalog: RecapCatalog;
  current: boolean;
  onMakeCurrent: () => void;
  onRemove: (slotIndex: number) => { ok: true; slot: number } | { ok: false; message: string };
  onMove: (
    fromIndex: number,
    toIndex: number,
  ) => { ok: true; fromSlot: number; toSlot: number } | { ok: false; message: string };
  onClear: () => { ok: true; teamName: string } | { ok: false; message: string };
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [removeMessage, setRemoveMessage] = useState<string | null>(null);
  const [moveMessage, setMoveMessage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const slots = Array.from({ length: TEAM_SIZE }, (_, index) => team.sets[index] ?? null);
  const selectedSet = selectedIndex === null ? null : (team.sets[selectedIndex] ?? null);

  async function copyTeam() {
    const exported = teamShowdownText(team.sets, catalog);
    if (!exported.ok) {
      setSlotMessage(exported.message);
      setFallbackText(null);
      setCopyState("failed");
      return;
    }
    setSlotMessage(null);
    await writeClipboard(exported.text, setCopyState, setFallbackText);
  }

  async function copySlot(index: number) {
    const set = team.sets[index];
    if (!set) {
      return;
    }
    const entry = buildRecapEntry(set, catalog);
    if (!entry) {
      setSlotMessage("This Pokémon does not match the current catalog.");
      return;
    }
    setSlotMessage(null);
    await writeClipboard(entry.showdownText, setCopyState, setFallbackText);
  }

  return (
    <section aria-labelledby={`${team.id}-heading`} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id={`${team.id}-heading`} className="text-xl font-semibold">
            {team.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{team.sets.length}</span> of{" "}
            <span className="font-mono tabular-nums">{TEAM_SIZE}</span> Pokémon{current ? ". This team receives the next save." : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {current ? null : (
            <Button type="button" variant="outline" onClick={onMakeCurrent}>
              Add the next Pokémon here
            </Button>
          )}
          <Button type="button" onClick={() => void copyTeam()} disabled={team.sets.length === 0}>
            Copy team to Showdown
          </Button>
          <ClearTeamButton teamId={team.id} teamName={team.name} onConfirm={onClear} />
        </div>
      </div>

      <ol aria-label={`${team.name} slots`} className="grid gap-2 sm:grid-cols-2">
        {slots.map((slot, index) => (
          <li
            key={index}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              {slot ? (
                <SlotSprite set={slot} catalog={catalog} />
              ) : (
                <span className="size-12 shrink-0" aria-hidden="true" />
              )}
              <p className="min-w-0 text-sm">
                <span className="text-muted-foreground">Slot {index + 1}. </span>
                {slot ? slotLabel(slot, catalog) : "Empty"}
              </p>
            </div>
            {slot ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={selectedIndex === index ? "secondary" : "outline"}
                  size="sm"
                  aria-pressed={selectedIndex === index}
                  aria-label={`View recap, slot ${index + 1}`}
                  onClick={() => setSelectedIndex((current) => (current === index ? null : index))}
                >
                  {selectedIndex === index ? "Hide recap" : "View recap"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void copySlot(index)}>
                  Copy set
                </Button>
                <MoveSlotControl
                  slotIndex={index}
                  filledCount={team.sets.length}
                  onMove={(fromIndex, toIndex) => {
                    const result = onMove(fromIndex, toIndex);
                    setCopyState("idle");
                    setFallbackText(null);
                    setSlotMessage(null);
                    setRemoveMessage(null);
                    if (result.ok) {
                      setSelectedIndex((current) => slotIndexAfterMove(current, fromIndex, toIndex));
                      setMoveMessage(`Moved the Pokémon from slot ${result.fromSlot} to slot ${result.toSlot}.`);
                      return;
                    }
                    setMoveMessage(result.message);
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  aria-label={`Remove slot ${index + 1}`}
                  onClick={() => {
                    const result = onRemove(index);
                    setCopyState("idle");
                    setFallbackText(null);
                    setSlotMessage(null);
                    setMoveMessage(null);
                    setSelectedIndex((current) => {
                      if (current === null || !result.ok) {
                        return current;
                      }
                      if (current === index) {
                        return null;
                      }
                      return current > index ? current - 1 : current;
                    });
                    setRemoveMessage(
                      result.ok ? `Removed the Pokémon in slot ${result.slot}.` : result.message,
                    );
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {selectedSet && selectedIndex !== null ? (
        <TeamMemberRecap set={selectedSet} catalog={catalog} slot={selectedIndex + 1} onClose={() => setSelectedIndex(null)} />
      ) : null}

      {moveMessage ? (
        <p role="status" className="text-sm">
          {moveMessage}
        </p>
      ) : null}

      {removeMessage ? (
        <p role="status" className="text-sm">
          {removeMessage}
        </p>
      ) : null}

      {copyState === "copied" ? (
        <p role="status" className="text-sm">
          Copied. Paste it into a Pokémon Showdown teambuilder.
        </p>
      ) : null}
      {copyState === "failed" ? (
        <div className="space-y-2">
          <p role="status" className="text-sm">
            {slotMessage ?? "The browser blocked copying. Select the text below and copy it."}
          </p>
          {fallbackText ? (
            <pre
              aria-label="Showdown export text"
              className="overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm leading-6 whitespace-pre-wrap"
            >
              {fallbackText}
            </pre>
          ) : null}
        </div>
      ) : null}
      {slotMessage && copyState !== "failed" ? (
        <p role="status" className="text-sm">
          {slotMessage}
        </p>
      ) : null}
    </section>
  );
}

function SlotSprite({ set, catalog }: { set: SavedTeam["sets"][number]; catalog: RecapCatalog }) {
  const pokemon = catalog.pokemon.find((form) => form.id === set.pokemonId);
  if (!pokemon) {
    return <span className="size-12 shrink-0" aria-hidden="true" />;
  }
  return (
    <TeamSlotSprite
      key={`${pokemon.id}-${set.shiny ? "shiny" : "plain"}`}
      sprites={pokemon.sprites}
      shiny={set.shiny}
      name={pokemon.displayName}
    />
  );
}

function ClearTeamButton({
  teamId,
  teamName,
  onConfirm,
}: {
  teamId: string;
  teamName: string;
  onConfirm: () => { ok: boolean };
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `${teamId}-clear-title`;
  const bodyId = `${teamId}-clear-body`;

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => dialogRef.current?.showModal()}>
        Clear team
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="w-[min(24rem,calc(100%-2rem))] rounded-2xl border border-border bg-card p-5 text-foreground shadow-lg backdrop:bg-black/60"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        <h3 id={titleId} className="text-lg font-semibold">
          Clear {teamName}?
        </h3>
        <p id={bodyId} className="mt-2 text-sm leading-6 text-muted-foreground">
          Every Pokémon on {teamName} will be removed. Other teams stay saved.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              dialogRef.current?.close();
              onConfirm();
            }}
          >
            Clear team
          </Button>
        </div>
      </dialog>
    </>
  );
}

function TeamMemberRecap({
  set,
  catalog,
  slot,
  onClose,
}: {
  set: SavedTeam["sets"][number];
  catalog: RecapCatalog;
  slot: number;
  onClose: () => void;
}) {
  const entry = buildRecapEntry(set, catalog);
  return (
    <section aria-label={`Recap for slot ${slot}`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Recap for slot {slot}</h3>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close recap
        </Button>
      </div>
      {entry ? (
        <PokedexCard key={`${entry.pokemonId}-${slot}`} entry={entry} />
      ) : (
        <p className="rounded-2xl border border-border bg-card p-5 text-sm leading-6">
          This Pokémon does not match the current catalog.
        </p>
      )}
    </section>
  );
}

async function writeClipboard(
  text: string,
  setCopyState: (state: "idle" | "copied" | "failed") => void,
  setFallbackText: (text: string | null) => void,
) {
  try {
    await navigator.clipboard.writeText(text);
    setFallbackText(null);
    setCopyState("copied");
  } catch {
    setFallbackText(text);
    setCopyState("failed");
  }
}
