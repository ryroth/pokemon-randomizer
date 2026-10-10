"use client";

import { useEffect, useMemo, useState } from "react";
import { loadTeamDetails, type TeamDetails } from "@/lib/data/teamTools";
import type { PokemonSet } from "@/lib/types/session";

export type TeamDetailsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; members: Extract<TeamDetails, { ok: true }>["members"]; showdownText: string };

/**
 * Types, moves, and the Showdown paste for a team. It reloads whenever the team changes, so the
 * panels stay in step with the roster.
 */
export function useTeamDetails(sets: readonly PokemonSet[]): TeamDetailsState {
  const key = useMemo(() => JSON.stringify(sets), [sets]);
  const [loaded, setLoaded] = useState<{ key: string; details: TeamDetails } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTeamDetails(JSON.parse(key) as PokemonSet[])
      .then((details) => {
        if (!cancelled) {
          setLoaded({ key, details });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ key, details: { ok: false, message: "The team details could not be loaded." } });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!loaded || loaded.key !== key) {
    return { status: "loading" };
  }
  return loaded.details.ok
    ? { status: "ready", members: loaded.details.members, showdownText: loaded.details.showdownText }
    : { status: "error", message: loaded.details.message };
}
