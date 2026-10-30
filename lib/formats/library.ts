import { isPresetId, listPresets, presetById } from "@/lib/formats/presets";
import {
  MAX_FORMAT_DESCRIPTION_LENGTH,
  MAX_FORMAT_NAME_LENGTH,
  cloneFormat,
  formatRevision,
  type BattleFormat,
} from "@/lib/formats/schema";
import { validateFormat } from "@/lib/formats/validate";
import type { ValidationIssue } from "@/lib/validation/result";

export interface FormatRecord {
  current: BattleFormat;
  /** The format as it was before the latest save. Null until it has been saved twice. */
  previous: BattleFormat | null;
}

export interface FormatLibrary {
  records: FormatRecord[];
  /** Records from a newer schema. A save writes them back unchanged. */
  preserved: unknown[];
}

export interface FormatChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

export type FormatSaveResult =
  | { ok: true; library: FormatLibrary; format: BattleFormat }
  | { ok: false; errors: ValidationIssue[] };

const EDITABLE_FIELDS = [
  "description",
  "structure",
  "teamSize",
  "speciesClause",
  "itemClause",
  "shinyPolicy",
  "typePolicy",
  "statPolicy",
  "statBudget",
  "statMin",
  "statMax",
] as const;

export type EditableFormatField = (typeof EDITABLE_FIELDS)[number];

const FIELD_LABELS: Record<EditableFormatField, string> = {
  description: "Description",
  structure: "Battle structure",
  teamSize: "Team size",
  speciesClause: "Species Clause",
  itemClause: "Item Clause",
  shinyPolicy: "Shiny Pokémon",
  typePolicy: "Typing",
  statPolicy: "Base stats",
  statBudget: "Base-stat budget",
  statMin: "Minimum base stat",
  statMax: "Maximum base stat",
};

export function emptyLibrary(): FormatLibrary {
  return { records: [], preserved: [] };
}

export function listSavedFormats(library: FormatLibrary): BattleFormat[] {
  return library.records.map((record) => cloneFormat(record.current));
}

export function findFormat(library: FormatLibrary, id: string): BattleFormat | undefined {
  return presetById(id) ?? listSavedFormats(library).find((format) => format.id === id);
}

/** A new unsaved copy. The preset object is not modified. */
export function customizeFormat(parent: BattleFormat): BattleFormat {
  const copy = cloneFormat(parent);
  const name = trimName(`${parent.name} custom`);
  return {
    ...copy,
    id: "",
    name,
    description: parent.description,
    audience: "A custom variant of " + parent.name + ".",
    experience: "custom-rules",
    origin: "user",
    parentId: parent.id,
    parentRevision: formatRevision(parent),
    locked: false,
  };
}

/** A permissive generation 9 singles format with species typing and stats. */
export function blankFormat(): BattleFormat {
  const open = presetById("open-lab");
  const base = open ? customizeFormat(open) : customizeFormat(listPresets()[0]!);
  return {
    ...base,
    id: "",
    name: "",
    description: "",
    audience: "A format you are writing from scratch.",
    parentId: null,
    parentRevision: null,
    typePolicy: "species",
    statPolicy: "species",
    statBudget: null,
    shinyPolicy: "allowed",
    speciesClause: true,
    itemClause: false,
    teamSize: 6,
    structure: "singles",
  };
}

export function formatChanges(format: BattleFormat, parent: BattleFormat | undefined): FormatChange[] {
  if (!parent) {
    return [];
  }
  return EDITABLE_FIELDS.flatMap((field) => {
    const from = displayField(parent, field);
    const to = displayField(format, field);
    if (from === to) {
      return [];
    }
    return [{ field, label: FIELD_LABELS[field], from, to }];
  });
}

export function resetFormatField(
  format: BattleFormat,
  parent: BattleFormat,
  field: EditableFormatField,
): BattleFormat {
  const next = cloneFormat(format);
  if (field === "description") {
    next.description = parent.description;
  } else if (field === "structure") {
    next.structure = parent.structure;
  } else if (field === "teamSize") {
    next.teamSize = parent.teamSize;
  } else if (field === "speciesClause") {
    next.speciesClause = parent.speciesClause;
  } else if (field === "itemClause") {
    next.itemClause = parent.itemClause;
  } else if (field === "shinyPolicy") {
    next.shinyPolicy = parent.shinyPolicy;
  } else if (field === "typePolicy") {
    next.typePolicy = parent.typePolicy;
  } else if (field === "statPolicy") {
    next.statPolicy = parent.statPolicy;
    if (next.statPolicy === "species") {
      next.statBudget = null;
    }
  } else if (field === "statBudget") {
    next.statBudget = parent.statBudget;
  } else if (field === "statMin") {
    next.statMin = parent.statMin;
  } else if (field === "statMax") {
    next.statMax = parent.statMax;
  }
  return next;
}

