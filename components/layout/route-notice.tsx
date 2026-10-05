import type { ReactNode } from "react";
import { PageFrame } from "@/components/layout/page-frame";

export function RouteNotice({
  title,
  message,
  live = false,
  width = "narrow",
  children,
}: {
  title: string;
  message: string;
  live?: boolean;
  width?: "narrow" | "builder" | "page" | "wide";
  children?: ReactNode;
}) {
  return (
    <PageFrame width={width} className="gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p role={live ? "status" : undefined} className="text-base leading-7 text-muted-foreground">
        {message}
      </p>
      {children}
    </PageFrame>
  );
}
