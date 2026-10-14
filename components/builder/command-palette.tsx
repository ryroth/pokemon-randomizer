"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { phoneSheetFrame, PHONE_SHEET_QUERY } from "@/components/builder/phone-sheet";
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
 * Pins the phone sheet to the visible viewport. A bottom-anchored dialog collapses its list to
 * the search row, and iOS then scrolls that row above the keyboard, so the choices never appear.
 */
function placePhoneSheet(dialog: HTMLDialogElement) {
  if (!window.matchMedia(PHONE_SHEET_QUERY).matches) {
    dialog.style.top = "";
    dialog.style.bottom = "";
    dialog.style.height = "";
    dialog.style.maxHeight = "";
    return;
  }
  const viewport = window.visualViewport;
  const frame = phoneSheetFrame({
    height: viewport?.height ?? window.innerHeight,
    offsetTop: viewport?.offsetTop ?? 0,
  });
  dialog.style.top = `${frame.top}px`;
  dialog.style.bottom = "auto";
  dialog.style.height = `${frame.height}px`;
  dialog.style.maxHeight = `${frame.height}px`;
}

function clearPhoneSheet(dialog: HTMLDialogElement) {
  dialog.style.top = "";
  dialog.style.bottom = "";
  dialog.style.height = "";
  dialog.style.maxHeight = "";
  dialog.removeAttribute("autofocus");
}

/**
 * Search-and-pick palette in the cmdk style, built on a native modal dialog. Wide screens get a
 * centered panel with the search box focused. Phones get a sheet the height of the visible
 * screen, including the space above the keyboard, and the search box waits for a tap so the
 * choices are on screen first. Up and Down move through the results, Enter chooses, Escape closes.
 */
export function CommandPalette(props: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { open, onClose } = props;
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(PHONE_SHEET_QUERY);
    const update = () => setPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (!open) {
      if (dialog.open) {
        dialog.close();
      }
      clearPhoneSheet(dialog);
      return;
    }

    const narrow = window.matchMedia(PHONE_SHEET_QUERY).matches;
    if (!dialog.open) {
      if (narrow) {
        dialog.tabIndex = -1;
        dialog.setAttribute("autofocus", "");
      } else {
        dialog.removeAttribute("autofocus");
      }
      dialog.showModal();
      if (narrow) {
        dialog.focus({ preventScroll: true });
      }
    }
    placePhoneSheet(dialog);

    const place = () => {
      const current = dialogRef.current;
      if (current) {
        placePhoneSheet(current);
      }
    };
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", place);
    viewport?.addEventListener("scroll", place);
    window.addEventListener("resize", place);
    return () => {
      viewport?.removeEventListener("resize", place);
      viewport?.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={props.title}
      tabIndex={-1}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          dialogRef.current?.close();
        }
      }}
      className={cn(
        "fixed m-auto max-h-[85dvh] max-w-none flex-col overflow-hidden rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-xl outline-none backdrop:bg-black/60 open:flex",
        props.columns ? "w-[min(62rem,calc(100%-2rem))]" : "w-[min(44rem,calc(100%-2rem))]",
        "max-sm:inset-x-0 max-sm:top-0 max-sm:bottom-auto max-sm:m-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:rounded-none max-sm:pb-[env(safe-area-inset-bottom)]",
        "open:animate-in open:fade-in max-sm:open:slide-in-from-bottom",
      )}
    >
      {open ? <PaletteBody {...props} focusSearch={!phone} /> : null}
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
  focusSearch,
}: CommandPaletteProps & { focusSearch: boolean }) {
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
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <input
          role="combobox"
          aria-label={searchLabel}
          aria-expanded="true"
          aria-controls={`${baseId}-list`}
          aria-activedescendant={active ? optionDomId(active.id) : undefined}
          aria-autocomplete="list"
          autoFocus={focusSearch}
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
