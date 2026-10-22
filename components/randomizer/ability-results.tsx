"use client";

import { RerollButton } from "@/components/randomizer/reroll-button";
import { ABILITY_GENERATE_STEPS, GenerateButton } from "@/components/randomizer/staged-generate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ability } from "@/lib/types/catalog-entities";
import { cn } from "@/lib/utils";

interface AbilityResultsProps {
  abilities: readonly Ability[];
  selectedAbilityId?: string;
  selectable: boolean;
  canGenerate: boolean;
  canClear: boolean;
  errorMessage: string | null;
  onGenerate: () => void;
  onClear: () => void;
  onSelect: (abilityId: string) => void;
  onReroll: (abilityId: string) => void;
}

export function AbilityResults({
  abilities,
  selectedAbilityId,
  selectable,
  canGenerate,
  canClear,
  errorMessage,
  onGenerate,
  onClear,
  onSelect,
  onReroll,
}: AbilityResultsProps) {
  return (
    <section id="abilities" aria-label="Ability results" className="space-y-4">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}
      {canGenerate ? (
        <GenerateButton label="Generate abilities" steps={ABILITY_GENERATE_STEPS} onGenerate={onGenerate} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {canClear
            ? "These abilities are already set. Re-roll one to replace it, or clear them to generate again."
            : "These abilities are already set. Re-roll one to replace it."}
        </p>
      )}
      {canClear ? (
        <Button type="button" variant="ghost" className="w-fit" onClick={onClear}>
          Clear generated abilities
        </Button>
      ) : null}
      {abilities.length > 0 ? (
        <ul
          aria-label="Generated abilities"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {abilities.map((ability) => {
            const selected = selectable && ability.id === selectedAbilityId;

            return (
              <li key={ability.id}>
                <Card
                  className={cn(
                    "flex h-full flex-col",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {selectable ? (
                    <button
                      type="button"
                      className="flex w-full flex-1 flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-pressed={selected}
                      onClick={() => onSelect(ability.id)}
                    >
                      <AbilityCardBody ability={ability} selected={selected} selectable />
                    </button>
                  ) : (
                    <AbilityCardBody ability={ability} selected={false} selectable={false} />
                  )}
                  <RerollButton name={ability.name} onClick={() => onReroll(ability.id)} />
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function AbilityCardBody({
  ability,
  selected,
  selectable,
}: {
  ability: Ability;
  selected: boolean;
  selectable: boolean;
}) {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h3 className="contents">{ability.name}</h3>
        </CardTitle>
        {selectable ? (
          selected ? (
            <p className="text-sm font-medium text-primary">Selected</p>
          ) : (
            <p className="text-sm text-muted-foreground">Click to select</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">In this pool</p>
        )}
      </CardHeader>
      {ability.description ? (
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{ability.description}</p>
        </CardContent>
      ) : null}
    </>
  );
}
