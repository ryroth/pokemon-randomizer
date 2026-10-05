import type { Metadata } from "next";
import Link from "next/link";
import { RouteNotice } from "@/components/layout/route-notice";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <RouteNotice title="Page not found" message="That page is not part of the randomizer.">
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "w-fit")}>
        Back to the start
      </Link>
    </RouteNotice>
  );
}
