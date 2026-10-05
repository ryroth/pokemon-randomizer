"use client";

import { RouteError } from "@/components/layout/route-error";

export default function BuilderError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      title="Could not load the builder"
      message="The builder could not be loaded. Refresh the page or try again."
      retry={retry}
    />
  );
}
