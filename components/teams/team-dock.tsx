"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, GripVertical } from "lucide-react";
import { TypeBadge } from "@/components/recap/type-badge";
import { useRandomizerSession } from "@/components/session/session-provider";
import { useTeams } from "@/components/teams/team-provider";
import { TeamSlotSprite } from "@/components/teams/team-slot-sprite";
import { TeamTools } from "@/components/teams/team-tools";
import { useDockPokemon } from "@/components/teams/use-dock-pokemon";
import { Button } from "@/components/ui/button";
import { openDraftInBuilder } from "@/lib/builder";
import { exportTeamText, type DockPokemon } from "@/lib/data/dockPokemon";
import { builtSetsInRoster, firstUnbuiltIndex } from "@/lib/teams/draftRoster";
import { clampToFilledSlot, TEAM_SIZE, type DraftRoster, type SavedTeam } from "@/lib/teams/teams";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * The six-slot roster for the active saved team. It reads and writes the same team storage
 * as the Teams page, so a change here shows up there and the other way around.
 */
export function TeamRoster({
  headingId,
  headingLevel = 2,
  onClose,
}: {
  headingId: string;
  headingLevel?: 2 | 3;
  onClose?: () => void;
}) {
  const router = useRouter();
  const { session, setSession } = useRandomizerSession();
  const { box, ready, chooseTeam, moveWithinTeam, copyToTeam, removeDraft } = useTeams();
  const roster = box.draftRoster ?? null;
  const rosterKey = roster
    ? `${roster.id}:${roster.slots.length}:${roster.slots.filter((slot) => slot.status === "built").length}`
    : "";
  const [pinned, setPinned] = useState<{ key: string; teamId: string } | null>(null);
  const pinnedTeamId = pinned && pinned.key === rosterKey ? pinned.teamId : null;
  const showDraft = Boolean(roster) && pinnedTeamId === null;
  const active = showDraft
    ? null
    : (box.teams.find((team) => team.id === (pinnedTeamId ?? box.activeTeamId)) ??
      box.teams.find((team) => team.id === box.activeTeamId) ??
      null);
  const draftIds =
    roster?.slots.flatMap((slot) => {
      const id = slot.status === "draft" ? slot.pokemon.draft.pokemonId : slot.set.pokemonId;
      return id ? [id] : [];
    }) ?? [];
  const lookup = useDockPokemon(showDraft ? draftIds : (active?.sets.map((set) => set.pokemonId) ?? []));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  const Heading = headingLevel === 2 ? "h2" : "h3";
  const filled = showDraft ? (roster?.slots.length ?? 0) : (active?.sets.length ?? 0);
  const headingName = showDraft ? roster?.name : active?.name;

  function move(team: SavedTeam, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    const result = moveWithinTeam(team.id, fromIndex, toIndex);
    setFallbackText(null);
    setMessage(
      result.ok
        ? `Moved the Pokémon from slot ${result.fromSlot} to slot ${result.toSlot}.`
        : result.message,
    );
  }

  async function copyTeam(team: SavedTeam) {
    const exported = await exportTeamText(team.sets);
    if (!exported.ok) {
      setFallbackText(null);
      setMessage(exported.message);
      return;
    }
    try {
      await navigator.clipboard.writeText(exported.text);
      setFallbackText(null);
      setMessage("Copied. Paste it into a Pokémon Showdown teambuilder.");
    } catch {
      setFallbackText(exported.text);
      setMessage("The browser blocked copying. Select the text below and copy it.");
    }
  }

  function endDrag() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function openNextDraft(current: DraftRoster) {
    const index = firstUnbuiltIndex(current);
    const slot = current.slots[index];
    if (!slot || slot.status !== "draft") {
      return;
    }
    setSession(openDraftInBuilder(session, current.id, slot.pokemon, index));
    router.push("/builder");
  }

  async function copyBuilt(current: DraftRoster) {
    const exported = await exportTeamText(builtSetsInRoster(current));
    if (!exported.ok) {
      setFallbackText(null);
      setMessage(exported.message);
      return;
    }
    try {
      await navigator.clipboard.writeText(exported.text);
      setFallbackText(null);
      setMessage("Copied the Pokémon that are already built.");
    } catch {
      setFallbackText(exported.text);
      setMessage("The browser blocked copying. Select the text below and copy it.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading id={headingId} className="text-lg font-semibold">
            Team
          </Heading>
          {headingName ? <p className="text-base font-semibold">{headingName}</p> : null}
          <p className="text-sm text-muted-foreground">
            {headingName ? (
              <>
                <span className="font-mono tabular-nums">
                  {filled}/{TEAM_SIZE}
                </span>{" "}
                Pokémon
              </>
            ) : (
              "No team yet"
            )}
          </p>
          {showDraft ? (
            <p className="text-sm text-muted-foreground">
              {filled < TEAM_SIZE
                ? "Building starts when this team has 6."
                : "Build these Pokémon in slot order."}
            </p>
          ) : null}
        </div>
        {onClose ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>

      {!ready ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading saved teams…
        </p>
      ) : null}

      {ready && (box.teams.length > 1 || (roster && box.teams.length > 0)) ? (
        <label className="block space-y-1.5 text-sm font-medium">
          Active team
          <select
            className={selectClass}
            value={showDraft ? "draft" : (active?.id ?? "")}
            onChange={(event) => {
              setMessage(null);
              setFallbackText(null);
              const teamId = event.target.value;
              if (teamId === "draft") {
                setPinned(null);
                return;
              }
              setPinned(roster ? { key: rosterKey, teamId } : null);
              chooseTeam(teamId);
            }}
          >
            {roster ? (
              <option value="draft">
                {roster.name} ({roster.slots.length} of {TEAM_SIZE}, not finished)
              </option>
            ) : null}
            {box.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.sets.length} of {TEAM_SIZE})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {ready && !active && !showDraft ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Finish a Pokémon and save it from the recap to start a team. Your six slots appear here.
        </p>
      ) : null}

      {showDraft && roster ? (
        <DraftRosterList
          roster={roster}
          lookup={lookup}
          onRemove={(index) => {
            const result = removeDraft(index);
            setFallbackText(null);
            setMessage(result.ok ? `Removed the Pokémon from slot ${result.slot}.` : result.message);
          }}
        />
      ) : null}

      {active ? (
        <ol aria-label={`${active.name} roster`} className="flex flex-col gap-2">
          {Array.from({ length: TEAM_SIZE }, (_, index) => {
            const set = active.sets[index] ?? null;
            return (
              <RosterSlot
                key={index}
                index={index}
                set={set}
                pokemon={set ? lookup[set.pokemonId] : undefined}
                filledCount={filled}
                dragging={dragIndex === index}
                dropTarget={overIndex === index && dragIndex !== null && dragIndex !== index}
                onDragStart={() => setDragIndex(index)}
                onDragOver={() => setOverIndex(index)}
                onDrop={() => {
                  if (dragIndex !== null) {
                    move(active, dragIndex, clampToFilledSlot(index, filled));
                  }
                  endDrag();
                }}
                onDragEnd={endDrag}
                onMove={(toIndex) => move(active, index, toIndex)}
                otherTeams={box.teams.filter((team) => team.id !== active.id)}
                onCopyTo={(teamId) => {
                  const result = copyToTeam(active.id, index, teamId);
                  setFallbackText(null);
                  setMessage(
                    result.ok
                      ? `Copied the Pokémon to ${result.teamName}, slot ${result.slot}.`
                      : result.message,
                  );
                }}
              />
            );
          })}
        </ol>
      ) : null}

      {active ? <TeamTools team={active} /> : null}

      {showDraft && roster ? (
        <div className="flex flex-col gap-2">
          {firstUnbuiltIndex(roster) >= 0 &&
          (roster.slots.length === TEAM_SIZE || roster.slots.some((slot) => slot.status === "built")) ? (
            <Button type="button" onClick={() => openNextDraft(roster)}>
              {roster.slots.some((slot) => slot.status === "built") ? "Build the next Pokémon" : "Start building"}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void copyBuilt(roster)}
            disabled={builtSetsInRoster(roster).length === 0}
          >
            <Copy aria-hidden="true" />
            Copy built Pokémon
          </Button>
          <p className="text-sm text-muted-foreground">Pokémon that are not built yet are left out.</p>
          <Link
            href="/teams"
            className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Manage teams
          </Link>
        </div>
      ) : null}

      {active ? (
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={() => void copyTeam(active)} disabled={filled === 0}>
            <Copy aria-hidden="true" />
            Copy team
          </Button>
          <Link
            href="/teams"
            className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Manage teams
          </Link>
        </div>
      ) : null}

      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {message}
      </p>
      {fallbackText ? (
        <pre
          aria-label="Showdown team text"
          className="max-h-48 overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-5 whitespace-pre-wrap"
        >
          {fallbackText}
        </pre>
      ) : null}
    </div>
  );
}

function DraftRosterList({
  roster,
  lookup,
  onRemove,
}: {
  roster: DraftRoster;
  lookup: Record<string, DockPokemon>;
  onRemove: (index: number) => void;
}) {
  const canRemove = roster.slots.every((slot) => slot.status === "draft");

  return (
    <ol aria-label={`${roster.name} roster`} className="flex flex-col gap-2">
      {Array.from({ length: TEAM_SIZE }, (_, index) => {
        const slot = roster.slots[index];
        if (!slot) {
          return (
            <li
              key={index}
              className="flex min-h-14 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
            >
              <span className="font-mono tabular-nums">{index + 1}</span>
              <span>Empty slot</span>
            </li>
          );
        }
        const pokemonId = slot.status === "draft" ? slot.pokemon.draft.pokemonId : slot.set.pokemonId;
        const pokemon = pokemonId ? lookup[pokemonId] : undefined;
        const shiny = slot.status === "draft" ? Boolean(slot.pokemon.draft.shiny) : slot.set.shiny;
        const species = pokemon?.displayName ?? "Loading…";
        const nickname = slot.status === "built" ? slot.set.nickname?.trim() : "";
        const name = nickname ? `${nickname} (${species})` : species;
        return (
          <li
            key={index}
            className="flex min-h-14 items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
          >
            {pokemon ? (
              <TeamSlotSprite sprites={pokemon.sprites} shiny={shiny} name={pokemon.displayName} />
            ) : (
              <span className="size-12 shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                <span className="sr-only">Slot {index + 1}. </span>
                {name}
              </p>
              <p className="text-xs text-muted-foreground">{slot.status === "draft" ? "Not built yet" : "Built"}</p>
            </div>
            {canRemove ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Remove ${name} from the team`}
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function RosterSlot({
  index,
  set,
  pokemon,
  filledCount,
  dragging,
  dropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMove,
  otherTeams = [],
  onCopyTo,
}: {
  index: number;
  set: SavedTeam["sets"][number] | null;
  pokemon: DockPokemon | undefined;
  filledCount: number;
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMove: (toIndex: number) => void;
  otherTeams?: readonly SavedTeam[];
  onCopyTo?: (teamId: string) => void;
}) {
  if (!set) {
    return (
      <li
        onDragOver={(event) => {
          event.preventDefault();
          onDragOver();
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDrop();
        }}
        className="flex min-h-14 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
      >
        <span className="font-mono tabular-nums">{index + 1}</span>
        <span>Empty slot</span>
      </li>
    );
  }

  const species = pokemon?.displayName ?? "Loading…";
  const nickname = set.nickname?.trim();
  const name = nickname ? `${nickname} (${species})` : species;

  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex min-h-14 items-center gap-2 rounded-lg border bg-background px-2 py-1.5",
        dragging && "opacity-50",
        dropTarget ? "border-dashed border-ring ring-2 ring-ring/40" : "border-border",
      )}
    >
      <GripVertical aria-hidden="true" className="size-4 shrink-0 cursor-grab text-muted-foreground" />
      {pokemon ? (
        <TeamSlotSprite
          key={`${pokemon.id}-${set.shiny ? "shiny" : "plain"}`}
          sprites={pokemon.sprites}
          shiny={set.shiny}
          name={pokemon.displayName}
        />
      ) : (
        <span className="size-12 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <span className="sr-only">Slot {index + 1}. </span>
          {name}
        </p>
        {pokemon ? (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {(set.customTypes ?? pokemon.types).map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
            {set.shiny ? <span className="text-xs font-medium">Shiny</span> : null}
          </div>
        ) : null}
        {otherTeams.length > 0 && onCopyTo ? (
          <label className="mt-1 block text-xs font-medium text-muted-foreground">
            Copy to
            <select
              className="mt-0.5 h-8 w-full rounded-lg border border-input bg-background px-1.5 text-xs text-foreground"
              aria-label={`Copy ${name} to another team`}
              value=""
              onChange={(event) => {
                const teamId = event.target.value;
                if (teamId) {
                  onCopyTo(teamId);
                }
              }}
            >
              <option value="">Choose a team</option>
              {otherTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${name} up`}
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${name} down`}
          disabled={index >= filledCount - 1}
          onClick={() => onMove(index + 1)}
        >
          <ChevronDown />
        </Button>
      </div>
    </li>
  );
}

/** Persistent side rail for desktop widths. Phones and tablets use the bottom bar instead. */
export function TeamDockRail() {
  return (
    <aside
      aria-labelledby="team-dock-heading"
      className="hidden border-l border-border bg-card/85 backdrop-blur-md lg:block"
    >
      <div className="sticky top-0 max-h-dvh overflow-y-auto p-[var(--space-card-p)]">
        <TeamRoster headingId="team-dock-heading" />
      </div>
    </aside>
  );
}
