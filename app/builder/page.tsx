import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = {
  title: "Builder",
};

export default function BuilderPage() {
  return (
    <PhasePlaceholder
      title="Build the set"
      summary="After you pick a Pokémon, you will choose ability, four moves, an item, EVs, IVs, Nature, Tera type, gender, level, and shiny. Nothing in that list is filled in automatically."
      nextHref="/recap"
      nextLabel="Continue to recap"
    />
  );
}
