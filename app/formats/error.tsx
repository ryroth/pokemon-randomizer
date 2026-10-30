"use client";

import { RouteError } from "@/components/layout/route-error";

export default function FormatsError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      title="Could not load formats"
      message="The format list could not be loaded. Refresh the page or try again."
      retry={retry}
    />
  );
}
