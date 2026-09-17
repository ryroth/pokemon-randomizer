export function englishName(
  names: Array<{ name: string; language: { name: string } }> | undefined,
  fallback: string,
): string {
  return names?.find((entry) => entry.language?.name === "en")?.name ?? fallback;
}

export function cleanFlavorText(text: string | undefined): string {
  if (!text) {
    return "";
  }
  return text.replace(/\f/g, " ").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
}

export interface FlavorSource {
  flavor_text: string;
  language: { name: string };
  version?: { name: string };
  version_group?: { name: string };
}

export function uniqueEnglishFlavor(
  entries: FlavorSource[] | undefined,
): Array<{ version: string; text: string }> {
  const seen = new Set<string>();
  const result: Array<{ version: string; text: string }> = [];

  for (const entry of entries ?? []) {
    if (entry.language?.name !== "en") {
      continue;
    }
    const text = cleanFlavorText(entry.flavor_text);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    result.push({
      version: entry.version?.name ?? entry.version_group?.name ?? "unknown",
      text,
    });
  }

  return result;
}
