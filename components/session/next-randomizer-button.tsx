"use client";

import { useRouter } from "next/navigation";
import { useRandomizerSession } from "@/components/session/session-provider";
import { Button } from "@/components/ui/button";
import { startNextRandomizer } from "@/lib/randomizer/session";

/** Starts a fresh randomizer run and goes back to the first page. Saved teams are kept. */
export function NextRandomizerButton() {
  const { setSession } = useRandomizerSession();
  const router = useRouter();

  return (
    <Button
      type="button"
      size="lg"
      className="w-fit"
      onClick={() => {
        setSession(startNextRandomizer());
        router.push("/randomizer");
      }}
    >
      Next Randomizer
    </Button>
  );
}
