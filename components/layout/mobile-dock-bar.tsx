"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Hammer, ScrollText, Shuffle, Users } from "lucide-react";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { TeamRoster } from "@/components/teams/team-dock";
import { useTeams } from "@/components/teams/team-provider";
import { TEAM_SIZE } from "@/lib/teams/teams";
import { cn } from "@/lib/utils";

const NAV_ICONS = {
  "/randomizer": Shuffle,
  "/builder": Hammer,
  "/recap": ScrollText,
  "/teams": Users,
} as const;

/**
 * Fixed bottom bar below the desktop breakpoint. Phones get the page links here (the header
 * keeps only the brand). Every size under desktop gets the Team button, which opens the roster
 * in a slide-up sheet.
 */
export function MobileDockBar() {
  const pathname = usePathname();
  const { box } = useTeams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const active = box.teams.find((team) => team.id === box.activeTeamId) ?? null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-stretch">
        <nav aria-label="Primary" className="min-w-0 flex-1 sm:hidden">
          <ul className="grid grid-cols-4">
            {NAV_LINKS.map((link) => {
              const current = pathname === link.href;
              const Icon = NAV_ICONS[link.href];
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
                      current && "bg-muted font-semibold text-foreground underline decoration-2 underline-offset-4",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setOpen(true);
            dialogRef.current?.showModal();
          }}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-l border-border px-3 text-xs font-medium hover:bg-muted sm:flex-row sm:gap-2 sm:text-sm max-sm:max-w-24"
        >
          <Users aria-hidden="true" className="size-5" />
          <span>
            Team{" "}
            <span className="font-mono tabular-nums">
              {active?.sets.length ?? 0}/{TEAM_SIZE}
            </span>
          </span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="team-sheet-heading"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-border bg-card p-4 text-foreground shadow-lg backdrop:bg-black/60 open:animate-in open:slide-in-from-bottom"
      >
        {open ? (
          <TeamRoster
            headingId="team-sheet-heading"
            onClose={() => dialogRef.current?.close()}
          />
        ) : null}
      </dialog>
    </div>
  );
}
