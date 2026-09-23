"use client";

import { Button } from "@/components/ui/button";

export default function RandomizerError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Could not load the randomizer</h1>
      <p className="text-base leading-7 text-muted-foreground">
        Pokémon data could not be loaded. Refresh the page or try again.
      </p>
      <Button type="button" className="w-fit" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
