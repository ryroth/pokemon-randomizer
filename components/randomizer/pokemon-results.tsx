"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RerollButton } from "@/components/randomizer/reroll-button";
import { MOVES_ASSIGNED_PER_POKEMON, requiredMovesPerPokemon } from "@/lib/randomizer/applyExtras";
import { NONE_ITEM_ID, NONE_ITEM_SELECT_VALUE } from "@/lib/randomizer/items";
import { filledMoveCount } from "@/lib/randomizer/session";
import type { Ability, Item, Move } from "@/lib/types/catalog-entities";
import { TYPE_LABELS } from "@/lib/types/pokemon-type";
import type { PokemonForm } from "@/lib/types/pokemon";
import { FORM_TYPE_LABELS } from "@/lib/types/taxonomy";
import { cn } from "@/lib/utils";

interface PokemonResultsProps {
  pokemon: readonly PokemonForm[];
  selectedPokemonId?: string;
  appliedAbilityIds?: Readonly<Record<string, string | undefined>>;
  abilityChoicesByPokemon?: Readonly<Record<string, readonly Ability[]>>;
  unusedAbilities?: readonly Ability[];
  appliedMoveIds?: Readonly<Record<string, Array<string | undefined>>>;
  moveChoicesByPokemonSlot?: Readonly<Record<string, Array<readonly Move[]>>>;
  unusedMoves?: readonly Move[];
  appliedItemIds?: Readonly<Record<string, string | null | undefined>>;
  itemChoicesByPokemon?: Readonly<Record<string, readonly Item[]>>;
  unusedItems?: readonly Item[];
  movesPerPokemon?: number;
  showPokedexEntry: boolean;
  generationNumber: number;
  generationCount: number;
  onSelect: (pokemonId: string) => void;
  onApplyAbility?: (pokemonId: string, abilityId: string | undefined) => void;
  onApplyMove?: (pokemonId: string, slotIndex: number, moveId: string | undefined) => void;
  onApplyItem?: (pokemonId: string, itemId: string | null | undefined) => void;
  onPrevious: () => void;
  onNext: () => void;
  onReroll: (pokemonId: string) => void;
}

