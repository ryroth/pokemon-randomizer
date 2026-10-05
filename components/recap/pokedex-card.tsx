"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ModelArtwork } from "@/components/recap/model-artwork";
import { MovePanel } from "@/components/recap/move-panel";
import type { IdleMotion } from "@/components/recap/pokemon-idle-model";
import { StatRadar } from "@/components/recap/stat-radar";
import { TypeBadge } from "@/components/recap/type-badge";
import { Button } from "@/components/ui/button";
import type { RecapEntry } from "@/lib/recap/entries";

const PokemonIdleModel = dynamic(
  () => import("@/components/recap/pokemon-idle-model").then((mod) => mod.PokemonIdleModel),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="text-sm text-white/80">
        Loading the 3D model…
      </p>
    ),
  },
);

export function PokedexCard({ entry }: { entry: RecapEntry }) {
  const animatedUrl = entry.regularModelUrl ?? entry.modelUrl;
  const shinySrc =
    entry.shiny && entry.modelUrl && animatedUrl && entry.modelUrl !== animatedUrl ? entry.modelUrl : null;
  const [artworkOnly, setArtworkOnly] = useState(animatedUrl === null);
  const [motion, setMotion] = useState<IdleMotion | "loading">(animatedUrl ? "loading" : "still");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const stageLabel = artworkOnly
    ? `${entry.shiny ? "Shiny artwork" : "Artwork"} of ${entry.speciesName}`
    : `${entry.shiny ? "Shiny 3D idle animation" : "3D idle animation"} of ${entry.speciesName}`;
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
      <header className="flex items-center gap-2.5 bg-[#e8872f] px-4 py-2.5">
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
                  {animatedUrl && !artworkOnly ? (
                    <PokemonIdleModel
                      key={`${animatedUrl}:${entry.shiny ? "shiny" : "plain"}`}
                      src={animatedUrl}
                      shinySrc={shinySrc}
                      name={entry.speciesName}
                      onUnavailable={() => setArtworkOnly(true)}
                      onMotion={setMotion}
                    />
                  ) : (
                    <ModelArtwork src={entry.imageUrl} name={entry.speciesName} shiny={entry.shiny} />
                  )}
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
              {artworkOnly || motion === "loading" ? null : (
                <p className="text-center text-xs text-[#d6e6ff]">
                  {motion === "playing"
                    ? "Drag to look around. The Pokémon keeps playing its idle animation."
                    : motion === "paused"
                      ? "Drag to look around. The idle animation is paused."
                      : "Drag to look around."}
                </p>
              )}
            </section>

            <div className="space-y-4 rounded-lg bg-[#163f86] p-4">
              <dl className="grid grid-cols-1 gap-y-2.5 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center">
                <dt className="text-[#b7d4ff]">Name</dt>
                <dd className="font-semibold">{displayName}</dd>
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
                  <TypeBadge type={entry.teraType} />
                </dd>
                <dt className="text-[#b7d4ff]">No.</dt>
                <dd className="font-mono font-semibold">{entry.dexNumber}</dd>
                <dt className="text-[#b7d4ff]">Nature</dt>
                <dd className="font-semibold">{entry.natureName}</dd>
                <dt className="text-[#b7d4ff]">Level</dt>
                <dd className="font-semibold tabular-nums">{entry.level}</dd>
                <dt className="text-[#b7d4ff]">Shiny</dt>
                <dd className="font-semibold">{entry.shiny ? "Yes" : "No"}</dd>
                <dt className="text-[#b7d4ff]">Happiness</dt>
                <dd className="font-semibold tabular-nums">{entry.happiness}</dd>
                {entry.gender ? (
                  <>
                    <dt className="text-[#b7d4ff]">Gender</dt>
                    <dd className="font-semibold">{entry.gender === "M" ? "Male" : "Female"}</dd>
                  </>
                ) : null}
              </dl>

              <div className="space-y-1 border-t border-white/15 pt-3">
                <h3 className="text-xs font-medium tracking-wide text-[#b7d4ff] uppercase">Held item</h3>
                <p className="text-lg font-semibold">{entry.itemName ?? "None"}</p>
                {entry.itemDescription ? (
                  <p className="text-sm leading-6 text-[#d6e6ff]">{entry.itemDescription}</p>
                ) : null}
              </div>

              {entry.dexText ? (
                <figure className="space-y-1 border-t border-white/15 pt-3">
                  <figcaption className="text-xs font-medium tracking-wide text-[#b7d4ff] uppercase">
                    Pokédex entry
                  </figcaption>
                  <blockquote className="text-sm leading-6 text-[#e7f1ff]">{entry.dexText}</blockquote>
                </figure>
              ) : (
                <p className="border-t border-white/15 pt-3 text-sm text-[#d6e6ff]">No Pokédex entry is available.</p>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby={`${entry.pokemonId}-moves`} className="space-y-3">
          <SectionTitle id={`${entry.pokemonId}-moves`}>Moves and stats</SectionTitle>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg bg-[#163f86] p-3 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold">Current moves</h3>
              <MovePanel moves={entry.moves} />
            </div>
            <div className="space-y-4 rounded-lg bg-[#163f86] p-3 sm:p-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Stats at level {entry.level}</h3>
                <StatRadar stats={entry.stats} evs={entry.evs} />
              </div>
              <div className="space-y-1 border-t border-white/15 pt-3">
                <h3 className="text-xs font-medium tracking-wide text-[#b7d4ff] uppercase">Ability</h3>
                <p className="text-lg font-semibold">{entry.abilityName}</p>
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
