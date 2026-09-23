export function formatMovePower(power: number | null): string {
  return power == null ? "No power" : `Power ${power}`;
}

export function formatMoveAccuracy(accuracy: number | null): string {
  if (accuracy == null || accuracy <= 0) {
    return "Can't miss";
  }
  return `Accuracy ${accuracy}%`;
}
