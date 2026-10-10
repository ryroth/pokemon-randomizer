"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";

/** Brand on every screen. The links sit here from the small breakpoint up; phones use the bottom bar. */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3 px-[var(--space-page-x)] py-3 sm:py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight sm:text-base">
          Pokémon Randomizer
        </Link>
        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex flex-wrap items-center gap-1">
            {NAV_LINKS.map((link) => {
              const current = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center justify-center rounded-md px-3 text-center text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                      current &&
                        "bg-muted font-semibold text-foreground underline decoration-2 underline-offset-4",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
