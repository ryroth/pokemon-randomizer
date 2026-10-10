export type { ValidationIssue, ValidationResult } from "@/lib/validation/result";
export { fail, ok } from "@/lib/validation/result";
export { MAX_EV_PER_STAT, MAX_EV_TOTAL, evsCountingBlanksAsZero, maxEvForStat, sumEvs, validateEvs } from "@/lib/validation/ev";
export { MAX_IV, MIN_IV, validateIvs } from "@/lib/validation/iv";
export { validateAbility, validateItem, validateNature } from "@/lib/validation/identity";
export { REQUIRED_MOVE_COUNT, validateMoves } from "@/lib/validation/moves";
export {
  MAX_LEVEL,
  DEFAULT_LEVEL,
  MIN_LEVEL,
  validateGender,
  validateHappiness,
  validateLevel,
  validateNickname,
  validateShiny,
  validateTeraType,
  MIN_HAPPINESS,
  MAX_HAPPINESS,
  DEFAULT_HAPPINESS,
  MAX_NICKNAME_LENGTH,
} from "@/lib/validation/details";
export { validateSet } from "@/lib/validation/set";
