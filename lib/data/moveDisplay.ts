/** A fixed base power. 1 is the imported placeholder for damage that is not a set base power. */
export function fixedMovePower(power: number | null): number | null {
  if (power == null || power <= 1) {
    return null;
  }
  return power;
}

export function formatMovePower(power: number | null): string {
  const fixed = fixedMovePower(power);
  return fixed == null ? "No power" : `Power ${fixed}`;
}

export function formatMoveAccuracy(accuracy: number | null): string {
  if (accuracy == null || accuracy <= 0) {
    return "Can't miss";
  }
  return `Accuracy ${accuracy}%`;
}

/** Compact power cell. A move with no fixed base power shows a dash. */
export function formatMoveTablePower(power: number | null): string {
  const fixed = fixedMovePower(power);
  return fixed == null ? "—" : String(fixed);
}

/** Compact accuracy cell. A move that does not check accuracy shows a dash. */
export function formatMoveTableAccuracy(accuracy: number | null): string {
  if (accuracy == null || accuracy <= 0) {
    return "—";
  }
  return `${accuracy}%`;
}

export function formatMoveTablePp(pp: number | null): string {
  return pp == null ? "—" : String(pp);
}
