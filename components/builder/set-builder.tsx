"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  builderItemPool,
  builderMovePool,
  learnsetMoveIds,
  type BuilderMoveList,
  applySuggestedEvs,
  canConfirmEvs,
  confirmDraftEvs,
  finalizeBuilderSet,
  guessEvSpread,
  setDraftAbility,
  setDraftEv,
  setDraftGender,
  setDraftHappiness,
  setDraftItem,
  setDraftIv,
  setDraftLevel,
  setDraftMove,
  setDraftNature,
  setDraftNickname,
  setDraftShiny,
  setDraftTeraType,
} from "@/lib/builder";
import { PokemonPortrait } from "@/components/builder/pokemon-portrait";
import { PageFrame } from "@/components/layout/page-frame";
import { RouteNotice } from "@/components/layout/route-notice";
import { StatSpreadSheet } from "@/components/builder/stat-spread";
import { AbilityDropdown } from "@/components/builder/ability-dropdown";
import { ItemPicker } from "@/components/builder/item-picker";
import { MovePicker } from "@/components/builder/move-picker";
import { useRandomizerSession } from "@/components/session/session-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { builderAbilityPool, battlePokemonId } from "@/lib/randomizer";
import { hiddenAbilityId } from "@/lib/builder/abilities";
import {
  abilityLockedByRandomizer,
  itemLockedByRandomizer,
  moveSlotLockedByRandomizer,
} from "@/lib/builder/locks";
import type { Ability, Item, Move, Nature } from "@/lib/types/catalog-entities";
import type { PokemonForm } from "@/lib/types/pokemon";
import { TERA_TYPES, TYPE_LABELS, type TeraType } from "@/lib/types/pokemon-type";
import { DEFAULT_HAPPINESS, MAX_HAPPINESS, MAX_LEVEL, MAX_NICKNAME_LENGTH, MIN_HAPPINESS, MIN_LEVEL, REQUIRED_MOVE_COUNT, evsCountingBlanksAsZero, sumEvs, validateSet } from "@/lib/validation";
import { cn } from "@/lib/utils";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface SetBuilderProps {
  pokemon: readonly PokemonForm[];
  abilities: readonly Ability[];
  moves: readonly Move[];
  items: readonly Item[];
  natures: readonly Nature[];
}

