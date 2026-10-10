"use client";

import { ArrowLeftRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ShowdownDialog } from "@/components/teams/showdown-dialog";
import { TeamAnalysisPanel } from "@/components/teams/team-analysis";
import { useTeamDetails } from "@/components/teams/use-team-details";
import { Button } from "@/components/ui/button";
import type { SavedTeam } from "@/lib/teams/teams";

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-border">
      <summary className="flex min-h-10 cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium outline-none marker:content-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {title}
        <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="border-t border-border p-3">{children}</div>
    </details>
  );
}

/**
 * Showdown sync and team analysis for the active team: a button for the import and export dialog,
 * the type matrices, and the live Showdown text. The details load as soon as the roster changes, so\n * opening a panel never waits and never depends on a toggle event.
 */
export function TeamTools({ team }: { team: SavedTeam }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const details = useTeamDetails(team.sets);

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" aria-haspopup="dialog" onClick={() => setDialogOpen(true)}>
        <ArrowLeftRight aria-hidden="true" />
        Showdown import / export
      </Button>

      <Disclosure title="Type analysis">
        <TeamAnalysisPanel state={details} />
      </Disclosure>

      <Disclosure title="Showdown text">
        {details.status === "loading" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Reading the team…
          </p>
        ) : details.status === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            {details.message}
          </p>
        ) : details.showdownText === "" ? (
          <p className="text-sm text-muted-foreground">Add a Pokémon to see its Showdown text.</p>
        ) : (
          <pre
            tabIndex={0}
            aria-label={`Showdown text for ${team.name}`}
            className="max-h-64 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-5 whitespace-pre-wrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {details.showdownText}
          </pre>
        )}
      </Disclosure>

      <ShowdownDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
