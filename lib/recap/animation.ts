/**
 * Game rips name the idle clip `model_skeleton|001aidle`. Some viewers label it `Idle`.
 * Prefer that clip, then the first animation the model actually contains.
 */
export function preferredIdleAnimation(names: readonly string[]): string | null {
  const idle = names.find((name) => /a?idle/i.test(name));
  return idle ?? names[0] ?? null;
}
