"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/randomizer", label: "Randomizer" },
  { href: "/builder", label: "Builder" },
  { href: "/recap", label: "Recap" },
  { href: "/teams", label: "Teams" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight sm:text-base">
          Pokémon Randomizer
        </Link>
        <nav aria-label="Primary">
          <ul className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:items-center">
            {links.map((link) => {
              const current = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center justify-center rounded-md px-3 text-center text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:min-h-10",
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
