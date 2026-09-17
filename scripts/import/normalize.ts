import { classifyFormType } from "../../lib/data/classify";
import type { FormType } from "../../lib/types/taxonomy";

export interface NormalizeFormInput {
  slug: string;
  formName?: string;
  isMega?: boolean;
}

export function normalizeFormType(input: NormalizeFormInput): FormType {
  return classifyFormType(input);
}
