"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FilterDropdown({
  label,
  summary,
  description,
  children,
}: {
  label: string;
  summary: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-border bg-background">
      <summary className="cursor-pointer list-none rounded-xl px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden [&::marker]:content-none">
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
      <div className="space-y-3 border-t border-border px-4 py-4">
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

export function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        checked
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

export function toggleFilterValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
