"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shuffle } from "lucide-react";
import { AbilityConfigForm } from "@/components/randomizer/ability-config";
import { AbilityResults } from "@/components/randomizer/ability-results";
import { ItemConfigForm } from "@/components/randomizer/item-config";
import { ItemResults } from "@/components/randomizer/item-results";
import { MoveConfigForm } from "@/components/randomizer/move-config";
import { MoveResults } from "@/components/randomizer/move-results";
import { PokemonEvolutionPicker } from "@/components/randomizer/pokemon-evolution";
import { PokemonFilterForm } from "@/components/randomizer/pokemon-filter-form";
import { PokemonResults } from "@/components/randomizer/pokemon-results";
import { RandomizerFlowList } from "@/components/randomizer/randomizer-flow";
import { RandomizerTabs } from "@/components/randomizer/randomizer-tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { evolutionChoices } from "@/lib/data/evolution";
import {
  applyAbilityRoll,
  applyAbilityToRolledPokemon,
  abilityChoicesForPokemon,
  applyItemRoll,
  applyItemToRolledPokemon,
  applyMoveRoll,
  applyMoveToRolledPokemon,
  applyPokemonRoll,
  applySessionConfig,
  battlePokemonId,
  canOpenRandomizerTab,
  chooseEvolvedPokemon,
  clampViewedRollIndex,
  clearPokemonRolls,
  createInitialSession,
  createSeed,
  filledMoveCount,
  isExtraBeforePokemon,
  itemChoicesForPokemon,
  matchingAbilityPoolSize,
  matchingItemPoolSize,
  matchingMovePoolSize,
  matchingPokemonPoolSize,
  moveChoicesForPokemon,
  MOVES_ASSIGNED_PER_POKEMON,
  nextOpenDestination,
  openRandomizerTab,
  previousOpenDestination,
  randomizeAbilities,
  randomizeItems,
  randomizeMoves,
  randomizePokemon,
  replaceRolledAbility,
  replaceRolledItem,
  replaceRolledMove,
  replaceRolledPokemon,
  requiredMovesPerPokemon,
  rerollAbility,
  rerollItem,
  rerollMove,
  rerollPokemon,
  selectRolledAbility,
  selectRolledItem,
  selectRolledMove,
  selectRolledPokemon,
  showNextPokemonRoll,
  showPreviousPokemonRoll,
  syncRandomizerTab,
  unassignedAbilityIds,
  unassignedItemIds,
  unassignedMoveIds,
  userFacingRandomizerMessage,
  viewedPokemonRoll,
  visibleRandomizerTabs,
} from "@/lib/randomizer";
import type { Ability, Item, Move } from "@/lib/types/catalog-entities";
import { TYPE_LABELS } from "@/lib/types/pokemon-type";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { RandomizerDestination } from "@/lib/randomizer/flow";
import type { RandomizerTab } from "@/lib/types/randomizer";
import { cn } from "@/lib/utils";

interface PokemonRandomizerProps {
  pokemon: readonly PokemonForm[];
  abilities: readonly Ability[];
  moves: readonly Move[];
  items: readonly Item[];
}

