import learnsets from "@/data/generated/learnsets.json";

/** How a Pokémon learns a move. Transfer-only moves have no method of their own. */
export type LearnMethod = "level-up" | "tm" | "egg" | "tutor";

export const LEARN_METHODS: ReadonlyArray<{ id: LearnMethod; label: string; code: string }> = [
  { id: "level-up", label: "Level-Up", code: "L" },
  { id: "tm", label: "TM", code: "M" },
  { id: "egg", label: "Egg", code: "E" },
  { id: "tutor", label: "Tutor", code: "T" },
];

/** Each entry is `moveId:CODES`, such as `surf:MT`. The importer writes the file. */
const stored = learnsets as Record<string, readonly string[]>;

const parsed = new Map<string, ReadonlyMap<string, string>>();

function learnsetFor(pokemonId: string): ReadonlyMap<string, string> {
  const cached = parsed.get(pokemonId);
  if (cached) {
    return cached;
  }
  const moves = new Map<string, string>();
  for (const entry of stored[pokemonId] ?? []) {
    const split = entry.lastIndexOf(":");
    moves.set(entry.slice(0, split), entry.slice(split + 1));
  }
  parsed.set(pokemonId, moves);
  return moves;
}

/** Standard moves this Pokémon can learn by level-up, egg, TM, tutor, or transfer. */
export function learnsetMoveIds(pokemonId: string): readonly string[] {
  return [...learnsetFor(pokemonId).keys()];
}

/**
 * The same list narrowed to moves learned by any of the chosen methods. An empty choice means
 * no narrowing, so transfer-only moves stay in the full list.
 */
export function learnsetMoveIdsByMethod(
  pokemonId: string,
  methods: readonly LearnMethod[],
): readonly string[] {
  const learnset = learnsetFor(pokemonId);
  if (methods.length === 0) {
    return [...learnset.keys()];
  }
  const codes = LEARN_METHODS.filter((method) => methods.includes(method.id)).map((method) => method.code);
  return [...learnset]
    .filter(([, learned]) => codes.some((code) => learned.includes(code)))
    .map(([moveId]) => moveId);
}

/** The ways this Pokémon learns one move, in menu order. Empty when it only comes by transfer. */
export function learnMethodsForMove(pokemonId: string, moveId: string): readonly LearnMethod[] {
  const learned = learnsetFor(pokemonId).get(moveId) ?? "";
  return LEARN_METHODS.filter((method) => learned.includes(method.code)).map((method) => method.id);
}
