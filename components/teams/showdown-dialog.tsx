"use client";

import { Check, Copy, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTeams } from "@/components/teams/team-provider";
import { useTeamDetails } from "@/components/teams/use-team-details";
import { Button } from "@/components/ui/button";
import { readShowdownPaste } from "@/lib/data/teamTools";
import type { ImportedSetResult } from "@/lib/showdown/importTeam";
import { MAX_IMPORT_CHARS } from "@/lib/showdown/parseSet";
import { TEAM_SIZE } from "@/lib/teams/teams";
import { cn } from "@/lib/utils";

/**
 * Two-way Pokémon Showdown sync for the active team, in a native modal dialog. The export side is
 * live: it re-reads the roster whenever the team changes. The import side reads a paste, shows
 * what is ready and what needs fixing, and only saves when the player confirms.
 */
export function ShowdownDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      // The body mounts with the dialog still closed, so React's autoFocus cannot take focus.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          dialogRef.current?.close();
        }
      }}
      className={cn(
        "fixed m-auto max-h-[90dvh] w-[min(56rem,calc(100%-2rem))] max-w-none flex-col overflow-hidden rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/60 open:flex",
        "max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:m-0 max-sm:w-full max-sm:rounded-b-none",
        "open:animate-in open:fade-in max-sm:open:slide-in-from-bottom",
      )}
    >
      {open ? <DialogBody headingId={headingId} onClose={() => dialogRef.current?.close()} /> : null}
    </dialog>
  );
}

const textAreaClass =
  "min-h-48 w-full resize-y rounded-lg border border-input bg-background p-3 font-mono text-xs leading-5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function DialogBody({ headingId, onClose }: { headingId: string; onClose: () => void }) {
  const { box, importSets } = useTeams();
  const active = box.teams.find((team) => team.id === box.activeTeamId) ?? null;
  const details = useTeamDetails(active?.sets ?? []);

  const [pasteText, setPasteText] = useState("");
  const [reading, setReading] = useState(false);
  const [results, setResults] = useState<ImportedSetResult[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const ready = results?.flatMap((result) => (result.ok ? [result.set] : [])) ?? [];
  const open = active ? TEAM_SIZE - active.sets.length : 0;

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Copied. Paste it into a Pokémon Showdown teambuilder.");
    } catch {
      setCopyMessage("The browser blocked copying. Click the text, select it, and copy it yourself.");
    }
  }

  async function readPaste() {
    setReading(true);
    setMessage(null);
    setProblem(null);
    setResults(null);
    try {
      const preview = await readShowdownPaste(pasteText);
      if (preview.ok) {
        setResults(preview.results);
      } else {
        setProblem(preview.message);
      }
    } catch {
      setProblem("The paste could not be read. Try again in a moment.");
    } finally {
      setReading(false);
    }
  }

  function addReady(target: "active" | "new") {
    const outcome = importSets(ready, target);
    if (!outcome.ok) {
      setProblem(outcome.message);
      return;
    }
    setProblem(null);
    setResults(null);
    setPasteText("");
    setMessage(`Added ${outcome.added} Pokémon to ${outcome.teamName}.`);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id={headingId} className="text-lg font-semibold">
          Pokémon Showdown import and export
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-4 md:grid-cols-2">
        <section aria-labelledby={`${headingId}-export`} className="space-y-3">
          <h3 id={`${headingId}-export`} className="text-base font-semibold">
            Export {active ? active.name : "team"}
          </h3>
          {!active ? (
            <p className="text-sm text-muted-foreground">Save a Pokémon to a team first, then it shows up here.</p>
          ) : details.status === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Reading the team…
            </p>
          ) : details.status === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {details.message}
            </p>
          ) : details.showdownText === "" ? (
            <p className="text-sm text-muted-foreground">{active.name} has no Pokémon yet.</p>
          ) : (
            <>
              <label className="block space-y-1.5 text-sm font-medium">
                Showdown text for {active.name}
                <textarea
                  readOnly
                  className={textAreaClass}
                  value={details.showdownText}
                  rows={14}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                This updates as the team changes. In Showdown, open the Teambuilder, choose Import from text, and paste.
              </p>
              <Button type="button" onClick={() => void copyText(details.showdownText)}>
                <Copy aria-hidden="true" />
                Copy team text
              </Button>
              <p role="status" aria-live="polite" className="min-h-5 text-sm">
                {copyMessage}
              </p>
            </>
          )}
        </section>

        <section aria-labelledby={`${headingId}-import`} className="space-y-3">
          <h3 id={`${headingId}-import`} className="text-base font-semibold">
            Import a team
          </h3>
          <label className="block space-y-1.5 text-sm font-medium">
            Paste Pokémon Showdown text
            <textarea
              data-autofocus
              className={textAreaClass}
              value={pasteText}
              rows={10}
              maxLength={MAX_IMPORT_CHARS}
              spellCheck={false}
              aria-describedby={`${headingId}-import-help`}
              onChange={(event) => {
                setPasteText(event.target.value);
                setResults(null);
                setProblem(null);
                setMessage(null);
              }}
            />
          </label>
          <p id={`${headingId}-import-help`} className="text-xs leading-5 text-muted-foreground">
            Up to {TEAM_SIZE} Pokémon, separated by a blank line. Each needs an Ability, a Nature, a Tera Type, and
            four moves. Species with both genders need (M) or (F). The app never fills these in for you.
          </p>
          <Button
            type="button"
            variant="outline"
            aria-busy={reading}
            aria-disabled={reading || pasteText.trim().length === 0}
            onClick={() => {
              if (!reading && pasteText.trim().length > 0) {
                void readPaste();
              }
            }}
          >
            {reading ? "Reading…" : "Read paste"}
          </Button>

          {problem ? (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
              {problem}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
              {message}
            </p>
          ) : null}

          {results ? (
            <div className="space-y-3">
              <p role="status" className="text-sm font-medium">
                <span className="font-mono tabular-nums">{ready.length}</span> of{" "}
                <span className="font-mono tabular-nums">{results.length}</span>{" "}
                {results.length === 1 ? "Pokémon is" : "Pokémon are"} ready.
              </p>
              <ul aria-label="Pasted Pokémon" className="space-y-2">
                {results.map((result) => (
                  <li key={result.position} className="rounded-lg border border-border p-2.5 text-sm">
                    {result.ok ? (
                      <p className="flex items-center gap-2 font-medium">
                        <Check aria-hidden="true" className="size-4 shrink-0" />
                        {result.label}
                        <span className="font-normal text-muted-foreground">Ready</span>
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 font-medium">
                          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                          {result.label}
                          <span className="font-normal text-muted-foreground">Needs changes</span>
                        </p>
                        <ul className="list-disc space-y-0.5 pl-9 text-muted-foreground">
                          {result.problems.map((text) => (
                            <li key={text}>{text}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={ready.length === 0 || !active || ready.length > open}
                  onClick={() => addReady("active")}
                >
                  {active ? `Add ${ready.length} to ${active.name}` : "Add to team"}
                </Button>
                <Button type="button" variant="outline" disabled={ready.length === 0} onClick={() => addReady("new")}>
                  Save {ready.length} as a new team
                </Button>
              </div>
              {active && ready.length > open ? (
                <p className="text-xs text-muted-foreground">
                  {active.name} has {open} open {open === 1 ? "slot" : "slots"}. Save these as a new team instead.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
