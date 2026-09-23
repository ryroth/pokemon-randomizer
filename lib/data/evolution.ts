import type { PokemonForm } from "@/lib/types/pokemon";
import type { EvolutionStage, FormType } from "@/lib/types/taxonomy";

const BATTLE_EVOLUTION_EXCLUDED_FORM_TYPES: ReadonlySet<FormType> = new Set([
  "mega",
  "primal",
  "gmax",
]);

const STAGE_RANK: Record<EvolutionStage, number> = {
  basic: 0,
  stage1: 1,
  stage2: 2,
};

export function isBattleEvolutionForm(form: PokemonForm): boolean {
  return !BATTLE_EVOLUTION_EXCLUDED_FORM_TYPES.has(form.formType);
}

export function collectEvolutionTargetIds(
  startId: string,
  evosById: ReadonlyMap<string, readonly string[]>,
  formById: ReadonlyMap<string, PokemonForm>,
): string[] {
  const collected: PokemonForm[] = [];
  const seen = new Set<string>([startId]);
  const queue = [...(evosById.get(startId) ?? [])];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    queue.push(...(evosById.get(id) ?? []));

    const form = formById.get(id);
    if (!form || !isBattleEvolutionForm(form)) {
      continue;
    }

    collected.push(form);
  }

  return sortEvolutionTargets(collected).map((form) => form.id);
}

export function evolutionChoices(
  selected: PokemonForm,
  formById: ReadonlyMap<string, PokemonForm>,
): PokemonForm[] {
  return (selected.evolutionTargetIds ?? []).flatMap((id) => {
    const form = formById.get(id);
    return form ? [form] : [];
  });
}

export function isValidBattlePokemonId(selected: PokemonForm, battlePokemonId: string): boolean {
  return (
    battlePokemonId === selected.id ||
    (selected.evolutionTargetIds ?? []).includes(battlePokemonId)
  );
}

export interface EvolutionConflictContext {
  splitSiblings: ReadonlyMap<string, ReadonlySet<string>>;
}

export function evolutionConflictContext(
  pokemon: readonly PokemonForm[],
): EvolutionConflictContext {
  const splitSiblings = new Map<string, Set<string>>();

  function addSibling(left: string, right: string): void {
    if (left === right) {
      return;
    }

    const siblings = splitSiblings.get(left) ?? new Set<string>();
    siblings.add(right);
    splitSiblings.set(left, siblings);
  }

  for (const form of pokemon) {
    const targets = form.evolutionTargetIds ?? [];
    for (let leftIndex = 0; leftIndex < targets.length; leftIndex += 1) {
      const left = targets[leftIndex];
      if (!left) {
        continue;
      }

      for (let rightIndex = leftIndex + 1; rightIndex < targets.length; rightIndex += 1) {
        const right = targets[rightIndex];
        if (!right) {
          continue;
        }

        addSibling(left, right);
        addSibling(right, left);
      }
    }
  }

  return { splitSiblings };
}

export function evolutionFormsConflict(
  left: PokemonForm,
  right: PokemonForm,
  context: EvolutionConflictContext,
): boolean {
  if (left.id === right.id) {
    return true;
  }

  if ((left.evolutionTargetIds ?? []).includes(right.id)) {
    return true;
  }

  if ((right.evolutionTargetIds ?? []).includes(left.id)) {
    return true;
  }

  if (left.speciesId !== right.speciesId) {
    return false;
  }

  return !context.splitSiblings.get(left.id)?.has(right.id);
}

export function maximumCompatiblePokemonCount(
  forms: readonly PokemonForm[],
  context: EvolutionConflictContext,
): number {
  if (forms.length === 0) {
    return 0;
  }

  const parent = new Map<string, string>();
  for (const form of forms) {
    parent.set(form.id, form.id);
  }

  function find(id: string): string {
    const current = parent.get(id) ?? id;
    if (current === id) {
      return id;
    }

    const root = find(current);
    parent.set(id, root);
    return root;
  }

  function union(left: string, right: string): void {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) {
      return;
    }

    if (leftRoot < rightRoot) {
      parent.set(rightRoot, leftRoot);
      return;
    }

    parent.set(leftRoot, rightRoot);
  }

  const formsBySpecies = new Map<string, PokemonForm[]>();
  for (const form of forms) {
    const speciesForms = formsBySpecies.get(form.speciesId) ?? [];
    speciesForms.push(form);
    formsBySpecies.set(form.speciesId, speciesForms);
  }

  for (const speciesForms of formsBySpecies.values()) {
    for (let leftIndex = 0; leftIndex < speciesForms.length; leftIndex += 1) {
      const left = speciesForms[leftIndex];
      if (!left) {
        continue;
      }

      for (let rightIndex = leftIndex + 1; rightIndex < speciesForms.length; rightIndex += 1) {
        const right = speciesForms[rightIndex];
        if (!right) {
          continue;
        }

        if (evolutionFormsConflict(left, right, context)) {
          union(left.id, right.id);
        }
      }
    }
  }

  const inPool = new Set(forms.map((form) => form.id));
  const groupsWithDescendants = new Set<string>();
  for (const form of forms) {
    const group = find(form.id);
    for (const targetId of form.evolutionTargetIds ?? []) {
      if (!inPool.has(targetId)) {
        continue;
      }

      if (find(targetId) !== group) {
        groupsWithDescendants.add(group);
        break;
      }
    }
  }

  const groups = new Set(forms.map((form) => find(form.id)));
  let compatibleCount = 0;
  for (const group of groups) {
    if (!groupsWithDescendants.has(group)) {
      compatibleCount += 1;
    }
  }

  return compatibleCount;
}

export function sortEvolutionTargets(forms: readonly PokemonForm[]): PokemonForm[] {
  return [...forms].sort((left, right) => {
    const stageDelta = STAGE_RANK[left.evolutionStage] - STAGE_RANK[right.evolutionStage];
    if (stageDelta !== 0) {
      return stageDelta;
    }

    const dexDelta = left.nationalDexNumber - right.nationalDexNumber;
    if (dexDelta !== 0) {
      return dexDelta;
    }

    return left.displayName.localeCompare(right.displayName);
  });
}
