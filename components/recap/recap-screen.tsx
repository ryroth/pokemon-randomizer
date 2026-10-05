"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PokedexCard } from "@/components/recap/pokedex-card";
import { SaveToTeam } from "@/components/recap/save-to-team";
import { useRandomizerSession } from "@/components/session/session-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { startNextRandomizer } from "@/lib/randomizer/session";
import { buildRecap, type RecapCatalog } from "@/lib/recap/entries";
import { cn } from "@/lib/utils";

export function RecapScreen({ pokemon, abilities, moves, items, natures }: RecapCatalog) {
  const { session, ready } = useRandomizerSession();

  if (!ready) {
    return (
      <RecapFrame>
        <h1 className="text-3xl font-semibold tracking-tight">Pokémon recap</h1>
        <p role="status" className="text-base text-muted-foreground">
          Loading your recap…
        </p>
      </RecapFrame>
    );
  }

  const recap = buildRecap(session, { pokemon, abilities, moves, items, natures });

  return (
    <RecapFrame>
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
        {recap.status === "empty" ? (
          <Link href="/builder" className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
            Back to the builder
          </Link>
        ) : null}
        <NextRandomizerButton />
      </div>
    </RecapFrame>
  );
}

function NextRandomizerButton() {
  const { setSession } = useRandomizerSession();
  const router = useRouter();

  return (
    <Button
      type="button"
      size="lg"
      className="w-fit"
      onClick={() => {
        setSession(startNextRandomizer());
        router.push("/randomizer");
      }}
    >
      Next Randomizer
    </Button>
  );
}

function RecapFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">{children}</div>
  );
}
