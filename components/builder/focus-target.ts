const FOCUSABLE = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]";

/**
 * Scrolls to a part of the builder (for example `ability` or `move-2`) and puts keyboard focus on
 * its first control. If that part has no control, which happens when the randomizer locked it, the
 * part itself takes focus so a screen reader still lands there. An unknown id does nothing.
 */
export function focusBuilderTarget(id: string): void {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  const control = target.matches(FOCUSABLE) ? target : target.querySelector<HTMLElement>(FOCUSABLE);
  (control ?? target).focus({ preventScroll: true });
}
