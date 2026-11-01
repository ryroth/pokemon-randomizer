"use client";

import { useState } from "react";

/**
 * A number box that can stay empty. Empty means that side of a range is unused.
 * A complete number is saved as it is typed. Leaving an incomplete box restores the saved value.
 */
export function OptionalNumberInput({
  value,
  min,
  step,
  onCommit,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: {
  value: number | null;
  min?: number;
  step?: number | "any";
  onCommit: (value: number | null) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  return (
    <input
      id={id}
      type="number"
      inputMode={step === undefined || step === 1 ? "numeric" : "decimal"}
      min={min}
      step={step}
      className={className}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      value={text ?? (value === null ? "" : String(value))}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        if (raw === "") {
          onCommit(null);
          return;
        }
        if (Number.isFinite(Number(raw))) {
          onCommit(Number(raw));
        }
      }}
      onBlur={() => setText(null)}
    />
  );
}
