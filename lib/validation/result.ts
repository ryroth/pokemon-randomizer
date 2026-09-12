export interface ValidationIssue {
  code: string;
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationIssue[] };

export function fail(errors: ValidationIssue[]): ValidationResult<never> {
  return { ok: false, errors };
}

export function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}
