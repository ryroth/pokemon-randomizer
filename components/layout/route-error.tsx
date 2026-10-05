"use client";

import { RouteNotice } from "@/components/layout/route-notice";
import { Button } from "@/components/ui/button";

export function RouteError({
  title,
  message,
  retry,
}: {
  title: string;
  message: string;
  retry: () => void;
}) {
  return (
    <RouteNotice title={title} message={message}>
      <Button type="button" className="w-fit" onClick={() => retry()}>
        Try again
      </Button>
    </RouteNotice>
  );
}
