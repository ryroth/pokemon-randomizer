"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { parseStoredTeams, TEAM_STORAGE_KEY } from "@/lib/teams/storage";
import {
  clearTeam as clearTeamInBox,
  copySetToTeam,
  createEmptyTeamBox,
  importSetsToTeam,
  moveSetToSlot,
  removeSetFromTeam,
  renameTeam,
  replaceSetOnTeam,
  saveSetToActiveTeam,
  saveSetToNewTeam,
  saveSetToNextSlot,
  setActiveTeam,
  type TeamBox,
  type TeamClearResult,
  type TeamImportResult,
  type TeamMoveResult,
  type TeamRemoveResult,
  type TeamRenameResult,
  type TeamSaveResult,
} from "@/lib/teams/teams";
import type { PokemonSet } from "@/lib/types/session";

interface TeamContextValue {
  box: TeamBox;
  ready: boolean;
  chooseTeam: (teamId: string) => void;
  saveToNewTeam: (set: PokemonSet, name?: string) => TeamSaveResult;
  saveToNextSlot: (set: PokemonSet) => TeamSaveResult;
  saveToActiveTeam: (set: PokemonSet, name?: string) => TeamSaveResult;
  rename: (teamId: string, name: string) => TeamRenameResult;
  copyToTeam: (fromTeamId: string, fromIndex: number, toTeamId: string) => TeamSaveResult;
  removeFromTeam: (teamId: string, slotIndex: number) => TeamRemoveResult;
  moveWithinTeam: (teamId: string, fromIndex: number, toIndex: number) => TeamMoveResult;
  clearTeam: (teamId: string) => TeamClearResult;
  replaceSet: (teamId: string, index: number, set: PokemonSet) => TeamSaveResult;
  importSets: (sets: readonly PokemonSet[], target: "active" | "new") => TeamImportResult;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [box, setBox] = useState<TeamBox>(() => createEmptyTeamBox());
  const boxRef = useRef(box);
  const [ready, setReady] = useState(false);

  function commit(next: TeamBox) {
    boxRef.current = next;
    setBox(next);
  }

  useEffect(() => {
    const raw = window.localStorage.getItem(TEAM_STORAGE_KEY);
    const stored = raw ? parseStoredTeams(raw) : createEmptyTeamBox();
    // localStorage is unavailable during SSR. Hydrate once after mount.
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client hydrate */
    boxRef.current = stored;
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
    chooseTeam: (teamId) => commit(setActiveTeam(boxRef.current, teamId)),
    saveToNewTeam: (set, name) => {
      const result = saveSetToNewTeam(boxRef.current, set, name);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    rename: (teamId, name) => {
      const result = renameTeam(boxRef.current, teamId, name);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    copyToTeam: (fromTeamId, fromIndex, toTeamId) => {
      const result = copySetToTeam(boxRef.current, fromTeamId, fromIndex, toTeamId);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    saveToNextSlot: (set) => {
      const result = saveSetToNextSlot(boxRef.current, set);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    saveToActiveTeam: (set, name) => {
      const result = saveSetToActiveTeam(boxRef.current, set, name);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    removeFromTeam: (teamId, slotIndex) => {
      const result = removeSetFromTeam(boxRef.current, teamId, slotIndex);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    moveWithinTeam: (teamId, fromIndex, toIndex) => {
      const result = moveSetToSlot(boxRef.current, teamId, fromIndex, toIndex);
      if (result.ok && fromIndex !== toIndex) {
        commit(result.box);
      }
      return result;
    },
    clearTeam: (teamId) => {
      const result = clearTeamInBox(boxRef.current, teamId);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    replaceSet: (teamId, index, set) => {
      const result = replaceSetOnTeam(boxRef.current, teamId, index, set);
      if (result.ok) {
        commit(result.box);
      }
      return result;
    },
    importSets: (sets, target) => {
      const result = importSetsToTeam(boxRef.current, sets, target);
      if (result.ok) {
        commit(result.box);
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
