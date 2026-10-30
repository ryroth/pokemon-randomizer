"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openDraftInBuilder } from "@/lib/builder";
import { nextRollKeepingConfig } from "@/lib/randomizer/session";
import { draftedPokemonFromSession, firstUnbuiltIndex } from "@/lib/teams/draftRoster";
import { TEAM_SIZE } from "@/lib/teams/teams";
import { useRandomizerSession } from "@/components/session/session-provider";
import { useTeams } from "@/components/teams/team-provider";
import { Button } from "@/components/ui/button";

/** Puts the current Pokémon on the draft team, or opens the Builder once that team has six. */
export function AddToDraftTeam({ ready }: { ready: boolean }) {
  const router = useRouter();
  const { session, setSession } = useRandomizerSession();
  const { box, ready: teamsReady, addDraft } = useTeams();
  const [message, setMessage] = useState<string | null>(null);
  const roster = box.draftRoster;
  const count = roster?.slots.length ?? 0;
  const unbuiltIndex = roster ? firstUnbuiltIndex(roster) : -1;
  const started = roster?.slots.some((slot) => slot.status === "built") ?? false;
  const teamIsFull = count >= TEAM_SIZE;
  const openBuild = Boolean(roster && unbuiltIndex >= 0 && (started || teamIsFull));

  function openSlot(index: number) {
    const current = box.draftRoster;
    const slot = current?.slots[index];
    if (!current || !slot || slot.status !== "draft") {
      return;
    }
    setSession(openDraftInBuilder(session, current.id, slot.pokemon, index));
    router.push("/builder");
  }

  function addPokemon() {
    const captured = draftedPokemonFromSession(session);
    if (!captured) {
      setMessage("Finish this Pokémon's randomizer steps before adding it to the team.");
      return;
    }
    const added = addDraft(captured);
    if (!added.ok) {
      setMessage(added.message);
      return;
    }
    if (added.full) {
      const first = added.box.draftRoster?.slots[0];
      if (added.box.draftRoster && first?.status === "draft") {
        setSession(openDraftInBuilder(session, added.rosterId, first.pokemon, 0));
        router.push("/builder");
      }
      return;
    }
    setSession(nextRollKeepingConfig(session));
    router.push("/randomizer");
  }

  if (openBuild) {
    return (
      <Button type="button" size="lg" className="w-fit" onClick={() => openSlot(unbuiltIndex)}>
        {started ? "Build the next Pokémon" : "Start building"}
      </Button>
    );
  }

  const label =
    count === TEAM_SIZE - 1 ? "Add to the team and start building" : "Add to the team and roll the next";

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" size="lg" className="w-fit" disabled={!ready || !teamsReady} onClick={addPokemon}>
        {label}
      </Button>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {count === 0
            ? "Adds this Pokémon to a team. EVs and Nature wait until the team has 6."
            : `${count} of ${TEAM_SIZE} are on the team. EVs and Nature wait until it is full.`}
        </p>
      )}
    </div>
  );
}
