"use client";

import { RouteError } from "@/components/layout/route-error";

export default function RootError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      title="Something went wrong"
      message="The page could not be loaded. Refresh it or try again."
      retry={retry}
    />
  );
}
