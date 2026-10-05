import Link from "next/link";

const links = [
  { href: "/randomizer", label: "Randomizer" },
  { href: "/builder", label: "Builder" },
  { href: "/recap", label: "Recap" },
  { href: "/teams", label: "Teams" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight sm:text-base">
          Pokémon Randomizer
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
