import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const widths = {
  narrow: "max-w-3xl",
  builder: "max-w-4xl",
  page: "max-w-5xl",
  wide: "max-w-6xl",
} as const;

export function PageFrame({
  children,
  width = "page",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof widths;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col gap-8 px-[var(--space-page-x)] py-10 sm:py-14",
        widths[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
