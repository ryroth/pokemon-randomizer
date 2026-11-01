"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { useRandomizerSession } from "@/components/session/session-provider";
import { startNextRandomizer } from "@/lib/randomizer/session";

/** Opens the randomizer from the home page on a fresh default session. Saved teams stay. */
export function StartRandomizingLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { setSession } = useRandomizerSession();

  return (
    <Link
      href="/randomizer"
      className={className}
      onClick={() => setSession(startNextRandomizer())}
    >
      {children}
    </Link>
  );
}
