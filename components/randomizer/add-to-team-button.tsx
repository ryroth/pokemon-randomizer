"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nextRollKeepingConfig } from "@/lib/randomizer/session";
import { draftedPokemonFromSession } from "@/lib/teams/draftRoster";
import { allDraftRosters, receivingDraftRoster, TEAM_SIZE } from "@/lib/teams/teams";
import { useRandomizerSession } from "@/components/session/session-provider";
import { useTeams } from "@/components/teams/team-provider";
import { Button } from "@/components/ui/button";

/** Puts the current Pokémon on a draft team, then rolls another with the same settings. */
export function AddToDraftTeam({ ready }: { ready: boolean }) {
  const router = useRouter();
  const { session, setSession } = useRandomizerSession();
  const { box, ready: teamsReady, addDraft } = useTeams();
  const [message, setMessage] = useState<string | null>(null);
  const rosters = allDraftRosters(box);
  const receiving = receivingDraftRoster(box);
  const count = receiving?.slots.length ?? 0;
  const blocked = rosters.find((roster) => roster.id === box.activeDraftRosterId) ?? rosters.at(-1);
  const startsNewTeam = !receiving && rosters.length > 0;

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
    if (added.startedNew) {
      setMessage(`Added to ${added.teamName}. The earlier team is still here to build whenever you want.`);
    } else if (added.full) {
      setMessage(`${added.teamName} has ${TEAM_SIZE} Pokémon. The next one starts a new team. You can build ${added.teamName} in any order.`);
    } else {
      setMessage(null);
    }
    setSession(nextRollKeepingConfig(session));
    router.push("/randomizer");
  }

  const label = startsNewTeam ? "Add to a new team and roll the next" : "Add to the team and roll the next";
  const hint = startsNewTeam
    ? `${blocked?.name ?? "This team"} is full or already being built. This Pokémon starts a new team.`
    : count === 0
      ? "Adds this Pokémon to a team. You can view each one, and build them in any order once the team has 6."
      : `${count} of ${TEAM_SIZE} are on ${receiving?.name ?? "the team"}. You can view them before they are built.`;

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
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
