import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = {
  title: "Recap",
};

export default function RecapPage() {
  return (
    <PhasePlaceholder
      title="Pokémon recap"
      summary="A finished set will appear here as a recap card, with a Copy to Showdown button that copies only the compatible set text — including Tera type, gender, level, and shiny when they belong in the export."
      nextHref="/"
      nextLabel="Back to home"
    />
  );
}
