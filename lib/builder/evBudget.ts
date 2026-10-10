import { MAX_EV_TOTAL } from "@/lib/validation/ev";

/** Share of the 508-point budget in use, from 0 to 100. Over the cap still reads as 100. */
export function evBudgetPercent(total: number): number {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((total / MAX_EV_TOTAL) * 100));
}
