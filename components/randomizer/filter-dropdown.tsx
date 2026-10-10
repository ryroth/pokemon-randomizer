"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { typeColors } from "@/components/type-colors";
import { Button } from "@/components/ui/button";
import type { TeraType } from "@/lib/types/pokemon-type";
import { cn } from "@/lib/utils";

/**
 * A collapsed filter: a title and a one-line summary of what is selected. Opening it shows the
 * chips. Keeping each filter closed until it is needed keeps the page quiet.
 */
export function FilterDropdown({
  label,
  summary,
  description,
  className,
  children,
}: {
  label: string;
  summary: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={cn("group rounded-xl border border-border bg-background", className)}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        role="button"
        aria-expanded={open}
        className="cursor-pointer list-none rounded-xl px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden [&::marker]:content-none"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium">{label}</span>
            <span className="mt-1 block truncate text-sm text-muted-foreground">{summary}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="border-t border-border px-4 py-4">
        <fieldset className="space-y-3">
          <legend className="sr-only">{label}</legend>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          {children}
        </fieldset>
      </div>
    </details>
  );
}

export function FilterToolbar({
  legend,
  onSelectAll,
  onClear,
}: {
  legend: string;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={onSelectAll}>
        Select all {legend}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Clear {legend}
      </Button>
    </div>
  );
}

/**
 * Multi-select chip. A selected chip shows a check mark as well as a fill, so state never depends
 * on color alone. Pass `type` for an elemental chip: a type-colored dot when off, the full type
 * color when on.
 */
export function ToggleChip({
  label,
  checked,
  onChange,
  type,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  type?: TeraType;
}) {
  const colors = type ? typeColors(type) : null;
  return (
    <label
      className={cn(
        "relative inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-2 px-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/60",
        checked
          ? colors
            ? "border-foreground"
            : "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
      style={checked && colors ? { backgroundColor: colors.background, color: colors.color } : undefined}
    >
      {/* The real checkbox covers the whole chip, so pointer and keyboard use the native control. */}
      <input
        type="checkbox"
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        checked={checked}
        onChange={onChange}
      />
      {checked ? (
        <Check aria-hidden="true" className="size-3.5 shrink-0" />
      ) : colors ? (
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colors.background }}
        />
      ) : null}
      <span>{label}</span>
    </label>
  );
}

export function toggleFilterValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
