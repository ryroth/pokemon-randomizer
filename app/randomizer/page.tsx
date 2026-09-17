import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = {
  title: "Randomizer",
};

export default function RandomizerPage() {
  return (
    <PhasePlaceholder
      title="Configure your roll"
      summary="Choose how many Pokémon to generate, which filters apply, and whether abilities, moves, and items are randomized. Base formes are on by default; Mega Evolutions can be turned on as a form filter."
      nextHref="/builder"
      nextLabel="Continue to builder"
    />
  );
}
