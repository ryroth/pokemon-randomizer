"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TYPE_LABELS } from "@/lib/types/pokemon-type";
import type { PokemonForm } from "@/lib/types/pokemon";
import { EVOLUTION_STAGE_LABELS, FORM_TYPE_LABELS } from "@/lib/types/taxonomy";
import { cn } from "@/lib/utils";

interface PokemonEvolutionPickerProps {
  selected: PokemonForm;
  options: readonly PokemonForm[];
  battlePokemonId: string;
  onChoose: (pokemonId: string) => void;
}

export function PokemonEvolutionPicker({
  selected,
  options,
  battlePokemonId,
  onChoose,
}: PokemonEvolutionPickerProps) {
  const choices = [selected, ...options];

  return (
    <section
      id="evolution"
      aria-labelledby="evolution-heading"
      className="scroll-mt-24 space-y-4"
    >
      <div className="space-y-1">
        <h2 id="evolution-heading" className="text-2xl font-semibold tracking-tight">
          Evolution
        </h2>
        {options.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {selected.displayName} can evolve. Choose the stage you want to use in battle. Ability,
            move, and item randomizers will use this Pokémon.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {selected.displayName} does not evolve further. You will use it as-is when you build the
            set.
          </p>
        )}
      </div>
      {options.length > 0 ? (
        <ul aria-label="Evolution choices" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {choices.map((form) => {
            const chosen = form.id === battlePokemonId;
            const isKeep = form.id === selected.id;
            const imageSrc = form.sprites.artwork ?? form.sprites.sprite;

            return (
              <li key={form.id}>
                <Card
                  className={cn(
                    "h-full",
                    chosen && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  <button
                    type="button"
                    className="flex h-full w-full flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-pressed={chosen}
                    onClick={() => onChoose(form.id)}
                  >
                    <CardHeader>
                      <div className="relative mx-auto aspect-square w-full max-w-[140px]">
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt=""
                            fill
                            sizes="140px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-2xl text-muted-foreground">
                            {form.displayName.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {EVOLUTION_STAGE_LABELS[form.evolutionStage]}
                        {form.formType !== "base"
                          ? ` · ${FORM_TYPE_LABELS[form.formType]}`
                          : null}
                      </p>
                      <CardTitle>
                        <h3 className="contents">{form.displayName}</h3>
                      </CardTitle>
                      {chosen ? (
                        <p className="text-sm font-medium text-primary">
                          {isKeep ? "Keeping this Pokémon" : "Using this evolution"}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {isKeep ? "Keep this Pokémon" : `Evolve to ${form.displayName}`}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="flex flex-wrap gap-1.5">
                        {form.types.map((type) => (
                          <span
                            key={type}
                            className="rounded-full border border-border px-2 py-0.5 text-xs"
                          >
                            {TYPE_LABELS[type]}
                          </span>
                        ))}
                      </p>
                    </CardContent>
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
