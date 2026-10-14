/** Tailwind's `sm` breakpoint minus one pixel. Phones use the full-height picker. */
export const PHONE_SHEET_QUERY = "(max-width: 639px)";

/**
 * Where the phone picker should sit, in layout-viewport pixels.
 * `offsetTop` and `height` come from `visualViewport`, so the sheet stays in the area
 * above the on-screen keyboard instead of stretching behind it.
 */
export function phoneSheetFrame(viewport: { height: number; offsetTop: number }): { top: number; height: number } {
  return {
    top: Math.max(0, Math.round(viewport.offsetTop)),
    height: Math.max(1, Math.round(viewport.height)),
  };
}
