"use client";

import { Fragment, useRef, type ReactNode } from "react";
import { Volume2 } from "lucide-react";
import { BodyShapeIcon } from "@/components/randomizer/body-shape-icon";
import { Button } from "@/components/ui/button";
import { formCry } from "@/lib/data/cries";
import { speciesGenus } from "@/lib/data/genera";
import { formatHeight, formatHeightBoth, formatWeight, formatWeightBoth } from "@/lib/data/measurement";
import { showsCardFact } from "@/lib/randomizer/cardFacts";
import type { CardFact } from "@/lib/types/card-facts";
import type { PokemonForm } from "@/lib/types/pokemon";
import { POKEDEX_COLOR_LABELS, type MeasurementSystem } from "@/lib/types/taxonomy";

const COLOR_SWATCHES: Record<string, string> = {
  black: "#2a2a2a",
  blue: "#4c6cb3",
  brown: "#8b5a2b",
  gray: "#8d8d8d",
  green: "#4e8234",
  pink: "#e38ea3",
  purple: "#6b4c9a",
  red: "#c23b3b",
  white: "#f7f7f7",
  yellow: "#f2d15a",
};

export function PokemonFacts({
  form,
  measurementSystem,
  facts,
  cryName,
  showBothMeasurements = false,
}: {
  form: PokemonForm;
  measurementSystem: MeasurementSystem;
  facts: readonly CardFact[];
  /** Spoken name for the cry button. "this Pokémon" when the card is hiding the real name. */
  cryName: string;
  /** Usual card shows meters and feet, and kilograms and pounds. A guessing clue uses one system. */
  showBothMeasurements?: boolean;
}) {
  const species = speciesGenus(form.speciesId);
  const cry = formCry(form.id);
  const rows: { term: string; detail: ReactNode }[] = [];

  if (showsCardFact(facts, "species")) {
    rows.push({ term: "Species", detail: species ?? "Unknown" });
  }
  if (showsCardFact(facts, "height")) {
    rows.push({
      term: "Height",
      detail:
        form.heightM === null
          ? "Unknown"
          : showBothMeasurements
            ? formatHeightBoth(form.heightM)
            : formatHeight(form.heightM, measurementSystem),
    });
  }
  if (showsCardFact(facts, "weight")) {
    rows.push({
      term: "Weight",
      detail:
        form.weightKg === null
          ? "Unknown"
          : showBothMeasurements
            ? formatWeightBoth(form.weightKg)
            : formatWeight(form.weightKg, measurementSystem),
    });
  }
  if (showsCardFact(facts, "color")) {
    rows.push({
      term: "Color",
      detail: (
        <span className="flex items-center gap-2">
          {form.pokedexColor ? (
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full border border-foreground/25"
              style={{ backgroundColor: COLOR_SWATCHES[form.pokedexColor] }}
            />
          ) : null}
          {form.pokedexColor ? POKEDEX_COLOR_LABELS[form.pokedexColor] : "Unknown"}
        </span>
      ),
    });
  }
  if (showsCardFact(facts, "bodyShape")) {
    rows.push({
      term: "Body shape",
      detail: form.shape ? <BodyShapeIcon shape={form.shape} /> : "Unknown",
    });
  }
  if (showsCardFact(facts, "eggGroup")) {
    rows.push({
      term: "Egg group",
      detail: form.eggGroups.length > 0 ? form.eggGroups.join(", ") : "None listed",
    });
  }

  const showCry = showsCardFact(facts, "cry");
  if (rows.length === 0 && !showCry) {
    return null;
  }

  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        <dl className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
          {rows.map((row) => (
            <Fragment key={row.term}>
              <dt className="text-muted-foreground">{row.term}</dt>
              <dd>{row.detail}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}
      {showCry ? <CryButton name={cryName} src={cry} /> : null}
    </div>
  );
}

function CryButton({ name, src }: { name: string; src: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!src) {
    return <p className="text-sm text-muted-foreground">No cry on file.</p>;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Play ${name}'s cry`}
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) {
            return;
          }
          document.querySelectorAll("audio").forEach((other) => {
            if (other !== audio) {
              other.pause();
            }
          });
          audio.currentTime = 0;
          void audio.play();
        }}
      >
        <Volume2 aria-hidden="true" />
        Play cry
      </Button>
      <audio ref={audioRef} src={src} preload="none" />
    </>
  );
}
