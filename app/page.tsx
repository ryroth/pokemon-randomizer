import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
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
    title: "Build a Pokémon",
    body: "Roll one Pokémon or open the builder and finish the set by hand, including shiny, types, and base stats.",
    href: "/randomizer",
    label: "Start randomizing",
  },
  {
    title: "Read the rules",
    body: "See what a format allows before you use it, then save a copy if you want to change it.",
    href: "/formats",
    label: "Browse formats",
  },
  {
    title: "Check a hit or play",
    body: "Preview one attack, or play a generation 9 singles battle on one screen. Custom types and base stats stay inside that fight.",
    href: "/battle",
    label: "Open the battle lab",
  },
];

export default function HomePage() {
  return (
    <PageFrame className="gap-12">
      <section className="hero-panel max-w-2xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Build, rules, and a singles battle
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Pokémon Randomizer
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Generate a Pokémon, finish its set, and read the rules before you preview a hit or play
          singles. Shiny, custom types, and custom base stats stay on that Pokémon. A format decides
          whether a battle is allowed to use them.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/randomizer" className={cn(buttonVariants({ size: "lg" }))}>
            Start randomizing
          </Link>
          <Link
            href="/formats"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            Browse formats
          </Link>
        </div>
      </section>

      <section aria-labelledby="flow-heading" className="grid gap-4 sm:grid-cols-3">
        <h2 id="flow-heading" className="sr-only">
          How it works
        </h2>
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle>
                <h3 className="contents">{step.title}</h3>
              </CardTitle>
              <CardDescription>{step.body}</CardDescription>
              <Link href={step.href} className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-fit")}>
                {step.label}
              </Link>
            </CardHeader>
          </Card>
        ))}
      </section>
    </PageFrame>
  );
}