export function PokemonResults({
  pokemon,
  selectedPokemonId,
  appliedAbilityIds,
  abilityChoicesByPokemon,
  unusedAbilities,
  appliedMoveIds,
  moveChoicesByPokemonSlot,
  unusedMoves,
  appliedItemIds,
  itemChoicesByPokemon,
  unusedItems,
  movesPerPokemon = MOVES_ASSIGNED_PER_POKEMON,
  showPokedexEntry,
  generationNumber,
  generationCount,
  onSelect,
  onApplyAbility,
  onApplyMove,
  onApplyItem,
  onPrevious,
  onNext,
  onReroll,
}: PokemonResultsProps) {
  if (pokemon.length === 0 || generationCount === 0) {
    return null;
  }

  const isCurrent = generationNumber === generationCount;
  const canGoBack = generationNumber > 1;
  const canGoForward = generationNumber < generationCount;
  const heading = isCurrent
    ? `Current generation · ${pokemon.length} Pokémon`
    : `Generation ${generationNumber} of ${generationCount} · ${pokemon.length} Pokémon`;
  const applySlotCount = requiredMovesPerPokemon(movesPerPokemon);
  const remainingBuilderSlots = MOVES_ASSIGNED_PER_POKEMON - applySlotCount;
  const assignMode = Boolean(onApplyAbility) || Boolean(onApplyMove) || Boolean(onApplyItem);
  const applyHelp = describeApplyHelp(
    Boolean(onApplyAbility),
    Boolean(onApplyMove),
    Boolean(onApplyItem),
    applySlotCount,
    remainingBuilderSlots,
  );

  return (
    <section
      id="generated-pokemon"
      aria-labelledby="results-heading"
      className="scroll-mt-24 space-y-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 id="results-heading" className="text-2xl font-semibold tracking-tight">
            Generated Pokémon
          </h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {heading}. Use Previous and Next to move through earlier generations.
            {applyHelp ? ` ${applyHelp}` : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!canGoBack}
            aria-label="Previous generated Pokémon"
            onClick={onPrevious}
          >
            <ChevronLeft />
            Previous
          </Button>
          <p aria-live="polite" className="min-w-28 text-center text-sm font-medium">
            {generationNumber} of {generationCount}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={!canGoForward}
            aria-label="Next generated Pokémon"
            onClick={onNext}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      </div>
      {assignMode && unusedAbilities && unusedAbilities.length > 0 ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Unused abilities: {unusedAbilities.map((ability) => ability.name).join(", ")}.
        </p>
      ) : null}
      {assignMode && unusedMoves && unusedMoves.length > 0 ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Unused moves: {unusedMoves.map((move) => move.name).join(", ")}.
        </p>
      ) : null}
      {assignMode && unusedItems && unusedItems.length > 0 ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Unused items: {unusedItems.map((item) => item.name).join(", ")}.
        </p>
      ) : null}
      <ul
        aria-label={isCurrent ? "Current generation" : `Generation ${generationNumber}`}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {pokemon.map((form) => {
          const selected = form.id === selectedPokemonId;
          const dexText = form.dexEntries[0]?.text;
          const imageSrc = form.sprites.artwork ?? form.sprites.sprite;
          const appliedAbilityId = appliedAbilityIds?.[form.id];
          const appliedAbility = abilityChoicesByPokemon?.[form.id]?.find(
            (ability) => ability.id === appliedAbilityId,
          );
          const appliedMoves = appliedMoveIds?.[form.id] ?? [];
          const appliedMoveCount = filledMoveCount(appliedMoves);
          const appliedItemId = appliedItemIds?.[form.id];
          const appliedItem =
            appliedItemId === NONE_ITEM_ID
              ? undefined
              : itemChoicesByPokemon?.[form.id]?.find((item) => item.id === appliedItemId);
          const abilityReady = !onApplyAbility || Boolean(appliedAbilityId);
          const movesReady = !onApplyMove || appliedMoveCount >= applySlotCount;
          const itemReady = !onApplyItem || appliedItemId !== undefined;
          const canSelect = abilityReady && movesReady && itemReady;
          const choices = abilityChoicesByPokemon?.[form.id] ?? [];
          const moveSlotChoices = moveChoicesByPokemonSlot?.[form.id] ?? [];
          const itemChoices = itemChoicesByPokemon?.[form.id] ?? [];

          return (
            <li key={form.id}>
              <Card
                className={cn(
                  "flex h-full flex-col",
                  selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <button
                  type="button"
                  className="flex w-full flex-1 flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-pressed={selected}
                  disabled={!canSelect}
                  onClick={() => onSelect(form.id)}
                >
                  <CardHeader>
                    <div className="relative mx-auto aspect-square w-full max-w-[180px]">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          sizes="180px"
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-2xl text-muted-foreground">
                          {form.displayName.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      #{String(form.nationalDexNumber).padStart(4, "0")} · Gen {form.generation}
                    </p>
                    <CardTitle>
                      <h3 className="contents">{form.displayName}</h3>
                    </CardTitle>
                    {selected ? (
                      <p className="text-sm font-medium text-primary">Selected</p>
                    ) : canSelect ? (
                      <p className="text-sm text-muted-foreground">Click to select</p>
                    ) : !abilityReady ? (
                      <p className="text-sm text-muted-foreground">Apply an ability first</p>
                    ) : !movesReady ? (
                      <p className="text-sm text-muted-foreground">
                        {selectMovesBlockedLabel(applySlotCount)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Apply an item first</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="flex flex-wrap gap-1.5">
                      {form.types.map((type) => (
                        <span
                          key={type}
                          className="rounded-full border border-border px-2 py-0.5 text-xs"
                        >
                          {TYPE_LABELS[type]}
                        </span>
                      ))}
                      {form.formType !== "base" ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          {FORM_TYPE_LABELS[form.formType]}
                        </span>
                      ) : null}
                      {appliedAbility ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          {appliedAbility.name}
                        </span>
                      ) : null}
                      {appliedItemId === NONE_ITEM_ID ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          None
                        </span>
                      ) : appliedItem ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          {appliedItem.name}
                        </span>
                      ) : null}
                      {appliedMoves
                        .flatMap((moveId) => {
                          const move = moveSlotChoices
                            .flat()
                            .find((option) => option.id === moveId);
                          return move ? [move] : [];
                        })
                        .map((move) => (
                          <span
                            key={move.id}
                            className="rounded-full border border-border px-2 py-0.5 text-xs"
                          >
                            {move.name}
                          </span>
                        ))}
                    </p>
                    {showPokedexEntry && dexText ? (
                      <p className="text-sm leading-6 text-muted-foreground">{dexText}</p>
                    ) : null}
                  </CardContent>
                </button>
                {onApplyAbility ? (
                  <div className="border-t border-border px-6 py-4">
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium">Ability for {form.displayName}</span>
                      <select
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={appliedAbilityId ?? ""}
                        aria-label={`Ability for ${form.displayName}`}
                        onChange={(event) => {
                          const next = event.target.value;
                          onApplyAbility(form.id, next === "" ? undefined : next);
                        }}
                      >
                        <option value="">Choose an ability</option>
                        {choices.map((ability) => (
                          <option key={ability.id} value={ability.id}>
                            {ability.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
                {onApplyItem ? (
                  <div className="border-t border-border px-6 py-4">
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium">Item for {form.displayName}</span>
                      <select
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={
                          appliedItemId === NONE_ITEM_ID
                            ? NONE_ITEM_SELECT_VALUE
                            : (appliedItemId ?? "")
                        }
                        aria-label={`Item for ${form.displayName}`}
                        onChange={(event) => {
                          const next = event.target.value;
                          if (next === "") {
                            onApplyItem(form.id, undefined);
                            return;
                          }
                          if (next === NONE_ITEM_SELECT_VALUE) {
                            onApplyItem(form.id, NONE_ITEM_ID);
                            return;
                          }
                          onApplyItem(form.id, next);
                        }}
                      >
                        <option value="">Choose an item</option>
                        <option value={NONE_ITEM_SELECT_VALUE}>None</option>
                        {itemChoices.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
                {onApplyMove ? (
                  <div className="space-y-3 border-t border-border px-6 py-4">
                    <p className="text-sm font-medium">Moves for {form.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {applyMoveSlotsHelp(applySlotCount, remainingBuilderSlots)}
                    </p>
                    {Array.from({ length: applySlotCount }, (_, slotIndex) => {
                      const slotChoices = moveSlotChoices[slotIndex] ?? [];
                      const appliedMoveId = appliedMoves[slotIndex];
                      return (
                        <label key={slotIndex} className="block space-y-1 text-sm">
                          <span className="font-medium">
                            Move {slotIndex + 1} for {form.displayName}
                          </span>
                          <select
                            className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            value={appliedMoveId ?? ""}
                            aria-label={`Move ${slotIndex + 1} for ${form.displayName}`}
                            onChange={(event) => {
                              const next = event.target.value;
                              onApplyMove(form.id, slotIndex, next === "" ? undefined : next);
                            }}
                          >
                            <option value="">Choose a move</option>
                            {slotChoices.map((move) => (
                              <option key={move.id} value={move.id}>
                                {move.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
                <RerollButton name={form.displayName} onClick={() => onReroll(form.id)} />
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function describeApplyHelp(
  abilityAssign: boolean,
  moveAssign: boolean,
  itemAssign: boolean,
  applySlotCount: number,
  remainingBuilderSlots: number,
): string | null {
  const parts: string[] = [];
  if (abilityAssign) {
    parts.push("an ability");
  }
  if (itemAssign) {
    parts.push("an item");
  }
  if (moveAssign) {
    parts.push(moveCountPhrase(applySlotCount));
  }
  if (parts.length === 0) {
    return null;
  }
  if (parts.length === 1) {
    return `Apply ${parts[0]} to a Pokémon, then select that Pokémon.${moveAssign ? remainingSlotsSentence(remainingBuilderSlots) : ""}`;
  }
  if (parts.length === 2) {
    return `Apply ${parts[0]} to a Pokémon, then apply ${parts[1]} and select that Pokémon.${moveAssign ? remainingSlotsSentence(remainingBuilderSlots) : ""}`;
  }
  return `Apply ${parts[0]} to a Pokémon, then apply ${parts[1]} and ${parts[2]}, and select that Pokémon.${remainingSlotsSentence(remainingBuilderSlots)}`;
}

function applyMoveSlotsHelp(applySlotCount: number, remainingBuilderSlots: number): string {
  return `Apply ${moveCountPhrase(applySlotCount)}.${remainingSlotsSentence(remainingBuilderSlots)}`;
}

function selectMovesBlockedLabel(applySlotCount: number): string {
  if (applySlotCount === 4) {
    return "Apply a full moveset first";
  }
  return `Apply ${applySlotCount} ${applySlotCount === 1 ? "move" : "moves"} first`;
}

function moveCountPhrase(applySlotCount: number): string {
  if (applySlotCount === 4) {
    return "a full four-move set";
  }
  if (applySlotCount === 1) {
    return "1 unique move";
  }
  return `${applySlotCount} unique moves`;
}

function remainingSlotsSentence(remainingBuilderSlots: number): string {
  if (remainingBuilderSlots <= 0) {
    return "";
  }
  if (remainingBuilderSlots === 1) {
    return " The remaining slot will be chosen in the Builder.";
  }
  return ` The remaining ${remainingBuilderSlots} slots will be chosen in the Builder.`;
}
