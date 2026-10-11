"use client";

import { useState } from "react";
import { CircleSlash, Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A still picture of a held item. `iconUrl` comes from the catalog (`npm run import:art`). When an
 * item has no picture, or the picture does not load, a plain item mark stands in so the row never
 * shows a broken image. `iconUrl: undefined` with `none` shows the "holds nothing" mark.
 */
export function ItemIcon({
  iconUrl,
  none = false,
  className,
}: {
  iconUrl: string | null | undefined;
  none?: boolean;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (none) {
    return (
      <span
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground",
          className,
        )}
        aria-hidden="true"
      >
        <CircleSlash className="size-3.5" />
      </span>
    );
  }

  if (!iconUrl || failedUrl === iconUrl) {
    return (
      <span
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-muted-foreground",
          className,
        )}
        aria-hidden="true"
      >
        <Package className="size-3.5" />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-sm bg-white", className)}
      aria-hidden="true"
    >
      {/* Item pictures are small remote files that are not worth optimizing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconUrl}
        alt=""
        width={24}
        height={24}
        className="size-full object-contain"
        onError={() => setFailedUrl(iconUrl)}
      />
    </span>
  );
}
