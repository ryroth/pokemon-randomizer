import { ivPresetById } from "@/lib/builder/ivPresets";
import { battlePokemonId } from "@/lib/randomizer/session";
import {
  abilityLockedByRandomizer,
  itemLockedByRandomizer,
  moveSlotLockedByRandomizer,
} from "@/lib/builder/locks";
import type { Nature } from "@/lib/types/catalog-entities";
import type { PokemonForm } from "@/lib/types/pokemon";
import { TERA_TYPES, type TeraType } from "@/lib/types/pokemon-type";
import type { PokemonSetDraft, RandomizerSession } from "@/lib/types/session";
import { PERFECT_IVS, STAT_IDS, type StatId, type StatSpread } from "@/lib/types/stats";
import type { Gender, GenderRule } from "@/lib/types/taxonomy";
import {
  DEFAULT_HAPPINESS,
  DEFAULT_LEVEL,
  MAX_HAPPINESS,
  MAX_NICKNAME_LENGTH,
  MIN_HAPPINESS,
} from "@/lib/validation/details";
import { evsCountingBlanksAsZero, maxEvForStat, validateEvs } from "@/lib/validation/ev";
import { REQUIRED_MOVE_COUNT } from "@/lib/validation/moves";
import { validateSet } from "@/lib/validation/set";

function padMoves(slots: readonly (string | undefined)[] | undefined): Array<string | undefined> {
  return Array.from({ length: REQUIRED_MOVE_COUNT }, (_, index) => slots?.[index]);
}

function replaceDraft(
  session: RandomizerSession,
  draft: Partial<PokemonSetDraft>,
): RandomizerSession {
  return {
    ...session,
    finalizedSet: undefined,
    draft: {
      ...session.draft,
      ...draft,
      moveIds: padMoves(draft.moveIds ?? session.draft.moveIds),
    },
  };
}

export function openBuilder(session: RandomizerSession): RandomizerSession {
  const pokemonId = battlePokemonId(session);
  if (!pokemonId) {
    return session;
  }

  return applyBuilderDefaults({
    ...session,
    step: "builder",
    draft: {
      ...session.draft,
      pokemonId,
      moveIds: padMoves(session.draft.moveIds),
    },
  });
}

/**
 * IVs start at 31, happiness at 255, level at 50, and shiny at No. Existing choices are kept.
 * Tera type and gender have no default: the builder shows them unselected.
 */
export function applyBuilderDefaults(session: RandomizerSession): RandomizerSession {
  const ivs = ivsDefaultingTo31(session.draft.ivs);
  const happiness = session.draft.happiness ?? DEFAULT_HAPPINESS;
  const level = session.draft.level ?? DEFAULT_LEVEL;
  const shiny = session.draft.shiny ?? false;
  const ivsAlreadySet = STAT_IDS.every((stat) => session.draft.ivs?.[stat] === ivs[stat]);
  if (
    ivsAlreadySet &&
    session.draft.happiness === happiness &&
    session.draft.level === level &&
    session.draft.shiny === shiny
  ) {
    return session;
  }

  return {
    ...session,
    draft: {
      ...session.draft,
      ivs,
      happiness,
      level,
      shiny,
      moveIds: padMoves(session.draft.moveIds),
    },
  };
}

function ivsDefaultingTo31(ivs: Partial<StatSpread> | undefined): StatSpread {
  return {
    hp: ivs?.hp ?? PERFECT_IVS.hp,
    atk: ivs?.atk ?? PERFECT_IVS.atk,
    def: ivs?.def ?? PERFECT_IVS.def,
    spa: ivs?.spa ?? PERFECT_IVS.spa,
    spd: ivs?.spd ?? PERFECT_IVS.spd,
    spe: ivs?.spe ?? PERFECT_IVS.spe,
  };
}

export function setDraftAbility(
  session: RandomizerSession,
  abilityId: string | undefined,
  pool: readonly string[],
): RandomizerSession {
  if (abilityLockedByRandomizer(session)) {
    return session;
  }
  if (abilityId !== undefined && !pool.includes(abilityId)) {
    return session;
  }
  return replaceDraft(session, { abilityId });
}

export function setDraftMove(
  session: RandomizerSession,
  slot: number,
  moveId: string | undefined,
  pool: readonly string[],
): RandomizerSession {
  if (slot < 0 || slot >= REQUIRED_MOVE_COUNT) {
    return session;
  }
  if (moveSlotLockedByRandomizer(session, slot)) {
    return session;
  }
  if (moveId !== undefined && !pool.includes(moveId)) {
    return session;
  }

  const moveIds = padMoves(session.draft.moveIds);
  if (moveId && moveIds.some((id, index) => index !== slot && id === moveId)) {
    return session;
  }
  moveIds[slot] = moveId;
  return replaceDraft(session, { moveIds });
}

export function setDraftItem(
  session: RandomizerSession,
  itemId: string | null | undefined,
  pool: readonly (string | null)[],
): RandomizerSession {
  if (itemLockedByRandomizer(session)) {
    return session;
  }
  if (itemId !== undefined && !pool.includes(itemId)) {
    return session;
  }
  return replaceDraft(session, { itemId });
}

