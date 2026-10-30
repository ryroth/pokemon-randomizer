"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { RouteNotice } from "@/components/layout/route-notice";
import { openDraftInBuilder, openSavedSetInBuilder } from "@/lib/builder";
import { savedSetEditAccess } from "@/lib/builder/locks";
import { firstUnbuiltIndex } from "@/lib/teams/draftRoster";
import { TEAM_SIZE, type DraftRoster } from "@/lib/teams/teams";
import { MoveSlotControl, slotLabel } from "@/components/recap/save-to-team";
import { PokedexCard } from "@/components/recap/pokedex-card";
import { NextRandomizerButton } from "@/components/session/next-randomizer-button";
import { useRandomizerSession } from "@/components/session/session-provider";
import { useTeams } from "@/components/teams/team-provider";
import { TeamSlotSprite } from "@/components/teams/team-slot-sprite";
import { Button, buttonVariants } from "@/components/ui/button";
import { buildRecapEntry, type RecapCatalog } from "@/lib/recap/entries";
import { teamShowdownText } from "@/lib/teams/export";
import { slotIndexAfterMove, type SavedTeam } from "@/lib/teams/teams";
import { cn } from "@/lib/utils";

export function TeamScreen({ catalog }: { catalog: RecapCatalog }) {
  const router = useRouter();
  const { session, setSession } = useRandomizerSession();
  const { box, ready, chooseTeam, removeFromTeam, moveWithinTeam, clearTeam, rename, copyToTeam, removeDraft, renameDraft } =
    useTeams();
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  function editMember(teamId: string, index: number, target?: string) {
    const set = box.teams.find((team) => team.id === teamId)?.sets[index];
    if (!set) {
      return;
    }
    setSession(openSavedSetInBuilder(session, set, teamId, index));
    router.push(target ? `/builder#${target}` : "/builder");
  }

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
          Each team holds up to {TEAM_SIZE} saved Pokémon. Name a team, open a saved Pokémon to see its recap and
          Showdown set, and select any part of that recap to change it in the builder. Edit on the Pokémon
          itself opens the builder too. The team keeps those changes. Move a Pokémon to another slot, or drag
          it onto another team to copy it there.
        </p>
        <NextRandomizerButton />
      </header>

      {clearedMessage ? (
        <p role="status" className="text-sm">
          {clearedMessage}
        </p>
      ) : null}

      {box.draftRoster ? (
        <DraftTeamCard
          roster={box.draftRoster}
          catalog={catalog}
          onRename={(name) => renameDraft(name)}
          onRemove={(index) => removeDraft(index)}
          onBuildNext={() => {
            const roster = box.draftRoster;
            if (!roster) {
              return;
            }
            const index = firstUnbuiltIndex(roster);
            const slot = roster.slots[index];
            if (!slot || slot.status !== "draft") {
              return;
            }
            setSession(openDraftInBuilder(session, roster.id, slot.pokemon, index));
            router.push("/builder");
          }}
        />
      ) : null}

      {box.teams.length === 0 && !box.draftRoster ? (
        <div className="space-y-4">
          <p className="text-base leading-7 text-muted-foreground">
            Finish a Pokémon and save it from the recap to start a team. Or add randomized Pokémon from the randomizer until a team has 6, then build each one.
          </p>
          <Link href="/recap" className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
            Go to the recap
          </Link>
        </div>
      ) : null}

      {box.teams.length > 0 ? (
        <div className="flex flex-col gap-6">
          {box.teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              catalog={catalog}
              otherTeams={box.teams.filter((candidate) => candidate.id !== team.id)}
              current={team.id === box.activeTeamId}
              onMakeCurrent={() => chooseTeam(team.id)}
              onRename={(name) => rename(team.id, name)}
              onCopy={copyToTeam}
              onRemove={(slotIndex) => removeFromTeam(team.id, slotIndex)}
              onMove={(fromIndex, toIndex) => moveWithinTeam(team.id, fromIndex, toIndex)}
              onEdit={(index, target) => editMember(team.id, index, target)}
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
      ) : null}
    </PageFrame>
  );
}

