import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhasePlaceholderProps {
  title: string;
  summary: string;
  nextHref: string;
  nextLabel: string;
}

export function PhasePlaceholder({
  title,
  summary,
  nextHref,
  nextLabel,
}: PhasePlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-base leading-7 text-muted-foreground">{summary}</p>
      <p className="rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
        Pokémon data, filters, and randomization land in later phases. This
        route is in place so the product flow is already navigable.
      </p>
      <Link href={nextHref} className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
        {nextLabel}
      </Link>
    </div>
  );
}
