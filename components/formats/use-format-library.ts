"use client";

import { useEffect, useState } from "react";
import { FORMAT_STORAGE_KEY } from "@/lib/formats/schema";
import { emptyLibrary, type FormatLibrary } from "@/lib/formats/library";
import { parseFormatLibrary, serializeFormatLibrary } from "@/lib/formats/storage";

/** Saved custom formats. Presets stay in code and are not written here. */
export function useFormatLibrary() {
  const [library, setLibrary] = useState<FormatLibrary>(emptyLibrary());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client hydrate */
    setLibrary(parseFormatLibrary(window.localStorage.getItem(FORMAT_STORAGE_KEY) ?? ""));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function commit(next: FormatLibrary) {
    setLibrary(next);
    window.localStorage.setItem(FORMAT_STORAGE_KEY, serializeFormatLibrary(next));
  }

  return { library, ready, commit };
}
