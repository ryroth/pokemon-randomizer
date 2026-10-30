"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormatLibrary } from "@/components/formats/use-format-library";
import { PageFrame } from "@/components/layout/page-frame";
import { RouteNotice } from "@/components/layout/route-notice";
import { Button, buttonVariants } from "@/components/ui/button";
import { FORMAT_GLOSSARY } from "@/lib/formats/glossary";
import {
  deleteFormat,
  duplicateFormat,
  findFormat,
  listSavedFormats,
  parentDrift,
  renameFormat,
  restorePreviousFormat,
} from "@/lib/formats/library";
import { MODIFIERS, MODIFIER_STATUS_LABELS } from "@/lib/formats/modifiers";
import { listPresets } from "@/lib/formats/presets";
import {
  EXPERIENCE_LABELS,
  SHOWDOWN_FORMATS_URL,
  STRUCTURE_LABELS,
  rulesThisAppChecks,
  type BattleFormat,
} from "@/lib/formats/schema";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FormatExplorer() {
  const { library, ready, commit } = useFormatLibrary();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("gen9ou");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const saved = listSavedFormats(library);
  const formats = useMemo(() => [...listPresets(), ...saved], [saved]);
  const needle = query.trim().toLowerCase();
  const visible = formats.filter((format) => {
    if (!needle) {
      return true;
    }
    const haystack = [
      format.name,
      format.description,
      format.audience,
      EXPERIENCE_LABELS[format.experience],
      STRUCTURE_LABELS[format.structure],
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
  const open = openId ? formats.find((format) => format.id === openId) : undefined;

  if (!ready) {
    return <RouteNotice title="Format Explorer" message="Loading your formats…" live />;
  }

  return (
    <PageFrame className="gap-8">
      <header className="hero-panel max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Rules</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Format Explorer</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Read a format before you use it. Built-in formats are copied from Pokémon Showdown and are
          not changed when you customize one. A custom format is a separate copy.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <section aria-labelledby="format-list-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="format-list-heading" className="text-xl font-medium">
              Formats
            </h2>
            <Link href="/battle?customize=1" className={cn(buttonVariants())}>
              New custom format
            </Link>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            Search formats
            <input
              className={fieldClass}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="OU, doubles, casual…"
            />
          </label>
          {message ? (
            <p role="status" className="text-sm">
              {message}
            </p>
          ) : null}
          {visible.length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">No formats match that search.</p>
          ) : (
            <ul className="space-y-3">
              {visible.map((format) => (
                <li key={format.id}>
                  <article className="space-y-3 rounded-xl border border-border bg-card/90 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">{format.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format.origin === "user" ? "Your format" : format.origin === "app" ? "App preset" : "Showdown preset"}
                          {" · "}
                          Generation {format.generation}
                          {" · "}
                          {STRUCTURE_LABELS[format.structure]}
                          {" · "}
                          {EXPERIENCE_LABELS[format.experience]}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6">{format.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        aria-expanded={openId === format.id}
                        onClick={() => setOpenId(openId === format.id ? null : format.id)}
                      >
                        {openId === format.id ? "Hide details" : "View details"}
                      </Button>
                      <Link
                        href={`/battle?format=${encodeURIComponent(format.id)}&customize=1`}
                        className={cn(buttonVariants({ variant: "outline" }))}
                      >
                        Customize this format
                      </Link>
                      {format.support.damagePreview ? (
                        <Link
                          href={`/battle?format=${encodeURIComponent(format.id)}`}
                          className={cn(buttonVariants())}
                        >
                          {format.structure === "singles" ? "Play singles" : "Damage check"}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {open ? (
            <FormatDetail
              format={open}
              drift={parentDrift(open, library)}
              parentName={open.parentId ? (findFormat(library, open.parentId)?.name ?? null) : null}
              confirmDelete={confirmDeleteId === open.id}
              renaming={renameId === open.id}
              renameValue={renameValue}
              onRenameValue={setRenameValue}
              onStartRename={() => {
                setRenameId(open.id);
                setRenameValue(open.name);
              }}
              onRename={() => {
                const result = renameFormat(library, open.id, renameValue);
                if (!result.ok) {
                  setMessage(result.errors[0]?.message ?? "That format could not be renamed.");
                  return;
                }
                commit(result.library);
                setRenameId(null);
                setMessage(`Renamed to ${result.format.name}.`);
              }}
              onDuplicate={() => {
                const result = duplicateFormat(library, open.id);
                if (!result.ok) {
                  setMessage(result.errors[0]?.message ?? "That format could not be duplicated.");
                  return;
                }
                commit(result.library);
                setOpenId(result.format.id);
                setMessage(`Saved ${result.format.name}.`);
              }}
              onAskDelete={() => setConfirmDeleteId(open.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onDelete={() => {
                commit(deleteFormat(library, open.id));
                setConfirmDeleteId(null);
                setOpenId(null);
                setMessage(`${open.name} was deleted.`);
              }}
              onRestore={() => {
                const result = restorePreviousFormat(library, open.id);
                if (!result.ok) {
                  setMessage(result.errors[0]?.message ?? "There is no earlier save.");
                  return;
                }
                commit(result.library);
                setMessage(`Restored the previous save of ${result.format.name}.`);
              }}
              canRestore={Boolean(library.records.find((record) => record.current.id === open.id)?.previous)}
            />
          ) : (
            <p className="rounded-xl border border-border bg-card/90 p-4 text-sm text-muted-foreground">
              Choose View details on a format to read its rules.
            </p>
          )}
        </aside>
      </div>

      <section aria-labelledby="glossary-heading" className="space-y-3">
        <h2 id="glossary-heading" className="text-xl font-medium">
          Words these cards use
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {FORMAT_GLOSSARY.map((entry) => (
            <div key={entry.term} className="rounded-xl border border-border bg-card/90 p-4">
              <dt className="font-medium">{entry.term}</dt>
              <dd className="mt-1 text-sm leading-6 text-muted-foreground">{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="modifier-heading" className="space-y-3">
        <h2 id="modifier-heading" className="text-xl font-medium">
          What can be changed
        </h2>
        <ul className="space-y-3">
          {MODIFIERS.map((modifier) => (
            <li key={modifier.id} className="rounded-xl border border-border bg-card/90 p-4">
              <p className="font-medium">
                {modifier.name}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {MODIFIER_STATUS_LABELS[modifier.status]}
                </span>
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{modifier.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageFrame>
  );
}

function FormatDetail({
  format,
  parentName,
  drift,
  confirmDelete,
  renaming,
  renameValue,
  onRenameValue,
  onStartRename,
  onRename,
  onDuplicate,
  onAskDelete,
  onCancelDelete,
  onDelete,
  onRestore,
  canRestore,
}: {
  format: BattleFormat;
  parentName: string | null;
  drift: string | null;
  confirmDelete: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameValue: (value: string) => void;
  onStartRename: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onRestore: () => void;
  canRestore: boolean;
}) {
  const parent = parentName;
  return (
    <section aria-labelledby="format-detail-heading" className="space-y-3 rounded-xl border border-border bg-card/90 p-4">
      <h2 id="format-detail-heading" className="text-lg font-medium">
        {format.name}
      </h2>
      <p className="text-sm leading-6">{format.audience}</p>
      {drift ? <p className="text-sm">{drift}</p> : null}
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium">Team</dt>
          <dd>{format.teamSize} Pokémon. {format.levelRule}.</dd>
        </div>
        <div>
          <dt className="font-medium">Shiny</dt>
          <dd>{format.shinyPolicy === "allowed" ? "Allowed. Shiny does not change damage." : "Not allowed."}</dd>
        </div>
        <div>
          <dt className="font-medium">Custom Pokémon</dt>
          <dd>
            {format.typePolicy === "custom" ? "Custom typing is allowed." : "Species typing only."}{" "}
            {format.statPolicy === "custom" ? "Custom base stats are allowed." : "Species base stats only."}
          </dd>
        </div>
        <div>
          <dt className="font-medium">This app checks</dt>
          <dd>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {rulesThisAppChecks(format).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-medium">Clauses from the preset</dt>
          <dd>{format.clauses.join(", ") || "None listed."}</dd>
        </div>
        <div>
          <dt className="font-medium">Banlist, not checked here</dt>
          <dd>{format.banlist.length > 0 ? format.banlist.join(", ") : "No banlist on this format."}</dd>
        </div>
        <div>
          <dt className="font-medium">Battle</dt>
          <dd>
            {format.structure === "doubles"
              ? "Doubles is not played. The damage check still previews one single-target hit."
              : "Two players can play singles on one screen. There is no computer opponent, online play, or replay."}
          </dd>
        </div>
      </dl>
      {format.origin === "simulator" ? (
        <p className="text-sm">
          <a className="underline underline-offset-2" href={SHOWDOWN_FORMATS_URL}>
            Showdown format list
          </a>{" "}
          at the snapshot these words were taken from.
        </p>
      ) : null}
      {parent ? <p className="text-sm text-muted-foreground">Based on {parent}.</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onDuplicate}>
          Duplicate as a custom format
        </Button>
        {format.origin === "user" ? (
          <Button type="button" variant="outline" onClick={onStartRename}>
            Rename
          </Button>
        ) : null}
        {canRestore ? (
          <Button type="button" variant="outline" onClick={onRestore}>
            Restore previous save
          </Button>
        ) : null}
        {format.origin === "user" && !confirmDelete ? (
          <Button type="button" variant="destructive" onClick={onAskDelete}>
            Delete
          </Button>
        ) : null}
      </div>
      {renaming ? (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            onRename();
          }}
        >
          <label className="block space-y-1 text-sm font-medium">
            New name
            <input className={fieldClass} value={renameValue} onChange={(event) => onRenameValue(event.target.value)} />
          </label>
          <Button type="submit">Save name</Button>
        </form>
      ) : null}
      {confirmDelete ? (
        <div className="space-y-2 rounded-lg border border-destructive/40 p-3">
          <p className="text-sm">Delete {format.name}? The built-in presets stay. This cannot be undone.</p>
          <div className="flex gap-2">
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete format
            </Button>
            <Button type="button" variant="outline" onClick={onCancelDelete}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
