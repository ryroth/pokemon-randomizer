"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RerollButton } from "@/components/randomizer/reroll-button";
import { TypeBadge } from "@/components/recap/type-badge";
import { DexEntryCycler } from "@/components/dex/dex-entry-cycler";
import { BaseStatLine } from "@/components/randomizer/base-stat-line";
import { BallBadge, PokeballReveal } from "@/components/randomizer/pokeball";
import { typeGlow } from "@/components/type-colors";
import { GuessDexEntry } from "@/components/randomizer/guess-dex-entry";
import { PokemonFacts } from "@/components/randomizer/pokemon-facts";
import { PokemonSetDetails } from "@/components/randomizer/pokemon-set-details";
import { baseStatTotal, ballOnCard } from "@/lib/randomizer/ball";
import {
  extremeStatLabels,
  showsCardFact,
  showsSpeciesCardFacts,
  typesToShow,
  usesFullGeneratedCard,
} from "@/lib/randomizer/cardFacts";
import { MOVES_ASSIGNED_PER_POKEMON, requiredMovesPerPokemon } from "@/lib/randomizer/applyExtras";
import { NONE_ITEM_ID, NONE_ITEM_SELECT_VALUE } from "@/lib/randomizer/items";
import { filledMoveCount } from "@/lib/randomizer/session";
import { setSoFar } from "@/lib/randomizer/setSoFar";
import { pokemonImage } from "@/lib/art/pokemonImage";
import type { Ability, Item, Move } from "@/lib/types/catalog-entities";
import { CARD_FACTS, type CardFact } from "@/lib/types/card-facts";
import type { PokemonForm } from "@/lib/types/pokemon";
import { FORM_TYPE_LABELS, type MeasurementSystem } from "@/lib/types/taxonomy";
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
  /** Other forms that have to hold one item. The card shows that item and does not offer a choice. */
  requiredFormItems?: Readonly<Record<string, Item>>;
  unusedItems?: readonly Item[];
  abilitiesById?: ReadonlyMap<string, Ability>;
  movesById?: ReadonlyMap<string, Move>;
  itemsById?: ReadonlyMap<string, Item>;
  /** Species abilities stay off the card while the ability randomizer is on. */
  randomizingAbilities?: boolean;
  movesPerPokemon?: number;
  shownCardFacts: readonly CardFact[];
  measurementSystem: MeasurementSystem;
  generationNumber: number;
  generationCount: number;
  /** Cards that were just rolled come out of a ball. Maps a Pokémon to the roll that revealed it. */
  revealTokens?: ReadonlyMap<string, number>;
  /** Pokémon in this roll that came up shiny. */
  shinyIds?: readonly string[];
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
  requiredFormItems,
  unusedItems,
  abilitiesById,
  movesById,
  itemsById,
  randomizingAbilities = false,
  movesPerPokemon = MOVES_ASSIGNED_PER_POKEMON,
  shownCardFacts = CARD_FACTS,
  measurementSystem,
  generationNumber,
  generationCount,
  revealTokens,
  shinyIds,
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
        {pokemon.map((form, position) => {
          const selected = form.id === selectedPokemonId;
          const generationRevealed = pokemon.some((entry) => entry.id === selectedPokemonId);
          const fullCard =
            assignMode || usesFullGeneratedCard(shownCardFacts, generationRevealed);
          const facts = fullCard ? CARD_FACTS : shownCardFacts;
          const dexText = form.dexEntries[0]?.text;
          const ball = ballOnCard(form, fullCard);
          const revealToken = revealTokens?.get(form.id);
          const playKey = revealToken === undefined ? undefined : `${revealToken}:${form.id}`;
          const shiny = shinyIds?.includes(form.id) ?? false;
          const imageSrc = pokemonImage(form, shiny);
          const appliedAbilityId = appliedAbilityIds?.[form.id];
          const appliedMoves = appliedMoveIds?.[form.id] ?? [];
          const appliedMoveCount = filledMoveCount(appliedMoves);
          const appliedItemId = appliedItemIds?.[form.id];
          const requiredItem = requiredFormItems?.[form.id];
          const parts = assignMode
            ? setSoFar({
                speciesAbilityIds: form.abilityIds,
                randomizingAbilities,
                abilityId: appliedAbilityId,
                moveIds: appliedMoves,
                itemId: appliedItemId,
                requiredItemId: requiredItem?.id,
                abilitiesById: abilitiesById ?? new Map(),
                movesById: movesById ?? new Map(),
                itemsById: itemsById ?? new Map(),
              })
            : undefined;
          const abilityReady = !onApplyAbility || Boolean(appliedAbilityId);
          const movesReady = !onApplyMove || appliedMoveCount >= applySlotCount;
          const itemReady = !onApplyItem || Boolean(requiredItem) || appliedItemId !== undefined;
          const canSelect = abilityReady && movesReady && itemReady;
          const choices = abilityChoicesByPokemon?.[form.id] ?? [];
          const moveSlotChoices = moveChoicesByPokemonSlot?.[form.id] ?? [];
          const itemChoices = itemChoicesByPokemon?.[form.id] ?? [];
          const showName = fullCard;
          const showPicture = fullCard;
          const showDexNumber = showsCardFact(facts, "dexNumber");
          const showGeneration = showsCardFact(facts, "generation");
          const showBst = showsCardFact(facts, "bst");
          const visibleTypes = typesToShow(form.types, facts);
          const spokenName = showName ? form.displayName : "this Pokémon";
          const headerBits: string[] = [];
          if (showDexNumber) {
            headerBits.push(`#${String(form.nationalDexNumber).padStart(4, "0")}`);
          }
          if (showGeneration) {
            headerBits.push(`Gen ${form.generation}`);
          }
          const showBall = showDexNumber && showGeneration && showBst;
          const showTypeRow =
            visibleTypes.length > 0 || (fullCard && form.formType !== "base");

          return (
            <li key={playKey ?? form.id}>
              <PokeballReveal kind={ball} playKey={playKey} index={position}>
              <Card
                className={cn(
                  "flex h-full flex-col",
                  selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
                style={
                  visibleTypes.length === form.types.length
                    ? { backgroundImage: typeGlow(form.types) }
                    : undefined
                }
              >
                <button
                  type="button"
                  className="flex w-full flex-1 flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-pressed={selected}
                  disabled={!canSelect}
                  onClick={() => onSelect(form.id)}
                >
                  <CardHeader>
                    {showPicture ? (
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
                            {showName ? form.displayName.slice(0, 1) : null}
                          </div>
                        )}
                      </div>
                    ) : null}
                    {headerBits.length > 0 || showBst || showBall ? (
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {headerBits.length > 0 ? <span>{headerBits.join(" · ")}</span> : null}
                        {headerBits.length > 0 && showBst ? <span aria-hidden="true">·</span> : null}
                        {showBst ? (
                          <span className="font-mono tabular-nums">
                            BST {baseStatTotal(form.baseStats)}
                          </span>
                        ) : null}
                        {showBall ? <BallBadge kind={ball} /> : null}
                      </p>
                    ) : null}
                    {showName ? (
                      <CardTitle>
                        <h3 className="contents">{form.displayName}</h3>
                      </CardTitle>
                    ) : null}
                    {fullCard ? <BaseStatLine stats={form.baseStats} /> : null}
                    {!fullCard && showsCardFact(facts, "highestStat") ? (
                      <p className="text-sm">
                        Highest: {extremeStatLabels(form.baseStats, "high")}
                      </p>
                    ) : null}
                    {!fullCard && showsCardFact(facts, "lowestStat") ? (
                      <p className="text-sm">
                        Lowest: {extremeStatLabels(form.baseStats, "low")}
                      </p>
                    ) : null}
                    {shiny ? (
                      <p className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-500 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-100">
                        <Sparkles aria-hidden="true" className="size-3.5" />
                        Shiny
                      </p>
                    ) : null}
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
                    {showTypeRow ? (
                    <p className="flex flex-wrap gap-1.5">
                      {visibleTypes.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                      {fullCard && form.formType !== "base" ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          {FORM_TYPE_LABELS[form.formType]}
                        </span>
                      ) : null}
                    </p>
                    ) : null}
                  </CardContent>
                </button>
                {showsSpeciesCardFacts(facts) ? (
                  <div className="px-6 pb-4">
                    <PokemonFacts
                      form={form}
                      measurementSystem={measurementSystem}
                      facts={facts}
                      cryName={spokenName}
                      showBothMeasurements={fullCard}
                    />
                  </div>
                ) : null}
                {showsCardFact(facts, "pokedexEntry") ? (
                  <div className="px-6 pb-4">
                    {showName ? (
                      <DexEntryCycler
                        speciesId={form.speciesId}
                        name={form.displayName}
                        fallbackText={dexText ?? null}
                      />
                    ) : (
                      <GuessDexEntry
                        speciesId={form.speciesId}
                        displayName={form.displayName}
                        fallbackText={dexText ?? null}
                      />
                    )}
                  </div>
                ) : null}
                {parts &&
                (parts.chosenAbility ||
                  parts.speciesAbilities.length > 0 ||
                  parts.moves.length > 0 ||
                  parts.item ||
                  parts.itemIsNone) ? (
                  <div className="border-t border-border px-6 py-4">
                    <PokemonSetDetails
                      chosenAbility={parts.chosenAbility}
                      speciesAbilities={parts.speciesAbilities}
                      moves={parts.moves}
                      item={parts.item}
                      itemIsNone={parts.itemIsNone}
                    />
                  </div>
                ) : null}
                {onApplyAbility ? (
                  <div className="border-t border-border px-6 py-4">
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium">Ability for {spokenName}</span>
                      <select
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={appliedAbilityId ?? ""}
                        aria-label={`Ability for ${spokenName}`}
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
                {fullCard && requiredItem ? (
                  <p className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
                    Holds {requiredItem.name}. This form needs that item.
                  </p>
                ) : null}
                {onApplyItem && !requiredItem ? (
                  <div className="border-t border-border px-6 py-4">
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium">Item for {spokenName}</span>
                      <select
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={
                          appliedItemId === NONE_ITEM_ID
                            ? NONE_ITEM_SELECT_VALUE
                            : (appliedItemId ?? "")
                        }
                        aria-label={`Item for ${spokenName}`}
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
                    <p className="text-sm font-medium">Moves for {spokenName}</p>
                    <p className="text-sm text-muted-foreground">
                      {applyMoveSlotsHelp(applySlotCount, remainingBuilderSlots)}
                    </p>
                    {Array.from({ length: applySlotCount }, (_, slotIndex) => {
                      const slotChoices = moveSlotChoices[slotIndex] ?? [];
                      const appliedMoveId = appliedMoves[slotIndex];
                      return (
                        <label key={slotIndex} className="block space-y-1 text-sm">
                          <span className="font-medium">
                            Move {slotIndex + 1} for {spokenName}
                          </span>
                          <select
                            className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            value={appliedMoveId ?? ""}
                            aria-label={`Move ${slotIndex + 1} for ${spokenName}`}
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
                <RerollButton name={spokenName} onClick={() => onReroll(form.id)} />
              </Card>
              </PokeballReveal>
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