export function setDraftEv(
  session: RandomizerSession,
  stat: StatId,
  value: number | undefined,
): RandomizerSession {
  if (value !== undefined && !Number.isInteger(value)) {
    return session;
  }

  const evs: Partial<StatSpread> = { ...session.draft.evs };
  if (value === undefined) {
    delete evs[stat];
  } else {
    const cap = maxEvForStat(session.draft.evs, stat);
    evs[stat] = Math.min(Math.max(0, value), cap);
  }
  return replaceDraft(session, { evs });
}

/** Fills every IV from a spread in the Showdown "IV spreads" menu. EVs are not touched. */
export function applyDraftIvPreset(session: RandomizerSession, presetId: string): RandomizerSession {
  const preset = ivPresetById(presetId);
  if (!preset) {
    return session;
  }
  return replaceDraft(session, { ivs: { ...preset.ivs } });
}

/** Back to blank EV slots, which count as 0. */
export function clearDraftEvs(session: RandomizerSession): RandomizerSession {
  return replaceDraft(session, { evs: undefined });
}

export function applySuggestedEvs(
  session: RandomizerSession,
  evs: Partial<StatSpread>,
  natureName: string | undefined,
  natures: readonly Nature[],
): RandomizerSession {
  if (!isLegalEvSpread(evs)) {
    return session;
  }
  const natureId = natureIdForSuggestion(natureName, natures);
  return replaceDraft(session, {
    evs,
    ...(natureId ? { natureId } : {}),
  });
}

function natureIdForSuggestion(
  natureName: string | undefined,
  natures: readonly Nature[],
): string | undefined {
  const needle = natureName?.trim().toLowerCase();
  if (!needle) {
    return undefined;
  }
  return natures.find(
    (nature) =>
      nature.id.toLowerCase() === needle ||
      nature.showdownName.toLowerCase() === needle ||
      nature.name.toLowerCase() === needle,
  )?.id;
}

export function isLegalEvSpread(evs: Partial<StatSpread> | undefined): boolean {
  return validateEvs(evsCountingBlanksAsZero(evs)).ok;
}

export function setDraftIv(
  session: RandomizerSession,
  stat: StatId,
  value: number | undefined,
): RandomizerSession {
  if (value !== undefined && !Number.isInteger(value)) {
    return session;
  }

  const ivs: Partial<StatSpread> = { ...session.draft.ivs };
  if (value === undefined) {
    delete ivs[stat];
  } else {
    ivs[stat] = value;
  }
  return replaceDraft(session, { ivs });
}

export function setDraftNickname(
  session: RandomizerSession,
  nickname: string | undefined,
): RandomizerSession {
  if (nickname === undefined || nickname.length === 0) {
    return replaceDraft(session, { nickname: undefined });
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return session;
  }
  return replaceDraft(session, { nickname });
}

export function setDraftHappiness(
  session: RandomizerSession,
  happiness: number | undefined,
): RandomizerSession {
  if (
    happiness !== undefined &&
    (!Number.isInteger(happiness) || happiness < MIN_HAPPINESS || happiness > MAX_HAPPINESS)
  ) {
    return session;
  }
  return replaceDraft(session, { happiness });
}

export function setDraftNature(
  session: RandomizerSession,
  natureId: string | undefined,
  natures: readonly Nature[],
): RandomizerSession {
  if (natureId !== undefined && !natures.some((nature) => nature.id === natureId)) {
    return session;
  }
  return replaceDraft(session, { natureId });
}

export function setDraftTeraType(
  session: RandomizerSession,
  teraType: TeraType | undefined,
): RandomizerSession {
  if (teraType !== undefined && !TERA_TYPES.includes(teraType)) {
    return session;
  }
  return replaceDraft(session, { teraType });
}

export function setDraftGender(
  session: RandomizerSession,
  gender: Gender | undefined,
  genderRule: GenderRule,
): RandomizerSession {
  if (genderRule !== "mixed") {
    return session;
  }
  if (gender !== undefined && gender !== "M" && gender !== "F") {
    return session;
  }
  return replaceDraft(session, { gender });
}

export function setDraftLevel(
  session: RandomizerSession,
  level: number | undefined,
): RandomizerSession {
  if (level !== undefined && !Number.isInteger(level)) {
    return session;
  }
  return replaceDraft(session, { level });
}

export function setDraftShiny(
  session: RandomizerSession,
  shiny: boolean | undefined,
): RandomizerSession {
  return replaceDraft(session, { shiny });
}

export function finalizeBuilderSet(
  session: RandomizerSession,
  pokemon: PokemonForm | undefined,
): RandomizerSession {
  const result = validateSet(session.draft, pokemon);
  if (!result.ok) {
    return { ...session, finalizedSet: undefined };
  }
  return { ...session, step: "recap", finalizedSet: result.value };
}

export function isCompleteSpread(spread: Partial<StatSpread> | undefined): spread is StatSpread {
  return Boolean(spread && STAT_IDS.every((stat) => typeof spread[stat] === "number"));
}
