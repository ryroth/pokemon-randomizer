"use client";

import { RouteError } from "@/components/layout/route-error";

export default function TeamsError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      title="Could not load teams"
      message="Saved teams could not be loaded. Refresh the page or try again."
      retry={retry}
    />
  );
}
