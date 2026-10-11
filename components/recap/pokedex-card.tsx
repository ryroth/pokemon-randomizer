"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { DexEntryCycler } from "@/components/dex/dex-entry-cycler";
import { ItemIcon } from "@/components/items/item-icon";
import { ModelArtwork } from "@/components/recap/model-artwork";
import { MovePanel } from "@/components/recap/move-panel";
import { StatRadar } from "@/components/recap/stat-radar";
import { TypeBadge } from "@/components/recap/type-badge";
import { Button } from "@/components/ui/button";
import type { RecapEntry } from "@/lib/recap/entries";

/**
 * `editable` turns each part of the Pokémon into a link that opens that part in the builder.
 * Saved team recaps leave it off because they are read-only.
 */
export function PokedexCard({ entry, editable = false }: { entry: RecapEntry; editable?: boolean }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const stageLabel = `${entry.shiny ? "Shiny artwork" : "Artwork"} of ${entry.speciesName}`;
  const displayName = entry.nickname ?? entry.speciesName;

  async function copySet() {
    try {
      await navigator.clipboard.writeText(entry.showdownText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border-4 border-[#f3b15a] bg-[#1a4d98] text-white shadow-lg">
      <header className="flex items-center gap-2.5 bg-[#e8872f] px-4 py-2.5 text-[#2a1608]">
        <PokeBallIcon className="size-5" />
        <p className="text-sm font-bold tracking-wide uppercase">Pokémon status summary</p>
      </header>

      <div className="space-y-5 p-3 sm:p-4">
        <section className="space-y-3">
          <SectionTitle>Summary</SectionTitle>
          <div className="grid gap-3 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
            <section aria-label={stageLabel} className="space-y-2">
              <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-lg bg-[#163f86] sm:h-96">
                <PokeBallWatermark />
                <div className="relative z-10 flex h-full w-full items-center justify-center pb-16">
                  <ModelArtwork src={entry.imageUrl} name={entry.speciesName} shiny={entry.shiny} />
                </div>
                <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 rounded-lg bg-[#0c2f6e]/95 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <PokeBallIcon className="size-7 shrink-0" />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{entry.speciesName}</h2>
                      {entry.genus ? <p className="truncate text-xs text-[#c5dcff]">{entry.genus}</p> : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">Lv. {entry.level}</p>
                    <p className="font-mono text-xs text-[#c5dcff]">No. {entry.dexNumber}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-4 rounded-lg bg-[#163f86] p-4">
              <dl className="grid grid-cols-1 gap-y-2.5 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center">
                <dt className="text-[#b7d4ff]">Name</dt>
                <dd className="font-semibold">
                  <EditLink editable={editable} target="nickname" label="nickname">
                    {displayName}
                  </EditLink>
                </dd>
                <dt className="text-[#b7d4ff]">Type</dt>
                <dd>
                  <ul aria-label="Types" className="flex flex-wrap gap-1.5">
                    {entry.types.map((type) => (
                      <li key={type}>
                        <TypeBadge type={type} />
                      </li>
                    ))}
                  </ul>
                </dd>
                <dt className="text-[#b7d4ff]">Tera type</dt>
                <dd>
                  <EditLink editable={editable} target="tera-type" label="Tera type">
                    <TypeBadge type={entry.teraType} />
                  </EditLink>
                </dd>
                <dt className="text-[#b7d4ff]">No.</dt>
                <dd className="font-mono font-semibold">{entry.dexNumber}</dd>
                <dt className="text-[#b7d4ff]">Nature</dt>
                <dd className="font-semibold">
                  <EditLink editable={editable} target="nature" label="nature">
                    {entry.natureName}
                  </EditLink>
                </dd>
                <dt className="text-[#b7d4ff]">Level</dt>
                <dd className="font-mono font-semibold tabular-nums">
                  <EditLink editable={editable} target="level" label="level">
                    {entry.level}
                  </EditLink>
                </dd>
                <dt className="text-[#b7d4ff]">Shiny</dt>
                <dd className="font-semibold">
                  <EditLink editable={editable} target="shiny" label="shiny">
                    {entry.shiny ? "Yes" : "No"}
                  </EditLink>
                </dd>
                <dt className="text-[#b7d4ff]">Happiness</dt>
                <dd className="font-mono font-semibold tabular-nums">
                  <EditLink editable={editable} target="happiness" label="happiness">
                    {entry.happiness}
                  </EditLink>
                </dd>
                {entry.gender ? (
                  <>
                    <dt className="text-[#b7d4ff]">Gender</dt>
                    <dd className="font-semibold">
                      <EditLink editable={editable} target="gender" label="gender">
                        {entry.gender === "M" ? "Male" : "Female"}
                      </EditLink>
                    </dd>
                  </>
                ) : null}
              </dl>

              <div className="space-y-1 border-t border-white/15 pt-3">
                <h3 className="text-xs font-medium tracking-wide text-[#b7d4ff] uppercase">Held item</h3>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <ItemIcon iconUrl={entry.itemIconUrl} none={!entry.itemName} className="size-8" />
                  <EditLink editable={editable} target="item" label="held item">
                    {entry.itemName ?? "None"}
                  </EditLink>
                </p>
                {entry.itemDescription ? (
                  <p className="text-sm leading-6 text-[#d6e6ff]">{entry.itemDescription}</p>
                ) : null}
              </div>

              <div className="space-y-1 border-t border-white/15 pt-3">
                <h3 className="text-xs font-medium tracking-wide text-[#b7d4ff] uppercase">Pokédex entry</h3>
                {entry.dexText ? (
                  <DexEntryCycler
                    speciesId={entry.speciesId}
                    name={entry.speciesName}
                    fallbackText={entry.dexText}
                    variant="recap"
                  />
                ) : (
                  <p className="text-sm text-[#d6e6ff]">No Pokédex entry is available.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby={`${entry.pokemonId}-moves`} className="space-y-3">
          <SectionTitle id={`${entry.pokemonId}-moves`}>Moves and stats</SectionTitle>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg bg-[#163f86] p-3 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold">Current moves</h3>
              <MovePanel moves={entry.moves} editable={editable} />
            </div>
            <div className="space-y-4 rounded-lg bg-[#163f86] p-3 sm:p-4">
              <div>
                <h3 className="mb-2 flex flex-wrap items-center gap-x-3 text-sm font-semibold">
                  Stats at level {entry.level}
                  <EditLink editable={editable} target="stats" label="EVs, IVs, and nature">
                    Edit stats
                  </EditLink>
                </h3>
                <StatRadar stats={entry.stats} evs={entry.evs} />
              </div>
              <div className="space-y-1 border-t border-white/15 pt-3">
                <h3 className="text-xs font-medium tracking-wide text-[#b7d4ff] uppercase">Ability</h3>
                <p className="text-lg font-semibold">
                  <EditLink editable={editable} target="ability" label="ability">
                    {entry.abilityName}
                  </EditLink>
                </p>
                {entry.abilityDescription ? (
                  <p className="text-sm leading-6 text-[#d6e6ff]">{entry.abilityDescription}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby={`${entry.pokemonId}-showdown`} className="space-y-3 rounded-lg bg-[#163f86] p-3 sm:p-4">
          <h3 id={`${entry.pokemonId}-showdown`} className="text-sm font-semibold">
            Showdown set
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" size="lg" onClick={() => void copySet()}>
              Copy to Showdown
            </Button>
            {copyState === "copied" ? (
              <p role="status" className="text-sm">
                Copied. Paste it into a Pokémon Showdown teambuilder.
              </p>
            ) : null}
            {copyState === "failed" ? (
              <p role="status" className="text-sm">
                The browser blocked copying. Select the set text and copy it.
              </p>
            ) : null}
          </div>
          <pre
            aria-label="Showdown set text"
            className="overflow-x-auto rounded-lg bg-[#0e326e] p-4 font-mono text-sm leading-6 whitespace-pre-wrap text-[#e8f1ff]"
          >
            {entry.showdownText}
          </pre>
        </section>
      </div>
    </article>
  );
}

/** Wraps one part of the Pokémon in a link to its place in the builder, when the recap is editable. */
function EditLink({
  editable,
  target,
  label,
  children,
}: {
  editable: boolean;
  target: string;
  label: string;
  children: ReactNode;
}) {
  if (!editable) {
    return <>{children}</>;
  }
  return (
    <Link
      href={`/builder#${target}`}
      aria-label={`Edit ${label}`}
      className="inline-flex items-center gap-1.5 rounded-md underline decoration-dotted underline-offset-4 outline-none hover:text-[#f2c14e] focus-visible:ring-2 focus-visible:ring-[#f2c14e]"
    >
      {children}
      <Pencil aria-hidden="true" className="size-3.5 shrink-0 text-[#f2c14e]" />
    </Link>
  );
}

function SectionTitle({ id, children }: { id?: string; children: string }) {
  return (
    <h3 id={id} className="flex items-center gap-2 text-sm font-semibold">
      <span aria-hidden="true" className="h-4 w-1 rounded-full bg-[#f2c14e]" />
      {children}
    </h3>
  );
}

function PokeBallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="#fff" stroke="#1a1a1a" strokeWidth="1.4" />
      <path d="M3.1 12a8.9 8.9 0 0 1 17.8 0Z" fill="#e23d3d" />
      <path d="M3.1 12h5.2M15.7 12h5.2" stroke="#1a1a1a" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.1" fill="#fff" stroke="#1a1a1a" strokeWidth="1.4" />
    </svg>
  );
}

function PokeBallWatermark() {
  return (
    <svg viewBox="0 0 200 200" className="pointer-events-none absolute size-72 text-white/25" aria-hidden="true">
      <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="12" />
      <path d="M22 100h46M132 100h46" stroke="currentColor" strokeWidth="12" />
      <circle cx="100" cy="100" r="22" fill="#163f86" stroke="currentColor" strokeWidth="10" />
    </svg>
  );
}
