"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { applyBuilderDefaults } from "@/lib/builder";
import { battlePokemonId, createInitialSession } from "@/lib/randomizer/session";
import { parseStoredSession, RANDOMIZER_SESSION_STORAGE_KEY } from "@/lib/session/storage";
import type { RandomizerSession } from "@/lib/types/session";

interface RandomizerSessionContextValue {
  session: RandomizerSession;
  setSession: (session: RandomizerSession) => void;
  ready: boolean;
}

const RandomizerSessionContext = createContext<RandomizerSessionContextValue | null>(null);

export function RandomizerSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<RandomizerSession>(() => createInitialSession());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(RANDOMIZER_SESSION_STORAGE_KEY);
    const stored = raw ? parseStoredSession(raw) : null;
    // sessionStorage is unavailable during SSR. Hydrate once after mount so the
    // server and client both render the loading state first.
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client hydrate */
    setSessionState(stored ?? createInitialSession());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const visibleSession =
    ready && battlePokemonId(session) ? applyBuilderDefaults(session) : session;

  useEffect(() => {
    if (!ready || visibleSession === session) {
      return;
    }
    // Commit IV and happiness defaults after render. SetBuilder must not call
    // setSession while it is rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- persist derived builder defaults
    setSessionState(visibleSession);
  }, [ready, session, visibleSession]);

  useEffect(() => {
    if (!ready || visibleSession !== session) {
      return;
    }
    window.sessionStorage.setItem(RANDOMIZER_SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [ready, session, visibleSession]);

  return (
    <RandomizerSessionContext.Provider
      value={{ session: visibleSession, setSession: setSessionState, ready }}
    >
      {children}
    </RandomizerSessionContext.Provider>
  );
}

export function useRandomizerSession(): RandomizerSessionContextValue {
  const value = useContext(RandomizerSessionContext);
  if (!value) {
    throw new Error("useRandomizerSession must be used within RandomizerSessionProvider");
  }
  return value;
}
