"use client";

import { RouteError } from "@/components/layout/route-error";

export default function BattleError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      title="Could not load the battle lab"
      message="The battle lab could not be loaded. Refresh the page or try again."
      retry={retry}
    />
  );
}
