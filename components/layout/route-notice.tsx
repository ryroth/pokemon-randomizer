import type { ReactNode } from "react";
import { LoadingSprites } from "@/components/layout/loading-sprites";
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
    <PageFrame width={width}>
      <div className="hero-panel flex flex-col gap-4">
        <h1 className="text-h1 font-semibold tracking-tight">{title}</h1>
        <p role={live ? "status" : undefined} className="text-base leading-7 text-muted-foreground">
          {message}
        </p>
        {live ? <LoadingSprites className="mt-2" /> : null}
        {children}
      </div>
    </PageFrame>
  );
}