export function SetBuilder({ pokemon, abilities, moves, items, natures }: SetBuilderProps) {
  const router = useRouter();
  const { session, setSession, ready } = useRandomizerSession();
  const [moveList, setMoveList] = useState<BuilderMoveList>("all");

  const pokemonById = useMemo(() => new Map(pokemon.map((form) => [form.id, form])), [pokemon]);
  const battleId = battlePokemonId(session);
  const battlePokemon = battleId ? pokemonById.get(battleId) : undefined;

  if (!ready) {
    return <RouteNotice title="Build the set" message="Loading your set…" live width="builder" />;
  }

  if (!battlePokemon) {
    return (
      <RouteNotice
        title="Build the set"
        message="Choose a Pokémon in the randomizer before building a set."
        width="builder"
      >
        <Link href="/randomizer" className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
          Back to the randomizer
        </Link>
      </RouteNotice>
    );
  }

  const abilityPool = builderAbilityPool(battlePokemon, session);
  const movePool = builderMovePool(session, moves, {
    list: moveList,
    learnsetIds: learnsetMoveIds(battlePokemon.id),
  });
  const itemPool = builderItemPool(session, items);
  const validation = validateSet(session.draft, battlePokemon);
  const issues = validation.ok ? [] : validation.errors;
  const evTotal = sumEvs(evsCountingBlanksAsZero(session.draft.evs));
  const filledMoveSlots = session.draft.moveIds.filter((id) => Boolean(id)).length;
  const emptyMoveSlots = REQUIRED_MOVE_COUNT - filledMoveSlots;
  const appliedFromRandomizer = session.config.randomizeMoves ? filledMoveSlots : 0;
  const chosenMoves = session.draft.moveIds.map((id) =>
    id ? moves.find((move) => move.id === id) : undefined,
  );
  const abilityLocked = abilityLockedByRandomizer(session);
  const itemLocked = itemLockedByRandomizer(session);
  const moveLocks = session.draft.moveIds.map((_, slot) => moveSlotLockedByRandomizer(session, slot));
  const chosenAbility = abilities.find((ability) => ability.id === session.draft.abilityId);
  const heldItem = items.find((item) => item.id === session.draft.itemId);
  const chosenNature = natures.find((entry) => entry.id === session.draft.natureId);
  const evSuggestion = guessEvSpread({
    showdownName: battlePokemon.showdownName,
    baseStats: battlePokemon.baseStats,
    types: battlePokemon.types,
    moves: chosenMoves.map((move) =>
      move ? { showdownName: move.showdownName, category: move.category } : undefined,
    ),
    abilityName: chosenAbility?.showdownName,
    itemName: heldItem?.showdownName,
    level: session.draft.level,
    ivs: session.draft.ivs,
    plusStat: chosenNature?.plusStat,
    minusStat: chosenNature?.minusStat,
  });

  return (
    <PageFrame width="builder">
      <header className="space-y-3">
        <Link href="/randomizer" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
          Back to the randomizer
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Build {battlePokemon.displayName}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Finish the set by hand. EVs, Nature, Tera type, level, and shiny stay empty until you set
          them. IVs start at 31. Mixed-gender Pokémon need a gender choice too.
        </p>
      </header>

      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          const next = finalizeBuilderSet(session, battlePokemon);
          setSession(next);
          if (next.finalizedSet) {
            router.push("/recap");
          }
        }}
      >
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Nickname</h2>
          <label className="block space-y-1.5 text-sm font-medium">
            Nickname
            <input
              className={controlClass}
              maxLength={MAX_NICKNAME_LENGTH}
              value={session.draft.nickname ?? ""}
              onChange={(event) => setSession(setDraftNickname(session, event.target.value))}
            />
          </label>
          <p className="text-sm text-muted-foreground">
            Optional. Leave this blank to use {battlePokemon.displayName}. Up to {MAX_NICKNAME_LENGTH}{" "}
            characters, including spaces.
          </p>
        </section>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <PokemonPortrait pokemon={battlePokemon} shiny={session.draft.shiny} />
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{battlePokemon.displayName}</p>
          <p className="flex flex-wrap gap-1.5">
            {battlePokemon.types.map((type) => (
              <span key={type} className="rounded-full border border-border px-2 py-0.5 text-xs">
                {TYPE_LABELS[type]}
              </span>
            ))}
          </p>
        </div>
      </div>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Ability</h2>
          <p className="text-sm text-muted-foreground">
            {abilityLocked
              ? "This ability was set by the ability randomizer."
              : session.config.randomizeAbilities
                ? "Choose one ability from the ones you generated."
                : `Choose one of ${battlePokemon.displayName}'s usual abilities.`}
          </p>
          {abilityLocked ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex flex-col gap-1 bg-primary/15 px-3 py-2 sm:flex-row sm:items-start sm:gap-3">
                <span className="font-medium leading-6 sm:w-40 sm:shrink-0">{chosenAbility?.name}</span>
                <span className="text-sm">
                  {abilities.find((ability) => ability.id === session.draft.abilityId)?.description}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Ability</p>
              <AbilityDropdown
                abilities={abilities}
                poolIds={abilityPool}
                hiddenId={session.config.randomizeAbilities ? null : hiddenAbilityId(battlePokemon.id)}
                selectedId={session.draft.abilityId}
                onSelect={(abilityId) => setSession(setDraftAbility(session, abilityId, abilityPool))}
              />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Moves</h2>
          <p className="text-sm text-muted-foreground">
            {appliedFromRandomizer > 0
              ? emptyMoveSlots === 0
                ? "These moves were set by the move randomizer."
                : `${appliedFromRandomizer} ${appliedFromRandomizer === 1 ? "move" : "moves"} you applied ${appliedFromRandomizer === 1 ? "is" : "are"} locked. Choose the empty ${emptyMoveSlots === 1 ? "slot" : "slots"} from the list below.`
              : moveList === "learnset"
                ? `Choose four unique moves ${battlePokemon.displayName} can learn by level-up, egg, TM, or tutor.`
                : "Choose four unique moves from the standard move list."}
          </p>
          {moveLocks.every(Boolean) ? null : (
          <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Move list</legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="move-list"
                    checked={moveList === "all"}
                    onChange={() => setMoveList("all")}
                  />
                  All moves
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="move-list"
                    checked={moveList === "learnset"}
                    onChange={() => setMoveList("learnset")}
                  />
                  {`${battlePokemon.displayName}'s moves`}
                </label>
              </div>
            </fieldset>
          )}
          <MovePicker
            moves={moves}
            poolIds={movePool}
            selectedIds={session.draft.moveIds}
            lockedSlots={moveLocks}
            onSelect={(slot, moveId) => {
              const current = session.draft.moveIds[slot];
              const allowed =
                current && !movePool.includes(current) ? [current, ...movePool] : movePool;
              setSession(setDraftMove(session, slot, moveId, allowed));
            }}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Held item</h2>
          <p className="text-sm text-muted-foreground">
            {itemLocked
              ? "This held item was set by the item randomizer."
              : session.config.randomizeItems
                ? "Choose one generated item, or None."
                : "Choose a holdable item, or None. The list uses the same categories as the item randomizer."}
          </p>
          {itemLocked ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex flex-col gap-1 bg-primary/15 px-3 py-2 sm:flex-row sm:items-start sm:gap-3">
                <span className="font-medium leading-6 sm:w-40 sm:shrink-0">
                  {session.draft.itemId === null ? "None" : (heldItem?.name ?? session.draft.itemId)}
                </span>
                <span className="text-sm">
                  {session.draft.itemId === null ? "The Pokémon holds nothing." : heldItem?.description}
                </span>
              </div>
            </div>
          ) : (
          <ItemPicker
            items={items}
            poolIds={itemPool}
            selectedId={session.draft.itemId}
            onSelect={(itemId) => setSession(setDraftItem(session, itemId, itemPool))}
          />
          )}
        </section>

        <StatSpreadSheet
          pokemon={battlePokemon}
          ivs={session.draft.ivs}
          evs={session.draft.evs}
          level={session.draft.level}
          nature={chosenNature}
          natures={natures}
          suggestion={evSuggestion}
          evTotal={evTotal}
          evsConfirmed={session.draft.evsConfirmed}
          canConfirm={canConfirmEvs(session.draft.evs)}
          onEvChange={(stat, value) => setSession(setDraftEv(session, stat, value))}
          onIvChange={(stat, value) => setSession(setDraftIv(session, stat, value))}
          onNatureChange={(natureId) => setSession(setDraftNature(session, natureId, natures))}
          onApplySuggestion={(guess) => {
            const nature = natures.find(
              (entry) => entry.plusStat === guess.plusStat && entry.minusStat === guess.minusStat,
            );
            setSession(applySuggestedEvs(session, guess.evs, nature?.name, natures));
          }}
          onConfirm={(confirmed) => setSession(confirmDraftEvs(session, confirmed))}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Tera, gender, level, shiny, happiness</h2>

          <label className="block space-y-1.5 text-sm font-medium">
            Tera type
            <select
              className={controlClass}
              value={session.draft.teraType ?? ""}
              onChange={(event) =>
                setSession(
                  setDraftTeraType(
                    session,
                    event.target.value ? (event.target.value as TeraType) : undefined,
                  ),
                )
              }
            >
              <option value="">Choose a Tera type</option>
              {TERA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <GenderField
            displayName={battlePokemon.displayName}
            genderRule={battlePokemon.genderRule}
            gender={session.draft.gender}
            onChange={(gender) => setSession(setDraftGender(session, gender, battlePokemon.genderRule))}
          />

          <label className="block max-w-xs space-y-1.5 text-sm font-medium">
            Level
            <input
              type="number"
              inputMode="numeric"
              min={MIN_LEVEL}
              max={MAX_LEVEL}
              className={controlClass}
              value={session.draft.level ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                setSession(setDraftLevel(session, raw === "" ? undefined : Number(raw)));
              }}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Shiny</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shiny"
                  checked={session.draft.shiny === true}
                  onChange={() => setSession(setDraftShiny(session, true))}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shiny"
                  checked={session.draft.shiny === false}
                  onChange={() => setSession(setDraftShiny(session, false))}
                />
                No
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Happiness</legend>
            <p className="text-sm text-muted-foreground">
              From {MIN_HAPPINESS} to {MAX_HAPPINESS}. Frustration is strongest at {MIN_HAPPINESS}.
              Return is strongest at {MAX_HAPPINESS}. The set starts at {DEFAULT_HAPPINESS}.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="range"
                className="w-full sm:flex-1"
                min={MIN_HAPPINESS}
                max={MAX_HAPPINESS}
                aria-valuemin={MIN_HAPPINESS}
                aria-valuemax={MAX_HAPPINESS}
                aria-label="Happiness"
                value={session.draft.happiness ?? DEFAULT_HAPPINESS}
                onChange={(event) => setSession(setDraftHappiness(session, Number(event.target.value)))}
              />
              <label className="block w-full space-y-1.5 text-sm font-medium sm:w-24">
                Happiness value
                <input
                  type="number"
                  inputMode="numeric"
                  min={MIN_HAPPINESS}
                  max={MAX_HAPPINESS}
                  className={controlClass}
                  value={session.draft.happiness ?? DEFAULT_HAPPINESS}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setSession(setDraftHappiness(session, raw === "" ? undefined : Number(raw)));
                  }}
                />
              </label>
            </div>
          </fieldset>
        </section>

        {issues.length > 0 ? (
          <div role="status" className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-sm font-medium">Still needed before the recap</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {issues.map((issue) => (
                <li key={`${issue.code}-${issue.field}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            This set is ready for the recap.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={!validation.ok}>
            Continue to recap
          </Button>
          <Link href="/randomizer" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-fit")}>
            Back to the randomizer
          </Link>
        </div>
      </form>
    </PageFrame>
  );
}

function GenderField({
  displayName,
  genderRule,
  gender,
  onChange,
}: {
  displayName: string;
  genderRule: PokemonForm["genderRule"];
  gender: "M" | "F" | undefined;
  onChange: (gender: "M" | "F" | undefined) => void;
}) {
  if (genderRule === "genderless") {
    return <p className="text-sm text-muted-foreground">{displayName} is genderless.</p>;
  }
  if (genderRule === "male" || genderRule === "female") {
    return (
      <p className="text-sm text-muted-foreground">
        {displayName} is always {genderRule === "male" ? "Male" : "Female"}.
      </p>
    );
  }
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Gender</legend>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            checked={gender === "M"}
            onChange={() => onChange("M")}
          />
          Male
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            checked={gender === "F"}
            onChange={() => onChange("F")}
          />
          Female
        </label>
      </div>
    </fieldset>
  );
}