function DraftTeamCard({
  roster,
  catalog,
  onRename,
  onRemove,
  onBuildNext,
}: {
  roster: DraftRoster;
  catalog: RecapCatalog;
  onRename: (name: string) => { ok: true; teamName: string } | { ok: false; message: string };
  onRemove: (index: number) => { ok: boolean; message?: string; slot?: number };
  onBuildNext: () => void;
}) {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const started = roster.slots.some((slot) => slot.status === "built");
  const nextIndex = firstUnbuiltIndex(roster);
  const canBuild = roster.slots.length === TEAM_SIZE && nextIndex >= 0;
  const nameValue = nameDraft ?? roster.name;

  function commitName() {
    if (nameDraft === null || nameDraft.trim() === roster.name) {
      setNameDraft(null);
      return;
    }
    const result = onRename(nameDraft);
    setMessage(result.ok ? null : result.message);
    setNameDraft(null);
  }

  return (
    <section aria-labelledby={`${roster.id}-heading`} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-2">
        <h2 id={`${roster.id}-heading`} className="text-xl font-semibold">
          {roster.name}
        </h2>
        <label className="block max-w-xs space-y-1 text-sm font-medium">
          Team name
          <input
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={nameValue}
            maxLength={24}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{roster.slots.length}</span> of{" "}
          <span className="font-mono tabular-nums">{TEAM_SIZE}</span> Pokémon. Building starts when this team has 6.
        </p>
      </div>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      <ol aria-label={`${roster.name} slots`} className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: TEAM_SIZE }, (_, index) => {
          const slot = roster.slots[index];
          if (!slot) {
            return (
              <li key={index} className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                {index + 1}. Empty slot
              </li>
            );
          }
          const pokemonId = slot.status === "draft" ? slot.pokemon.draft.pokemonId : slot.set.pokemonId;
          const form = catalog.pokemon.find((pokemon) => pokemon.id === pokemonId);
          const shiny = slot.status === "draft" ? Boolean(slot.pokemon.draft.shiny) : slot.set.shiny;
          const species = form?.displayName ?? "Pokémon";
          const nickname = slot.status === "built" ? slot.set.nickname?.trim() : "";
          const name = nickname ? `${nickname} (${species})` : species;
          return (
            <li key={index} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                {form ? <TeamSlotSprite sprites={form.sprites} shiny={shiny} name={form.displayName} /> : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Slot {index + 1}. {name}
                  </p>
                  <p className="text-xs text-muted-foreground">{slot.status === "draft" ? "Not built yet" : "Built"}</p>
                </div>
              </div>
              {!started && slot.status === "draft" ? (
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Remove ${name} from the team`}
                  onClick={() => {
                    const result = onRemove(index);
                    setMessage(result.ok ? `Removed the Pokémon from slot ${result.slot}.` : (result.message ?? ""));
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {canBuild ? (
        <Button type="button" size="lg" onClick={onBuildNext}>
          {started ? "Build the next Pokémon" : "Start building"}
        </Button>
      ) : roster.slots.length < TEAM_SIZE ? (
        <Link href="/randomizer" className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
          Roll the next Pokémon
        </Link>
      ) : null}
    </section>
  );
}

function TeamCard({
  team,
  catalog,
  otherTeams,
  current,
  onMakeCurrent,
  onRename,
  onCopy,
  onRemove,
  onMove,
  onClear,
  onEdit,
}: {
  team: SavedTeam;
  catalog: RecapCatalog;
  otherTeams: readonly SavedTeam[];
  current: boolean;
  onMakeCurrent: () => void;
  onRename: (name: string) => { ok: true; teamName: string } | { ok: false; message: string };
  onCopy: (
    fromTeamId: string,
    fromIndex: number,
    toTeamId: string,
  ) => { ok: true; teamName: string; slot: number } | { ok: false; message: string };
  onRemove: (slotIndex: number) => { ok: true; slot: number } | { ok: false; message: string };
  onMove: (
    fromIndex: number,
    toIndex: number,
  ) => { ok: true; fromSlot: number; toSlot: number } | { ok: false; message: string };
  onClear: () => { ok: true; teamName: string } | { ok: false; message: string };
  onEdit: (index: number, target?: string) => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [removeMessage, setRemoveMessage] = useState<string | null>(null);
  const [moveMessage, setMoveMessage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState(team.name);
  const [dropActive, setDropActive] = useState(false);
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

  function commitName() {
    if (nameDraft.trim() === team.name) {
      setNameDraft(team.name);
      return;
    }
    const result = onRename(nameDraft);
    if (!result.ok) {
      setNameDraft(team.name);
      setSlotMessage(result.message);
      return;
    }
    setNameDraft(result.teamName);
    setSlotMessage(`Renamed the team to ${result.teamName}.`);
  }

  function acceptCopy(event: DragEvent) {
    const payload = event.dataTransfer.getData("text/plain");
    const separator = payload.indexOf(":");
    const fromTeamId = separator === -1 ? "" : payload.slice(0, separator);
    const fromIndex = Number(payload.slice(separator + 1));
    if (!fromTeamId || fromTeamId === team.id || !Number.isInteger(fromIndex)) {
      return;
    }
    const result = onCopy(fromTeamId, fromIndex, team.id);
    setCopyState("idle");
    setFallbackText(null);
    setMoveMessage(null);
    setRemoveMessage(null);
    setSlotMessage(result.ok ? `Copied the Pokémon to ${result.teamName}, slot ${result.slot}.` : result.message);
  }

  return (
    <section
      aria-labelledby={`${team.id}-heading`}
      className={cn(
        "space-y-4 rounded-2xl border bg-card p-5",
        dropActive ? "border-ring ring-2 ring-ring/40" : "border-border",
      )}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("text/plain")) {
          return;
        }
        event.preventDefault();
        setDropActive(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        setDropActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDropActive(false);
        acceptCopy(event);
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 id={`${team.id}-heading`} className="text-xl font-semibold">
            {team.name}
          </h2>
          <label className="block max-w-xs space-y-1 text-sm font-medium">
            Team name
            <input
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={nameDraft}
              maxLength={24}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </label>
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
            draggable={Boolean(slot)}
            onDragStart={(event) => {
              if (!slot) {
                return;
              }
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData("text/plain", `${team.id}:${index}`);
            }}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Edit slot ${index + 1}`}
                  onClick={() => onEdit(index)}
                >
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void copySlot(index)}>
                  Copy set
                </Button>
                {otherTeams.length > 0 ? (
                  <label className="text-sm">
                    <span className="sr-only">Copy to another team</span>
                    <select
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                      aria-label={`Copy slot ${index + 1} to another team`}
                      value=""
                      onChange={(event) => {
                        const toTeamId = event.target.value;
                        if (!toTeamId) {
                          return;
                        }
                        const result = onCopy(team.id, index, toTeamId);
                        setCopyState("idle");
                        setFallbackText(null);
                        setMoveMessage(null);
                        setRemoveMessage(null);
                        setSlotMessage(
                          result.ok
                            ? `Copied the Pokémon to ${result.teamName}, slot ${result.slot}.`
                            : result.message,
                        );
                      }}
                    >
                      <option value="">Copy to a team</option>
                      {otherTeams.map((other) => (
                        <option key={other.id} value={other.id}>
                          {other.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
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
        <TeamMemberRecap
          set={selectedSet}
          catalog={catalog}
          slot={selectedIndex + 1}
          onClose={() => setSelectedIndex(null)}
          onEdit={(target) => onEdit(selectedIndex, target)}
        />
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
  onEdit,
}: {
  set: SavedTeam["sets"][number];
  catalog: RecapCatalog;
  slot: number;
  onClose: () => void;
  onEdit: (target: string) => void;
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
        <PokedexCard
          key={`${entry.pokemonId}-${slot}`}
          entry={entry}
          edit={savedSetEditAccess(set)}
          onEdit={onEdit}
        />
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
