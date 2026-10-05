"use client";

import { RouteError } from "@/components/layout/route-error";

export default function RecapError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      title="Could not load the recap"
      message="The recap could not be loaded. Refresh the page or try again."
      retry={retry}
    />
  );
}