export function PokemonRandomizer({ pokemon, abilities, moves, items }: PokemonRandomizerProps) {
  const [session, setSession] = useState(() => createInitialSession());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [abilityErrorMessage, setAbilityErrorMessage] = useState<string | null>(null);
  const [moveErrorMessage, setMoveErrorMessage] = useState<string | null>(null);
  const [itemErrorMessage, setItemErrorMessage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const evolutionRef = useRef<HTMLDivElement>(null);
  const latestSeed = session.pokemonRolls[0]?.seed;
  const pokemonById = useMemo(
    () => new Map(pokemon.map((form) => [form.id, form])),
    [pokemon],
  );
  const abilitiesById = useMemo(
    () => new Map(abilities.map((ability) => [ability.id, ability])),
    [abilities],
  );
  const movesById = useMemo(() => new Map(moves.map((move) => [move.id, move])), [moves]);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const poolSize = useMemo(
    () => matchingPokemonPoolSize(pokemon, session.config),
    [pokemon, session.config],
  );
  const abilityPoolSize = useMemo(() => matchingAbilityPoolSize(abilities), [abilities]);
  const movePoolSize = useMemo(
    () => matchingMovePoolSize(moves, session.config),
    [moves, session.config],
  );
  const itemPoolSize = useMemo(
    () => matchingItemPoolSize(items, session.config),
    [items, session.config],
  );

  const viewedRoll = viewedPokemonRoll(session);
  const viewedPokemon = (viewedRoll?.pokemonIds ?? []).flatMap((id) => {
    const form = pokemonById.get(id);
    return form ? [form] : [];
  });
  const selectedPokemon = session.selectedPokemonId
    ? pokemonById.get(session.selectedPokemonId)
    : undefined;
  const selectedEvolutionChoices = selectedPokemon
    ? evolutionChoices(selectedPokemon, pokemonById)
    : [];
  const chosenBattlePokemonId = battlePokemonId(session);
  const chosenBattlePokemon = chosenBattlePokemonId
    ? pokemonById.get(chosenBattlePokemonId)
    : undefined;
  const rolledAbilities = session.abilityOptions.flatMap((id) => {
    const ability = abilitiesById.get(id);
    return ability ? [ability] : [];
  });
  const rolledMoves = session.moveOptions.flatMap((id) => {
    const move = movesById.get(id);
    return move ? [move] : [];
  });
  const rolledItems = session.itemOptions.flatMap((id) => {
    const item = itemsById.get(id);
    return item ? [item] : [];
  });
  const abilityBeforePokemon = isExtraBeforePokemon(session.config, "ability");
  const moveBeforePokemon = isExtraBeforePokemon(session.config, "move");
  const itemBeforePokemon = isExtraBeforePokemon(session.config, "item");
  const movesPerPokemon = requiredMovesPerPokemon(session.config.movesPerPokemon);
  const remainingBuilderMoveSlots = MOVES_ASSIGNED_PER_POKEMON - movesPerPokemon;
  const appliedAbilityIds = useMemo(() => {
    const ids: Record<string, string | undefined> = {};
    const roll = viewedRoll;
    if (!roll?.appliedAbilityIds) {
      return ids;
    }
    roll.pokemonIds.forEach((pokemonId, index) => {
      ids[pokemonId] = roll.appliedAbilityIds?.[index];
    });
    return ids;
  }, [viewedRoll]);
  const appliedMoveIds = useMemo(() => {
    const ids: Record<string, Array<string | undefined>> = {};
    const roll = viewedRoll;
    if (!roll?.appliedMoveIds) {
      return ids;
    }
    roll.pokemonIds.forEach((pokemonId, index) => {
      ids[pokemonId] = roll.appliedMoveIds?.[index] ?? [];
    });
    return ids;
  }, [viewedRoll]);
  const appliedItemIds = useMemo(() => {
    const ids: Record<string, string | null | undefined> = {};
    const roll = viewedRoll;
    if (!roll?.appliedItemIds) {
      return ids;
    }
    roll.pokemonIds.forEach((pokemonId, index) => {
      ids[pokemonId] = roll.appliedItemIds?.[index];
    });
    return ids;
  }, [viewedRoll]);
  const abilityChoicesByPokemon = useMemo(() => {
    const choices: Record<string, Ability[]> = {};
    if (!abilityBeforePokemon) {
      return choices;
    }
    for (const form of viewedPokemon) {
      choices[form.id] = abilityChoicesForPokemon(session, form.id).flatMap((id) => {
        const ability = abilitiesById.get(id);
        return ability ? [ability] : [];
      });
    }
    return choices;
  }, [abilitiesById, abilityBeforePokemon, session, viewedPokemon]);
  const moveChoicesByPokemonSlot = useMemo(() => {
    const choices: Record<string, Array<Move[]>> = {};
    if (!moveBeforePokemon) {
      return choices;
    }
    for (const form of viewedPokemon) {
      choices[form.id] = Array.from({ length: movesPerPokemon }, (_, slotIndex) =>
        moveChoicesForPokemon(session, form.id, slotIndex).flatMap((id) => {
          const move = movesById.get(id);
          return move ? [move] : [];
        }),
      );
    }
    return choices;
  }, [moveBeforePokemon, movesById, movesPerPokemon, session, viewedPokemon]);
  const itemChoicesByPokemon = useMemo(() => {
    const choices: Record<string, Item[]> = {};
    if (!itemBeforePokemon) {
      return choices;
    }
    for (const form of viewedPokemon) {
      choices[form.id] = itemChoicesForPokemon(session, form.id).flatMap((id) => {
        const item = itemsById.get(id);
        return item ? [item] : [];
      });
    }
    return choices;
  }, [itemBeforePokemon, itemsById, session, viewedPokemon]);
  const unusedAbilities = useMemo(
    () =>
      unassignedAbilityIds(session).flatMap((id) => {
        const ability = abilitiesById.get(id);
        return ability ? [ability] : [];
      }),
    [abilitiesById, session],
  );
  const unusedMoves = useMemo(
    () =>
      unassignedMoveIds(session).flatMap((id) => {
        const move = movesById.get(id);
        return move ? [move] : [];
      }),
    [movesById, session],
  );
  const unusedItems = useMemo(
    () =>
      unassignedItemIds(session).flatMap((id) => {
        const item = itemsById.get(id);
        return item ? [item] : [];
      }),
    [itemsById, session],
  );
  const generationCount = session.pokemonRolls.length;
  const generationNumber =
    generationCount === 0 ? 0 : generationCount - clampViewedRollIndex(session);
  const tabs = visibleRandomizerTabs(session.config);
  const nextFromPokemon = nextOpenDestination(session.config, "pokemon");
  const nextFromAbility = nextOpenDestination(session.config, "ability");
  const nextFromMove = nextOpenDestination(session.config, "move");
  const nextFromItem = nextOpenDestination(session.config, "item");
  const previousFromAbility = previousOpenDestination(session.config, "ability");
  const previousFromMove = previousOpenDestination(session.config, "move");
  const previousFromItem = previousOpenDestination(session.config, "item");
  const pokemonContinueReady = Boolean(session.selectedPokemonId);
  const abilityContinueReady = abilityBeforePokemon
    ? session.abilityOptions.length > 0
    : Boolean(session.draft.abilityId);
  const moveContinueReady = moveBeforePokemon
    ? session.moveOptions.length > 0
    : filledMoveCount(session.draft.moveIds) === MOVES_ASSIGNED_PER_POKEMON;
  const itemContinueReady = itemBeforePokemon
    ? session.itemOptions.length > 0
    : session.draft.itemId !== undefined;
  const abilityTabOpen =
    session.tab === "ability" && canOpenRandomizerTab(session, "ability");
  const moveTabOpen = session.tab === "move" && canOpenRandomizerTab(session, "move");
  const itemTabOpen = session.tab === "item" && canOpenRandomizerTab(session, "item");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [session.tab]);

  useEffect(() => {
    if (session.tab !== "pokemon" || !latestSeed) {
      return;
    }

    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [latestSeed, session.tab]);

  useEffect(() => {
    if (session.tab !== "pokemon" || !session.selectedPokemonId) {
      return;
    }

    evolutionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [session.selectedPokemonId, session.tab]);

  function clearExtraErrors() {
    setAbilityErrorMessage(null);
    setMoveErrorMessage(null);
    setItemErrorMessage(null);
  }

  function handleGenerate() {
    try {
      const result = randomizePokemon(pokemon, session.config, createSeed());
      setSession(applyPokemonRoll(session, result));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleGenerateAbilities() {
    if (!abilityBeforePokemon && !chosenBattlePokemonId) {
      return;
    }

    try {
      const result = randomizeAbilities(abilities, session.config, createSeed());
      setSession(applyAbilityRoll(session, result, chosenBattlePokemonId));
      setAbilityErrorMessage(null);
    } catch (error) {
      setAbilityErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleGenerateMoves() {
    if (!moveBeforePokemon && !chosenBattlePokemonId) {
      return;
    }

    try {
      const result = randomizeMoves(moves, session.config, createSeed());
      setSession(applyMoveRoll(session, result, chosenBattlePokemonId));
      setMoveErrorMessage(null);
    } catch (error) {
      setMoveErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleGenerateItems() {
    if (!itemBeforePokemon && !chosenBattlePokemonId) {
      return;
    }

    try {
      const result = randomizeItems(items, session.config, createSeed());
      setSession(applyItemRoll(session, result, chosenBattlePokemonId));
      setItemErrorMessage(null);
    } catch (error) {
      setItemErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleRerollPokemon(pokemonId: string) {
    const roll = viewedPokemonRoll(session);
    if (!roll) {
      return;
    }

    try {
      const result = rerollPokemon(
        pokemon,
        session.config,
        roll.pokemonIds,
        pokemonId,
        createSeed(),
      );
      const replacement = result.pokemon[0];
      if (!replacement) {
        return;
      }
      setSession(replaceRolledPokemon(session, pokemonId, replacement.id));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleRerollAbility(abilityId: string) {
    try {
      const result = rerollAbility(abilities, session.abilityOptions, abilityId, createSeed());
      const replacement = result.abilities[0];
      if (!replacement) {
        return;
      }
      setSession(replaceRolledAbility(session, abilityId, replacement.id));
      setAbilityErrorMessage(null);
    } catch (error) {
      setAbilityErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleRerollMove(moveId: string) {
    try {
      const result = rerollMove(moves, session.config, session.moveOptions, moveId, createSeed());
      const replacement = result.moves[0];
      if (!replacement) {
        return;
      }
      setSession(replaceRolledMove(session, moveId, replacement.id));
      setMoveErrorMessage(null);
    } catch (error) {
      setMoveErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleRerollItem(itemId: string) {
    try {
      const result = rerollItem(items, session.config, session.itemOptions, itemId, createSeed());
      const replacement = result.items[0];
      if (!replacement) {
        return;
      }
      setSession(replaceRolledItem(session, itemId, replacement.id));
      setItemErrorMessage(null);
    } catch (error) {
      setItemErrorMessage(userFacingRandomizerMessage(error));
    }
  }

  function handleTabChange(tab: RandomizerTab) {
    setSession(openRandomizerTab(session, tab));
  }

  function handleConfigChange(config: typeof session.config) {
    setErrorMessage(null);
    clearExtraErrors();
    setSession(applySessionConfig(session, config));
  }

  const heading = itemTabOpen
    ? !itemBeforePokemon && chosenBattlePokemon
      ? `Items for ${chosenBattlePokemon.displayName}`
      : "Item randomizer"
    : moveTabOpen
      ? !moveBeforePokemon && chosenBattlePokemon
        ? `Moves for ${chosenBattlePokemon.displayName}`
        : "Move randomizer"
      : abilityTabOpen && !abilityBeforePokemon && chosenBattlePokemon
        ? `Abilities for ${chosenBattlePokemon.displayName}`
        : abilityTabOpen
          ? "Ability randomizer"
          : "Configure your roll";
  const intro = itemTabOpen
    ? itemBeforePokemon
      ? "Generate unique held items from the selected Showdown categories. Next you will apply each item to a Pokémon you choose, then select one to build. None is always a choice."
      : "Generate unique held items from the selected Showdown categories, then pick one or None. This is not limited to items this Pokémon usually holds."
    : moveTabOpen
      ? moveBeforePokemon
        ? `Generate unique moves from the categories and types you select. Next you will apply ${moveCountPhrase(movesPerPokemon)} to a Pokémon you choose.${remainingSlotsSentence(remainingBuilderMoveSlots)}`
        : "Generate unique moves from the categories and types you select, then pick four. This is not limited to the moves this Pokémon usually learns."
      : abilityTabOpen
        ? abilityBeforePokemon
          ? "Generate unique abilities from every standard ability. Next you will apply each ability to a Pokémon you choose, then select one to build."
          : "Generate unique abilities from every standard ability, then pick one. This is not limited to the abilities this Pokémon usually has."
        : "Choose how many unique Pokémon to generate, then optionally turn on later randomizers. You can put Pokémon, Ability, Move, and Item in any order.";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">{intro}</p>
      </header>

      <RandomizerFlowList config={session.config} onChange={handleConfigChange} />

      {tabs.length > 1 ? (
        <RandomizerTabs
          tabs={tabs}
          activeTab={tabs.includes(session.tab) ? session.tab : "pokemon"}
          canOpen={(tab) => canOpenRandomizerTab(session, tab)}
          onChange={handleTabChange}
        />
      ) : null}

      {itemTabOpen ? (
        <div
          role="tabpanel"
          id="randomizer-panel-item"
          aria-labelledby="randomizer-tab-item"
          className="flex flex-col gap-10"
        >
          {!itemBeforePokemon && chosenBattlePokemon ? (
            <BattlePokemonSummary pokemon={chosenBattlePokemon} />
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="contents">Items</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ItemConfigForm
                config={session.config}
                poolSize={itemPoolSize}
                beforePokemon={itemBeforePokemon}
                onChange={handleConfigChange}
              />
            </CardContent>
          </Card>
          <ItemResults
            items={rolledItems}
            selectedItemId={session.draft.itemId}
            selectable={!itemBeforePokemon}
            errorMessage={itemErrorMessage}
            onGenerate={handleGenerateItems}
            onSelect={(itemId) => setSession(selectRolledItem(session, itemId))}
            onReroll={handleRerollItem}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContinueControl
              ready={itemContinueReady}
              next={nextFromItem}
              battlePokemon={chosenBattlePokemon}
              selectedPokemon={selectedPokemon}
              onOpenTab={(tab) => setSession(openRandomizerTab(session, tab))}
            />
            {previousFromItem ? (
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => setSession(openRandomizerTab(session, previousFromItem))}
              >
                {previousFromItem === "pokemon"
                  ? "Back to Pokémon"
                  : previousFromItem === "ability"
                    ? "Back to abilities"
                    : previousFromItem === "move"
                      ? "Back to moves"
                      : "Back"}
              </Button>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {describeItemContinueHelp({
                beforePokemon: itemBeforePokemon,
                battlePokemon: chosenBattlePokemon,
                ready: itemContinueReady,
                hasPool: rolledItems.length > 0,
                next: nextFromItem,
              })}
            </p>
          </div>
        </div>
      ) : moveTabOpen ? (
        <div
          role="tabpanel"
          id="randomizer-panel-move"
          aria-labelledby="randomizer-tab-move"
          className="flex flex-col gap-10"
        >
          {!moveBeforePokemon && chosenBattlePokemon ? (
            <BattlePokemonSummary pokemon={chosenBattlePokemon} />
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="contents">Moves</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoveConfigForm
                config={session.config}
                poolSize={movePoolSize}
                beforePokemon={moveBeforePokemon}
                onChange={handleConfigChange}
              />
            </CardContent>
          </Card>
          <MoveResults
            moves={rolledMoves}
            selectedMoveIds={session.draft.moveIds}
            selectable={!moveBeforePokemon}
            errorMessage={moveErrorMessage}
            onGenerate={handleGenerateMoves}
            onSelect={(moveId) => setSession(selectRolledMove(session, moveId))}
            onReroll={handleRerollMove}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContinueControl
              ready={moveContinueReady}
              next={nextFromMove}
              battlePokemon={chosenBattlePokemon}
              selectedPokemon={selectedPokemon}
              onOpenTab={(tab) => setSession(openRandomizerTab(session, tab))}
            />
            {previousFromMove ? (
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => setSession(openRandomizerTab(session, previousFromMove))}
              >
                {previousFromMove === "pokemon"
                  ? "Back to Pokémon"
                  : previousFromMove === "ability"
                    ? "Back to abilities"
                    : previousFromMove === "item"
                      ? "Back to items"
                      : "Back"}
              </Button>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {describeMoveContinueHelp({
                beforePokemon: moveBeforePokemon,
                battlePokemon: chosenBattlePokemon,
                ready: moveContinueReady,
                hasPool: rolledMoves.length > 0,
                selectedCount: filledMoveCount(session.draft.moveIds),
                movesPerPokemon,
                remainingBuilderMoveSlots,
                next: nextFromMove,
              })}
            </p>
          </div>
        </div>
      ) : abilityTabOpen ? (
        <div
          role="tabpanel"
          id="randomizer-panel-ability"
          aria-labelledby="randomizer-tab-ability"
          className="flex flex-col gap-10"
        >
          {!abilityBeforePokemon && chosenBattlePokemon ? (
            <BattlePokemonSummary pokemon={chosenBattlePokemon} />
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="contents">Abilities</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AbilityConfigForm
                config={session.config}
                poolSize={abilityPoolSize}
                beforePokemon={abilityBeforePokemon}
                onChange={handleConfigChange}
              />
            </CardContent>
          </Card>
          <AbilityResults
            abilities={rolledAbilities}
            selectedAbilityId={session.draft.abilityId}
            selectable={!abilityBeforePokemon}
            errorMessage={abilityErrorMessage}
            onGenerate={handleGenerateAbilities}
            onSelect={(abilityId) => setSession(selectRolledAbility(session, abilityId))}
            onReroll={handleRerollAbility}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContinueControl
              ready={abilityContinueReady}
              next={nextFromAbility}
              battlePokemon={chosenBattlePokemon}
              selectedPokemon={selectedPokemon}
              onOpenTab={(tab) => setSession(openRandomizerTab(session, tab))}
            />
            {previousFromAbility ? (
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => setSession(openRandomizerTab(session, previousFromAbility))}
              >
                {previousFromAbility === "pokemon"
                  ? "Back to Pokémon"
                  : previousFromAbility === "move"
                    ? "Back to moves"
                    : previousFromAbility === "item"
                      ? "Back to items"
                      : "Back"}
              </Button>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {describeAbilityContinueHelp({
                beforePokemon: abilityBeforePokemon,
                battlePokemon: chosenBattlePokemon,
                ready: abilityContinueReady,
                hasPool: rolledAbilities.length > 0,
                next: nextFromAbility,
              })}
            </p>
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="randomizer-panel-pokemon"
          aria-labelledby="randomizer-tab-pokemon"
          className="flex flex-col gap-10"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="contents">Pokémon</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleGenerate();
                }}
              >
                <PokemonFilterForm
                  config={session.config}
                  poolSize={poolSize}
                  onChange={(config) => {
                    setErrorMessage(null);
                    setSession(
                      syncRandomizerTab({
                        ...session,
                        config,
                      }),
                    );
                  }}
                />
                {session.config.randomizeAbilities &&
                abilityBeforePokemon &&
                session.abilityOptions.length === 0 ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Ability randomizer is before Pokémon. Generate abilities first, then apply each
                    one to a Pokémon you choose.
                  </p>
                ) : null}
                {session.config.randomizeMoves &&
                moveBeforePokemon &&
                session.moveOptions.length === 0 ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Move randomizer is before Pokémon. Generate moves first, then apply{" "}
                    {moveCountPhrase(movesPerPokemon)} to a Pokémon you choose.
                    {remainingSlotsSentence(remainingBuilderMoveSlots)}
                  </p>
                ) : null}
                {session.config.randomizeItems &&
                itemBeforePokemon &&
                session.itemOptions.length === 0 ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Item randomizer is before Pokémon. Generate items first, then apply each
                    one to a Pokémon you choose. None is always a choice.
                  </p>
                ) : null}
                {errorMessage ? (
                  <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errorMessage}
                  </p>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" size="lg">
                    <Shuffle />
                    Generate Pokémon
                  </Button>
                  {generationCount > 0 ? (
                    <a
                      href="#generated-pokemon"
                      className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-fit")}
                    >
                      View generated Pokémon
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Results stay unique along overlapping evolution paths. Split branches can appear
                      together: Cascoon can share a generation with Silcoon or Beautifly, but not with
                      Wurmple or Dustox. If the pool is too small, generation stops with an explanation
                      instead of a short list.
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div ref={resultsRef}>
            <PokemonResults
              pokemon={viewedPokemon}
              selectedPokemonId={session.selectedPokemonId}
              appliedAbilityIds={abilityBeforePokemon ? appliedAbilityIds : undefined}
              abilityChoicesByPokemon={
                abilityBeforePokemon ? abilityChoicesByPokemon : undefined
              }
              unusedAbilities={abilityBeforePokemon ? unusedAbilities : undefined}
              appliedMoveIds={moveBeforePokemon ? appliedMoveIds : undefined}
              moveChoicesByPokemonSlot={
                moveBeforePokemon ? moveChoicesByPokemonSlot : undefined
              }
              unusedMoves={moveBeforePokemon ? unusedMoves : undefined}
              movesPerPokemon={moveBeforePokemon ? movesPerPokemon : undefined}
              appliedItemIds={itemBeforePokemon ? appliedItemIds : undefined}
              itemChoicesByPokemon={itemBeforePokemon ? itemChoicesByPokemon : undefined}
              unusedItems={itemBeforePokemon ? unusedItems : undefined}
              showPokedexEntry={session.config.showPokedexEntry}
              generationNumber={generationNumber}
              generationCount={generationCount}
              onSelect={(pokemonId) => {
                clearExtraErrors();
                setSession(selectRolledPokemon(session, pokemonId));
              }}
              onApplyAbility={
                abilityBeforePokemon
                  ? (pokemonId, abilityId) => {
                      clearExtraErrors();
                      setSession(applyAbilityToRolledPokemon(session, pokemonId, abilityId));
                    }
                  : undefined
              }
              onApplyMove={
                moveBeforePokemon
                  ? (pokemonId, slotIndex, moveId) => {
                      clearExtraErrors();
                      setSession(applyMoveToRolledPokemon(session, pokemonId, slotIndex, moveId));
                    }
                  : undefined
              }
              onApplyItem={
                itemBeforePokemon
                  ? (pokemonId, itemId) => {
                      clearExtraErrors();
                      setSession(applyItemToRolledPokemon(session, pokemonId, itemId));
                    }
                  : undefined
              }
              onPrevious={() => setSession(showPreviousPokemonRoll(session))}
              onNext={() => setSession(showNextPokemonRoll(session))}
              onReroll={handleRerollPokemon}
            />
          </div>

          {selectedPokemon && chosenBattlePokemonId ? (
            <div ref={evolutionRef}>
              <PokemonEvolutionPicker
                selected={selectedPokemon}
                options={selectedEvolutionChoices}
                battlePokemonId={chosenBattlePokemonId}
                onChoose={(pokemonId) => {
                  clearExtraErrors();
                  setSession(chooseEvolvedPokemon(session, selectedPokemon, pokemonId));
                }}
              />
            </div>
          ) : null}

          {generationCount > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ContinueControl
                ready={pokemonContinueReady}
                next={nextFromPokemon}
                battlePokemon={chosenBattlePokemon}
                selectedPokemon={selectedPokemon}
                onOpenTab={(tab) => setSession(openRandomizerTab(session, tab))}
              />
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => {
                  clearExtraErrors();
                  setSession(clearPokemonRolls(session));
                }}
              >
                Clear generated Pokémon
              </Button>
              <p className="text-sm text-muted-foreground">
                {describePokemonContinueHelp({
                  battlePokemon: chosenBattlePokemon,
                  selectedPokemon,
                  next: nextFromPokemon,
                  abilityBeforePokemon,
                  moveBeforePokemon,
                  itemBeforePokemon,
                  movesPerPokemon,
                  remainingBuilderMoveSlots,
                })}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ContinueControl({
  ready,
  next,
  battlePokemon,
  selectedPokemon,
  onOpenTab,
}: {
  ready: boolean;
  next: RandomizerDestination;
  battlePokemon: PokemonForm | undefined;
  selectedPokemon: PokemonForm | undefined;
  onOpenTab: (tab: RandomizerTab) => void;
}) {
  const label = continueLabel(next, battlePokemon, selectedPokemon);

  if (ready && next === "builder") {
    return (
      <Link href="/builder" className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
        {label}
      </Link>
    );
  }

  if (ready && next !== "builder") {
    return (
      <Button type="button" size="lg" className="w-fit" onClick={() => onOpenTab(next)}>
        {label}
      </Button>
    );
  }

  return (
    <span
      className={cn(buttonVariants({ size: "lg" }), "w-fit cursor-not-allowed opacity-50")}
      aria-disabled="true"
    >
      {label}
    </span>
  );
}

function continueLabel(
  next: RandomizerDestination,
  battlePokemon: PokemonForm | undefined,
  selectedPokemon: PokemonForm | undefined,
): string {
  if (next === "ability") {
    return battlePokemon
      ? `Continue to abilities with ${battlePokemon.displayName}`
      : "Continue to abilities";
  }
  if (next === "pokemon") {
    return "Continue to Pokémon";
  }
  if (next === "move") {
    return battlePokemon
      ? `Continue to moves with ${battlePokemon.displayName}`
      : "Continue to moves";
  }
  if (next === "item") {
    return battlePokemon
      ? `Continue to items with ${battlePokemon.displayName}`
      : "Continue to items";
  }
  if (battlePokemon && battlePokemon.id !== selectedPokemon?.id) {
    return `Continue with ${battlePokemon.displayName}`;
  }
  return "Continue to builder";
}

function BattlePokemonSummary({ pokemon }: { pokemon: PokemonForm }) {
  const imageSrc = pokemon.sprites.artwork ?? pokemon.sprites.sprite;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="relative size-20 shrink-0">
        {imageSrc ? (
          <Image src={imageSrc} alt="" fill sizes="80px" className="object-contain" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-xl border border-dashed border-border text-xl text-muted-foreground">
            {pokemon.displayName.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{pokemon.displayName}</p>
        <p className="flex flex-wrap gap-1.5">
          {pokemon.types.map((type) => (
            <span key={type} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {TYPE_LABELS[type]}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function describePokemonContinueHelp(input: {
  battlePokemon: PokemonForm | undefined;
  selectedPokemon: PokemonForm | undefined;
  next: RandomizerDestination;
  abilityBeforePokemon: boolean;
  moveBeforePokemon: boolean;
  itemBeforePokemon: boolean;
  movesPerPokemon: number;
  remainingBuilderMoveSlots: number;
}): string {
  if (!input.battlePokemon) {
    const parts: string[] = [];
    if (input.abilityBeforePokemon) {
      parts.push("an ability");
    }
    if (input.itemBeforePokemon) {
      parts.push("an item");
    }
    if (input.moveBeforePokemon) {
      parts.push(moveCountPhrase(input.movesPerPokemon));
    }
    if (parts.length === 1) {
      return `Apply ${parts[0]} to a Pokémon, then select that Pokémon.${input.moveBeforePokemon ? remainingSlotsSentence(input.remainingBuilderMoveSlots) : ""}`;
    }
    if (parts.length === 2) {
      return `Apply ${parts[0]} to a Pokémon, then apply ${parts[1]} and select that Pokémon.${input.moveBeforePokemon ? remainingSlotsSentence(input.remainingBuilderMoveSlots) : ""}`;
    }
    if (parts.length === 3) {
      return `Apply ${parts[0]} to a Pokémon, then apply ${parts[1]} and ${parts[2]}, and select that Pokémon.${remainingSlotsSentence(input.remainingBuilderMoveSlots)}`;
    }
    return "Select a Pokémon above to enable the next step.";
  }

  if (input.next === "ability") {
    return `Next you will randomize abilities for ${input.battlePokemon.displayName}.`;
  }

  if (input.next === "move") {
    return `Next you will randomize moves for ${input.battlePokemon.displayName}.`;
  }

  if (input.next === "item") {
    return `Next you will randomize items for ${input.battlePokemon.displayName}.`;
  }

  if (input.next === "pokemon") {
    return "Continue to the Pokémon randomizer.";
  }

  if (input.abilityBeforePokemon || input.moveBeforePokemon || input.itemBeforePokemon) {
    return "The builder is still a placeholder. Selection is saved on this page only for now.";
  }

  if (input.battlePokemon.id !== input.selectedPokemon?.id) {
    return `You'll build ${input.battlePokemon.displayName}, evolved from ${input.selectedPokemon?.displayName}. The builder is still a placeholder.`;
  }

  return "The builder is still a placeholder. In the builder you will choose from this Pokémon's usual abilities.";
}

function describeAbilityContinueHelp(input: {
  beforePokemon: boolean;
  battlePokemon: PokemonForm | undefined;
  ready: boolean;
  hasPool: boolean;
  next: RandomizerDestination;
}): string {
  if (input.beforePokemon) {
    if (!input.hasPool) {
      return "Generate an ability pool before continuing.";
    }
    if (input.next === "pokemon") {
      return "Next you will generate Pokémon, then apply these abilities to the Pokémon you choose.";
    }
    if (input.next === "move") {
      return "Next you will randomize moves.";
    }
    if (input.next === "item") {
      return "Next you will randomize items.";
    }
    return "The builder is still a placeholder. Selection is saved on this page only for now.";
  }

  if (!input.battlePokemon) {
    return "Select a Pokémon first.";
  }

  if (input.ready) {
    if (input.next === "move") {
      return `Next you will randomize moves for ${input.battlePokemon.displayName}.`;
    }
    if (input.next === "item") {
      return `Next you will randomize items for ${input.battlePokemon.displayName}.`;
    }
    return "The builder is still a placeholder. Selection is saved on this page only for now.";
  }

  if (input.hasPool) {
    return `Select an ability for ${input.battlePokemon.displayName} before continuing.`;
  }

  return `Generate abilities for ${input.battlePokemon.displayName} before continuing.`;
}

function describeMoveContinueHelp(input: {
  beforePokemon: boolean;
  battlePokemon: PokemonForm | undefined;
  ready: boolean;
  hasPool: boolean;
  selectedCount: number;
  movesPerPokemon: number;
  remainingBuilderMoveSlots: number;
  next: RandomizerDestination;
}): string {
  if (input.beforePokemon) {
    if (!input.hasPool) {
      return "Generate a move pool before continuing.";
    }
    if (input.next === "pokemon") {
      return `Next you will generate Pokémon, then apply ${moveCountPhrase(input.movesPerPokemon)} to the Pokémon you choose.${remainingSlotsSentence(input.remainingBuilderMoveSlots)}`;
    }
    if (input.next === "item") {
      return "Next you will randomize items.";
    }
    return "The builder is still a placeholder. Selection is saved on this page only for now.";
  }

  if (!input.battlePokemon) {
    return "Select a Pokémon first.";
  }

  if (input.ready) {
    if (input.next === "item") {
      return `Next you will randomize items for ${input.battlePokemon.displayName}.`;
    }
    return "The builder is still a placeholder. Selection is saved on this page only for now.";
  }

  if (input.hasPool) {
    return `Select four unique moves for ${input.battlePokemon.displayName} before continuing. You have ${input.selectedCount} selected.`;
  }

  return `Generate moves for ${input.battlePokemon.displayName} before continuing.`;
}

function describeItemContinueHelp(input: {
  beforePokemon: boolean;
  battlePokemon: PokemonForm | undefined;
  ready: boolean;
  hasPool: boolean;
  next: RandomizerDestination;
}): string {
  if (input.beforePokemon) {
    if (!input.hasPool) {
      return "Generate an item pool before continuing.";
    }
    if (input.next === "pokemon") {
      return "Next you will generate Pokémon, then apply these items to the Pokémon you choose. None is always a choice.";
    }
    if (input.next === "ability") {
      return "Next you will randomize abilities.";
    }
    if (input.next === "move") {
      return "Next you will randomize moves.";
    }
    return "The builder is still a placeholder. Selection is saved on this page only for now.";
  }

  if (!input.battlePokemon) {
    return "Select a Pokémon first.";
  }

  if (input.ready) {
    if (input.next === "ability") {
      return `Next you will randomize abilities for ${input.battlePokemon.displayName}.`;
    }
    if (input.next === "move") {
      return `Next you will randomize moves for ${input.battlePokemon.displayName}.`;
    }
    return "The builder is still a placeholder. Selection is saved on this page only for now.";
  }

  if (input.hasPool) {
    return `Select an item or None for ${input.battlePokemon.displayName} before continuing.`;
  }

  return `Generate items for ${input.battlePokemon.displayName} before continuing.`;
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
