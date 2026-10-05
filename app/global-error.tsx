"use client";

import { RouteError } from "@/components/layout/route-error";
import "./globals.css";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <RouteError
          title="Something went wrong"
          message="The page could not be loaded. Refresh it or try again."
          retry={retry}
        />
      </body>
    </html>
  );
}