/** Restores the parent's rules and description. The custom name and id stay. */
export function resetFormatToParent(format: BattleFormat, parent: BattleFormat): BattleFormat {
  const fresh = customizeFormat(parent);
  return {
    ...fresh,
    id: format.id,
    name: format.name,
  };
}

export function parentDrift(format: BattleFormat, library: FormatLibrary): string | null {
  if (!format.parentId) {
    return null;
  }
  const parent = findFormat(library, format.parentId);
  if (!parent) {
    return "The original preset is no longer in this app. Your copy was kept as you saved it.";
  }
  if (format.parentRevision && format.parentRevision !== formatRevision(parent)) {
    return `${parent.name} has changed since you saved this copy. Your copy was not rewritten.`;
  }
  return null;
}

export function saveFormat(library: FormatLibrary, draft: BattleFormat): FormatSaveResult {
  const format = cloneFormat({
    ...draft,
    name: trimName(draft.name),
    description: draft.description.trim().replace(/\s+/g, " ").slice(0, MAX_FORMAT_DESCRIPTION_LENGTH),
    origin: "user",
    locked: false,
  });
  if (isPresetId(format.id)) {
    format.id = "";
  }
  const errors = validateFormat(format);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const existing = format.id ? library.records.find((record) => record.current.id === format.id) : undefined;
  const saved = existing ? format : { ...format, id: createFormatId() };
  const records = existing
    ? library.records.map((record) =>
        record.current.id === saved.id
          ? { current: saved, previous: cloneFormat(record.current) }
          : record,
      )
    : [...library.records, { current: saved, previous: null }];
  return { ok: true, library: { records, preserved: library.preserved }, format: cloneFormat(saved) };
}

export function renameFormat(library: FormatLibrary, id: string, name: string): FormatSaveResult {
  const record = library.records.find((entry) => entry.current.id === id);
  if (!record || isPresetId(id)) {
    return {
      ok: false,
      errors: [{ code: "format.missing", field: "name", message: "That format cannot be renamed." }],
    };
  }
  return saveFormat(library, { ...record.current, name });
}

export function duplicateFormat(library: FormatLibrary, id: string): FormatSaveResult {
  const source = findFormat(library, id);
  if (!source) {
    return {
      ok: false,
      errors: [{ code: "format.missing", field: "id", message: "That format is no longer saved." }],
    };
  }
  const copy = customizeFormat(source);
  copy.name = trimName(`Copy of ${source.name}`);
  return saveFormat(library, copy);
}

export function deleteFormat(library: FormatLibrary, id: string): FormatLibrary {
  if (isPresetId(id)) {
    return library;
  }
  return {
    records: library.records.filter((record) => record.current.id !== id),
    preserved: library.preserved,
  };
}

export function restorePreviousFormat(library: FormatLibrary, id: string): FormatSaveResult {
  const record = library.records.find((entry) => entry.current.id === id);
  if (!record?.previous) {
    return {
      ok: false,
      errors: [
        {
          code: "format.previous",
          field: "id",
          message: "There is no earlier save to restore.",
        },
      ],
    };
  }
  const restored = cloneFormat(record.previous);
  const records = library.records.map((entry) =>
    entry.current.id === id ? { current: restored, previous: cloneFormat(record.current) } : entry,
  );
  return { ok: true, library: { records, preserved: library.preserved }, format: restored };
}

function displayField(format: BattleFormat, field: EditableFormatField): string {
  if (field === "speciesClause" || field === "itemClause") {
    return format[field] ? "On" : "Off";
  }
  if (field === "shinyPolicy") {
    return format.shinyPolicy === "allowed" ? "Allowed" : "Not allowed";
  }
  if (field === "typePolicy") {
    return format.typePolicy === "custom" ? "Custom typing" : "Species typing";
  }
  if (field === "statPolicy") {
    return format.statPolicy === "custom" ? "Custom base stats" : "Species base stats";
  }
  if (field === "statBudget") {
    return format.statBudget === null ? "No budget" : String(format.statBudget);
  }
  if (field === "structure") {
    return format.structure === "doubles" ? "Doubles" : "Singles";
  }
  return String(format[field]);
}

function trimName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_FORMAT_NAME_LENGTH);
}

function createFormatId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return `custom-${cryptoApi.randomUUID()}`;
  }
  return `custom-${Date.now().toString(36)}`;
}
