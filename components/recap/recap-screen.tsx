"use client";

import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { RouteNotice } from "@/components/layout/route-notice";
import { PokedexCard } from "@/components/recap/pokedex-card";
import { SaveToTeam } from "@/components/recap/save-to-team";
import { NextRandomizerButton } from "@/components/session/next-randomizer-button";
import { useRandomizerSession } from "@/components/session/session-provider";
import { buttonVariants } from "@/components/ui/button";
import { buildRecap, type RecapCatalog } from "@/lib/recap/entries";
import { cn } from "@/lib/utils";

export function RecapScreen({ pokemon, abilities, moves, items, natures }: RecapCatalog) {
  const { session, ready } = useRandomizerSession();

  if (!ready) {
    return <RouteNotice title="Pokémon recap" message="Loading your recap…" live width="wide" />;
  }

  const recap = buildRecap(session, { pokemon, abilities, moves, items, natures });

  return (
    <PageFrame width="wide">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pokémon recap</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Each Pokémon below is a finished set. Copy its text into Pokémon Showdown, or save it onto a team.
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
              <PokedexCard entry={entry} />
            </li>
          ))}
        </ol>
      ) : null}

      {recap.status === "ready" && session.finalizedSet ? (
        <SaveToTeam set={session.finalizedSet} catalog={{ pokemon, abilities, moves, items, natures }} />
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