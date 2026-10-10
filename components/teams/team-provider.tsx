"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { parseStoredTeams, TEAM_STORAGE_KEY } from "@/lib/teams/storage";
import {
  clearTeam as clearTeamInBox,
  createEmptyTeamBox,
  importSetsToTeam,
  moveSetToSlot,
  removeSetFromTeam,
  saveSetToNewTeam,
  saveSetToNextSlot,
  setActiveTeam,
  type TeamBox,
  type TeamClearResult,
  type TeamImportResult,
  type TeamMoveResult,
  type TeamRemoveResult,
  type TeamSaveResult,
} from "@/lib/teams/teams";
import type { PokemonSet } from "@/lib/types/session";

interface TeamContextValue {
  box: TeamBox;
  ready: boolean;
  chooseTeam: (teamId: string) => void;
  saveToNewTeam: (set: PokemonSet) => TeamSaveResult;
  saveToNextSlot: (set: PokemonSet) => TeamSaveResult;
  removeFromTeam: (teamId: string, slotIndex: number) => TeamRemoveResult;
  moveWithinTeam: (teamId: string, fromIndex: number, toIndex: number) => TeamMoveResult;
  clearTeam: (teamId: string) => TeamClearResult;
  importSets: (sets: readonly PokemonSet[], target: "active" | "new") => TeamImportResult;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [box, setBox] = useState<TeamBox>(() => createEmptyTeamBox());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(TEAM_STORAGE_KEY);
    const stored = raw ? parseStoredTeams(raw) : createEmptyTeamBox();
    // localStorage is unavailable during SSR. Hydrate once after mount.
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client hydrate */
    setBox(stored);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(box));
  }, [box, ready]);

  const value: TeamContextValue = {
    box,
    ready,
    chooseTeam: (teamId) => setBox(setActiveTeam(box, teamId)),
    saveToNewTeam: (set) => {
      const result = saveSetToNewTeam(box, set);
      if (result.ok) {
        setBox(result.box);
      }
      return result;
    },
    saveToNextSlot: (set) => {
      const result = saveSetToNextSlot(box, set);
      if (result.ok) {
        setBox(result.box);
      }
      return result;
    },
    removeFromTeam: (teamId, slotIndex) => {
      const result = removeSetFromTeam(box, teamId, slotIndex);
      if (result.ok) {
        setBox(result.box);
      }
      return result;
    },
    moveWithinTeam: (teamId, fromIndex, toIndex) => {
      const result = moveSetToSlot(box, teamId, fromIndex, toIndex);
      if (result.ok && fromIndex !== toIndex) {
        setBox(result.box);
      }
      return result;
    },
    clearTeam: (teamId) => {
      const result = clearTeamInBox(box, teamId);
      if (result.ok) {
        setBox(result.box);
      }
      return result;
    },
    importSets: (sets, target) => {
      const result = importSetsToTeam(box, sets, target);
      if (result.ok) {
        setBox(result.box);
      }
      return result;
    },
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeams(): TeamContextValue {
  const value = useContext(TeamContext);
  if (!value) {
    throw new Error("useTeams must be used within TeamProvider");
  }
  return value;
}
