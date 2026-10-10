"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaletteOption {
  id: string;
  /** Plain-text name for the screen reader. */
  label: string;
  selected?: boolean;
  content: ReactNode;
}

export interface PaletteSection {
  id: string;
  label?: string;
  options: readonly PaletteOption[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  title: string;
  searchLabel: string;
  listLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  sections: readonly PaletteSection[];
  onSelect: (optionId: string) => void;
  emptyText: string;
  /** Extra controls under the search box, such as filter chips. */
  toolbar?: ReactNode;
  /**
   * Column headings that stay at the top while the rows scroll. The rows use the same grid, and the
   * list scrolls sideways when the screen is narrower than `minWidth`. Also gives the panel more room.
   */
  columns?: { header: ReactNode; minWidth: string };
}

/**
 * Search-and-pick palette in the cmdk style, built on a native modal dialog. Wide screens get a
 * centered panel and phones get a slide-up sheet. Focus stays in the search box. Up and Down move
 * through the results, Enter chooses, Escape closes.
 */
export function CommandPalette(props: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { open, onClose } = props;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={props.title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          dialogRef.current?.close();
        }
      }}
      className={cn(
        "fixed m-auto max-h-[85dvh] max-w-none flex-col overflow-hidden rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/60 open:flex",
        props.columns ? "w-[min(62rem,calc(100%-2rem))]" : "w-[min(44rem,calc(100%-2rem))]",
        "max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:m-0 max-sm:w-full max-sm:rounded-b-none",
        "open:animate-in open:fade-in max-sm:open:slide-in-from-bottom",
      )}
    >
      {open ? <PaletteBody {...props} /> : null}
    </dialog>
  );
}

function PaletteBody({
  onClose,
  title,
  searchLabel,
  listLabel,
  query,
  onQueryChange,
  sections,
  onSelect,
  emptyText,
  toolbar,
  columns,
}: CommandPaletteProps) {
  const baseId = useId();
  const flat = sections.flatMap((section) => section.options);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, flat.findIndex((option) => option.selected)));
  const clampedIndex = flat.length === 0 ? -1 : Math.min(activeIndex, flat.length - 1);
  const active = clampedIndex === -1 ? undefined : flat[clampedIndex];
  const optionDomId = (id: string) => `${baseId}-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  useEffect(() => {
    if (!active) {
      return;
    }
    document.getElementById(optionDomId(active.id))?.scrollIntoView({ block: "nearest" });
    // optionDomId is derived from baseId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  function move(delta: number) {
    if (flat.length === 0) {
      return;
    }
    setActiveIndex((clampedIndex + delta + flat.length) % flat.length);
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <input
          role="combobox"
          aria-label={searchLabel}
          aria-expanded="true"
          aria-controls={`${baseId}-list`}
          aria-activedescendant={active ? optionDomId(active.id) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder={`${title}…`}
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(-1);
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (active) {
                onSelect(active.id);
              }
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {toolbar ? <div className="border-b border-border px-3 py-2">{toolbar}</div> : null}
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
      <div style={columns ? { minWidth: columns.minWidth } : undefined}>
      {columns ? (
        <div className="sticky top-0 z-20 border-b border-border bg-muted px-3 py-1.5">{columns.header}</div>
      ) : null}
      <div id={`${baseId}-list`} role="listbox" aria-label={listLabel}>
        {flat.length === 0 ? (
          <p role="presentation" className="px-3 py-4 text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : null}
        {sections.map((section) => (
          <div key={section.id} role="group" aria-label={section.label}>
            {section.label ? (
              <div
                aria-hidden="true"
                className="sticky top-0 z-10 border-y border-foreground bg-foreground px-3 py-1.5 text-sm font-bold tracking-wide text-background uppercase"
              >
                {section.label}
              </div>
            ) : null}
            {section.options.map((option) => {
              const isActive = option.id === active?.id;
              return (
                <div
                  key={option.id}
                  id={optionDomId(option.id)}
                  role="option"
                  aria-selected={option.selected === true}
                  aria-label={option.label}
                  className={cn(
                    "cursor-pointer border-b border-border/70 px-3 py-2 text-sm last:border-b-0",
                    option.selected && "bg-primary/15",
                    isActive && "bg-muted outline-2 -outline-offset-2 outline-ring",
                  )}
                  onMouseMove={() => {
                    const index = flat.findIndex((entry) => entry.id === option.id);
                    if (index !== -1 && index !== clampedIndex) {
                      setActiveIndex(index);
                    }
                  }}
                  onClick={() => onSelect(option.id)}
                >
                  {option.content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
      </div>
      <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground max-sm:hidden">
        Up and Down move, Enter chooses, Escape closes.
      </p>
    </>
  );
}
