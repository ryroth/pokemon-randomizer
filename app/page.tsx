import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Configure",
    body: "Pick generations, types, formes, and optional ability, move, and item randomizers.",
  },
  {
    title: "Generate",
    body: "Roll a unique set of Pokémon. If the pool is too small, the app explains why.",
  },
  {
    title: "Build",
    body: "Choose ability, moves, item, EVs, IVs, Nature, Tera type, gender, level, and shiny.",
  },
  {
    title: "Export",
    body: "Open a finished recap card and copy a Pokémon Showdown set.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
      <section className="max-w-2xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Single Pokémon builder
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Pokémon Randomizer
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Generate a unique Pokémon, shape a complete set by hand, then copy it
          straight into Pokémon Showdown. Abilities, moves, and items can be
          randomized or chosen normally. EVs, IVs, Nature, Tera type, gender,
          level, and shiny are always yours to set.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/randomizer" className={cn(buttonVariants({ size: "lg" }))}>
            Start randomizing
          </Link>
          <Link
            href="/builder"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            Preview the builder
          </Link>
        </div>
      </section>

      <section aria-labelledby="flow-heading" className="grid gap-4 sm:grid-cols-2">
        <h2 id="flow-heading" className="sr-only">
          How it works
        </h2>
        {steps.map((step, index) => (
          <Card key={step.title}>
            <CardHeader>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Step {index + 1}
              </p>
              <CardTitle>
                <h3 className="contents">{step.title}</h3>
              </CardTitle>
              <CardDescription>{step.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
