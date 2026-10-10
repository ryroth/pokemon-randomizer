"use client";

import { useState } from "react";

/**
 * A number box that can be emptied while typing. The stored value always has a default (level 50,
 * happiness 255), so a plain controlled input would snap straight back to it the moment the last
 * digit is deleted. This one keeps what the user typed until they leave the box, saves each
 * complete number as it is typed, and shows the saved value again on leave if the box is empty.
 */
export function NumberInput({
  value,
  min,
  max,
  step,
  onCommit,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: {
  value: number;
  min: number;
  max: number;
  step?: number | "any";
  onCommit: (value: number) => void;
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
      max={max}
      step={step}
      className={className}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      value={text ?? String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        if (raw !== "" && Number.isFinite(Number(raw))) {
          onCommit(Number(raw));
        }
      }}
      onBlur={() => setText(null)}
    />
  );
}
