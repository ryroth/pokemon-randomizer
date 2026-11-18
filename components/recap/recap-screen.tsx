"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { RouteNotice } from "@/components/layout/route-notice";
import { PokedexCard } from "@/components/recap/pokedex-card";
import { SaveToTeam } from "@/components/recap/save-to-team";
import { NextRandomizerButton } from "@/components/session/next-randomizer-button";
import { useRandomizerSession } from "@/components/session/session-provider";
import { useTeams } from "@/components/teams/team-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { DraftSlotDetails } from "@/components/teams/draft-slot-details";
import { openDraftInBuilder } from "@/lib/builder";
import { recapEditAccess } from "@/lib/builder/locks";
import { buildRecap, type RecapCatalog } from "@/lib/recap/entries";
import { previewDraftSlot } from "@/lib/teams/draftPreview";
import { allDraftRosters } from "@/lib/teams/teams";
import { cn } from "@/lib/utils";

export function RecapScreen({ pokemon, abilities, moves, items, natures }: RecapCatalog) {
  const router = useRouter();
  const { session, setSession, ready } = useRandomizerSession();
  const { box } = useTeams();

  if (!ready) {
    return <RouteNotice title="Pokémon Recap" message="Loading your recap…" live width="wide" />;
  }

  const recap = buildRecap(session, { pokemon, abilities, moves, items, natures });
  const catalog = { pokemon, abilities, moves, items, natures };
  const building = session.buildingDraft;
  const roster = building ? allDraftRosters(box).find((candidate) => candidate.id === building.rosterId) : undefined;
  const unbuilt = roster
    ? roster.slots.flatMap((slot, index) => (slot.status === "draft" ? [{ slot, index }] : []))
    : [];
  const finishedTeam = building
    ? box.teams.find((team) => team.id === building.rosterId)
    : undefined;

  return (
    <PageFrame width="wide">
      <header className="hero-panel max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pokémon Recap</h1>
        <p className="text-base leading-7 text-muted-foreground">
          {building
            ? "This Pokémon is on the team. Select any part of it, such as a move, the ability, or the nickname, to change it in the builder."
            : "Each Pokémon below is a finished set. Select any part of it, such as a move, the ability, or the nickname, to change it in the builder. Copy its text into Pokémon Showdown, or save it onto a team."}
        </p>
      </header>

      {recap.status === "invalid" ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-sm leading-6">{recap.message}</p>
      ) : null}

      {recap.status === "empty" ? (
        <p className="text-base leading-7 text-muted-foreground">
          Finish a set in the builder to open its Pokédex recap.
        </p>
      ) : null}

      {recap.status === "ready" ? (
        <ol aria-label="Pokémon to copy to Showdown" className="flex flex-col gap-8">
          {recap.entries.map((entry) => (
            <li key={entry.pokemonId}>
              <PokedexCard entry={entry} edit={recapEditAccess(session)} />
            </li>
          ))}
        </ol>
      ) : null}

      {recap.status === "ready" && session.finalizedSet && !building ? (
        <SaveToTeam set={session.finalizedSet} catalog={{ pokemon, abilities, moves, items, natures }} />
      ) : null}

      {building && unbuilt.length > 0 ? (
        <section aria-label="Pokémon still to build" className="space-y-3">
          <h2 className="text-lg font-semibold">Still to build</h2>
          <p className="text-sm text-muted-foreground">
            Build any of these next. Each one shows the parts already chosen and its base stats.
          </p>
          <ul className="flex flex-col gap-3">
            {unbuilt.map(({ slot, index }) => {
              const preview = previewDraftSlot(slot.pokemon, catalog);
              const name = preview?.displayName ?? "Pokémon";
              return (
                <li key={index} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">
                      Slot {index + 1}. {name}
                    </h3>
                    <Button
                      type="button"
                      onClick={() => {
                        setSession(openDraftInBuilder(session, building.rosterId, slot.pokemon, index));
                        router.push("/builder");
                      }}
                    >
                      Build {name}
                    </Button>
                  </div>
                  {preview ? <DraftSlotDetails preview={preview} /> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {building && unbuilt.length === 0 && finishedTeam ? (
        <p className="text-base leading-7">
          {finishedTeam.name} is ready.{" "}
          <Link href="/teams" className="font-medium text-primary underline-offset-4 hover:underline">
            Open the team
          </Link>{" "}
          to copy it to Showdown.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/builder"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-fit")}
        >
          Back to the builder
        </Link>
        <NextRandomizerButton />
      </div>
    </PageFrame>
  );
}