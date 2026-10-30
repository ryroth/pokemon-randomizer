import {
  emptyLibrary,
  type FormatLibrary,
  type FormatRecord,
} from "@/lib/formats/library";
import { FORMAT_SCHEMA_VERSION, type BattleFormat } from "@/lib/formats/schema";
import { validateFormat } from "@/lib/formats/validate";

export function parseFormatLibrary(raw: string): FormatLibrary {
  if (!raw) {
    return emptyLibrary();
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") {
      return emptyLibrary();
    }
    const body = value as { records?: unknown; preserved?: unknown };
    if (!Array.isArray(body.records)) {
      return emptyLibrary();
    }
    const records: FormatRecord[] = [];
    const preserved = Array.isArray(body.preserved) ? [...body.preserved] : [];
    for (const entry of body.records) {
      const record = normalizeRecord(entry);
      if (record) {
        records.push(record);
      } else if (entry && typeof entry === "object") {
        preserved.push(entry);
      }
    }
    return { records, preserved };
  } catch {
    return emptyLibrary();
  }
}

export function serializeFormatLibrary(library: FormatLibrary): string {
  return JSON.stringify({
    schemaVersion: FORMAT_SCHEMA_VERSION,
    records: library.records,
    preserved: library.preserved,
  });
}

function normalizeRecord(value: unknown): FormatRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const entry = value as { current?: unknown; previous?: unknown };
  const current = normalizeFormat(entry.current);
  if (!current || current.locked || current.origin !== "user") {
    return null;
  }
  const previous = entry.previous == null ? null : normalizeFormat(entry.previous);
  return { current, previous };
}

function normalizeFormat(value: unknown): BattleFormat | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const format = value as BattleFormat;
  if (format.schemaVersion !== FORMAT_SCHEMA_VERSION) {
    return null;
  }
  if (validateFormat(format).length > 0) {
    return null;
  }
  return {
    ...format,
    ruleset: [...format.ruleset],
    banlist: [...format.banlist],
    clauses: [...format.clauses],
    support: {
      bringTeam: true,
      teamValidation: true,
      damagePreview: true,
      aiBattle: false,
      localMultiplayer: false,
      onlineMultiplayer: false,
      replay: false,
    },
  };
}
