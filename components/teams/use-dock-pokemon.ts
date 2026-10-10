"use client";

import { useEffect, useMemo, useState } from "react";
import { loadDockPokemon, type DockPokemon } from "@/lib/data/dockPokemon";

// Shared by the desktop rail and the mobile sheet so each form is requested once.
const cache = new Map<string, DockPokemon>();

/** Looks up names, types, and sprites for saved forms. Missing entries fill in as they load. */
export function useDockPokemon(ids: readonly string[]): Record<string, DockPokemon> {
  const [, setVersion] = useState(0);
  const key = ids.join("|");
  const wanted = useMemo(() => (key ? key.split("|") : []), [key]);

  useEffect(() => {
    const missing = wanted.filter((id) => !cache.has(id));
    if (missing.length === 0) {
      return;
    }
    loadDockPokemon(missing)
      .then((found) => {
        for (const pokemon of found) {
          cache.set(pokemon.id, pokemon);
        }
        setVersion((version) => version + 1);
      })
      .catch(() => {
        // The roster still lists the set without a sprite.
      });
  }, [wanted]);

  const found: Record<string, DockPokemon> = {};
  for (const id of wanted) {
    const pokemon = cache.get(id);
    if (pokemon) {
      found[id] = pokemon;
    }
  }
  return found;
}
