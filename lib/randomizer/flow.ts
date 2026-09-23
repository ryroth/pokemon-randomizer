import { TYPICAL_RANDOMIZER_ORDER } from "@/lib/randomizer/defaults";
import type { PokemonForm } from "@/lib/types/pokemon";
import type { RandomizerConfig, RandomizerTab } from "@/lib/types/randomizer";
import type { RandomizerSession } from "@/lib/types/session";

export type RandomizerDestination = RandomizerTab | "builder";

const ALL_TABS: RandomizerTab[] = [...TYPICAL_RANDOMIZER_ORDER];
const IMPLEMENTED_TABS: ReadonlySet<RandomizerTab> = new Set([
  "pokemon",
  "ability",
  "move",
  "item",
]);

export function isImplementedRandomizerTab(tab: RandomizerTab): boolean {
  return IMPLEMENTED_TABS.has(tab);
}

export function normalizeRandomizerOrder(order: readonly RandomizerTab[]): RandomizerTab[] {
  const seen = new Set<RandomizerTab>();
  const next: RandomizerTab[] = [];

  for (const tab of order) {
    if (!ALL_TABS.includes(tab) || seen.has(tab)) {
      continue;
    }
    seen.add(tab);
    next.push(tab);
  }

  for (const tab of ALL_TABS) {
    if (!seen.has(tab)) {
      next.push(tab);
    }
  }

  return next;
}

export function isOptionalRandomizerEnabled(
  config: RandomizerConfig,
  tab: Exclude<RandomizerTab, "pokemon">,
): boolean {
  switch (tab) {
    case "ability":
      return config.randomizeAbilities;
    case "move":
      return config.randomizeMoves;
    case "item":
      return config.randomizeItems;
  }
}

export function enabledRandomizerSteps(config: RandomizerConfig): RandomizerTab[] {
  return normalizeRandomizerOrder(config.randomizerOrder).filter((tab) => {
    if (tab === "pokemon") {
      return true;
    }
    return isOptionalRandomizerEnabled(config, tab);
  });
}

export function visibleRandomizerTabs(config: RandomizerConfig): RandomizerTab[] {
  return enabledRandomizerSteps(config).filter(isImplementedRandomizerTab);
}

export function firstOpenRandomizerTab(config: RandomizerConfig): RandomizerTab {
  return visibleRandomizerTabs(config)[0] ?? "pokemon";
}

export function isExtraBeforePokemon(
  config: RandomizerConfig,
  tab: Exclude<RandomizerTab, "pokemon">,
): boolean {
  const order = normalizeRandomizerOrder(config.randomizerOrder);
  return order.indexOf(tab) < order.indexOf("pokemon");
}

export function nextRandomizerDestination(
  config: RandomizerConfig,
  from: RandomizerTab,
): RandomizerDestination {
  const enabled = enabledRandomizerSteps(config);
  const start = enabled.indexOf(from);
  const rest = start === -1 ? enabled : enabled.slice(start + 1);
  return rest[0] ?? "builder";
}

export function nextOpenDestination(
  config: RandomizerConfig,
  from: RandomizerTab,
): RandomizerDestination {
  let current: RandomizerTab = from;
  for (let index = 0; index < ALL_TABS.length + 1; index += 1) {
    const next = nextRandomizerDestination(config, current);
    if (next === "builder" || isImplementedRandomizerTab(next)) {
      return next;
    }
    current = next;
  }
  return "builder";
}

export function previousOpenDestination(
  config: RandomizerConfig,
  from: RandomizerTab,
): RandomizerTab | undefined {
  const visible = visibleRandomizerTabs(config);
  const index = visible.indexOf(from);
  if (index <= 0) {
    return undefined;
  }
  return visible[index - 1];
}

export function canOpenRandomizerTab(
  session: RandomizerSession,
  tab: RandomizerTab,
): boolean {
  if (!visibleRandomizerTabs(session.config).includes(tab)) {
    return false;
  }
  if (tab === "pokemon") {
    return true;
  }
  if (isExtraBeforePokemon(session.config, tab)) {
    return true;
  }
  return Boolean(session.selectedPokemonId);
}

export function reorderRandomizerSteps(
  order: readonly RandomizerTab[],
  fromIndex: number,
  toIndex: number,
): RandomizerTab[] {
  const next = normalizeRandomizerOrder(order);
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= next.length ||
    toIndex >= next.length
  ) {
    return next;
  }

  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) {
    return next;
  }

  next.splice(toIndex, 0, moved);
  return next;
}

export function moveRandomizerStep(
  order: readonly RandomizerTab[],
  tab: RandomizerTab,
  direction: -1 | 1,
): RandomizerTab[] {
  const next = normalizeRandomizerOrder(order);
  const index = next.indexOf(tab);
  if (index === -1) {
    return next;
  }

  return reorderRandomizerSteps(next, index, index + direction);
}

/**
 * Abilities the builder should offer. Randomized runs use the rolled options.
 * Skipped ability randomization uses the battle Pokémon's usual ability ids.
 */
export function builderAbilityPool(
  form: PokemonForm,
  session: RandomizerSession,
): string[] {
  if (session.config.randomizeAbilities) {
    return [...session.abilityOptions];
  }
  return [...form.abilityIds];
}
