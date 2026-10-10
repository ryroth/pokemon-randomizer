"use client";

import { useEffect, useSyncExternalStore } from "react";
import { loadDexEntries } from "@/lib/data/dexTools";
import type { DexEntryGroup } from "@/lib/data/dexVersions";

type EntryStatus = DexEntryGroup[] | "failed";

// One request per species for the whole session. Cards that mount in the same tick share a call.
const cache = new Map<string, EntryStatus>();
const requested = new Set<string>();
const listeners = new Set<() => void>();
let queue: string[] = [];
let flushScheduled = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function flush() {
  flushScheduled = false;
  const ids = queue;
  queue = [];
  if (ids.length === 0) {
    return;
  }
  loadDexEntries(ids)
    .then((found) => {
      for (const id of ids) {
        cache.set(id, found[id] ?? "failed");
      }
    })
    .catch(() => {
      for (const id of ids) {
        cache.set(id, "failed");
      }
    })
    .finally(emit);
}

function request(speciesId: string) {
  if (requested.has(speciesId)) {
    return;
  }
  requested.add(speciesId);
  queue.push(speciesId);
  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(flush);
  }
}

/**
 * Every Pokédex text for one species, oldest generation first. `status` is `loading` until the
 * server answers, and `unavailable` when it cannot, so the caller can fall back to the text it has.
 */
export function useDexEntries(speciesId: string):
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; entries: DexEntryGroup[] } {
  const current = useSyncExternalStore(
    subscribe,
    () => cache.get(speciesId),
    () => undefined,
  );

  useEffect(() => {
    if (!cache.has(speciesId)) {
      request(speciesId);
    }
  }, [speciesId]);

  if (current === undefined) {
    return { status: "loading" };
  }
  if (current === "failed" || current.length === 0) {
    return { status: "unavailable" };
  }
  return { status: "ready", entries: current };
}
