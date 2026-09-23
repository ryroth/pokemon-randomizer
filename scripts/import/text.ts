export function englishName(
  names: Array<{ name: string; language: { name: string } }> | undefined,
  fallback: string,
): string {
  return names?.find((entry) => entry.language?.name === "en")?.name ?? fallback;
}

/** Collapse in-game control characters and line breaks. Do not paraphrase. */
export function cleanFlavorText(text: string | undefined): string {
  if (!text) {
    return "";
  }
  return text.replace(/\f/g, " ").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
}

export interface FlavorSource {
  flavor_text?: string;
  text?: string;
  language: { name: string };
  version?: { name: string; url?: string };
  version_group?: { name: string; url?: string };
}

function flavorBody(entry: FlavorSource): string {
  return cleanFlavorText(entry.flavor_text ?? entry.text);
}

function flavorVersionOrder(entry: FlavorSource): number {
  const url = entry.version_group?.url ?? entry.version?.url;
  const match = url?.match(/\/(\d+)\/?$/);
  return match?.[1] ? Number(match[1]) : 0;
}

/**
 * Unique English PokéAPI flavor, newest game version first.
 * Ability/move/species entries use `flavor_text`; item entries use `text`.
 */
export function uniqueEnglishFlavor(
  entries: FlavorSource[] | undefined,
): Array<{ version: string; text: string }> {
  const english = (entries ?? [])
    .filter((entry) => entry.language?.name === "en")
    .map((entry) => ({
      version: entry.version?.name ?? entry.version_group?.name ?? "unknown",
      text: flavorBody(entry),
      order: flavorVersionOrder(entry),
    }))
    .filter((entry) => entry.text.length > 0)
    .sort((left, right) => right.order - left.order);

  const seen = new Set<string>();
  const result: Array<{ version: string; text: string }> = [];
  for (const entry of english) {
    if (seen.has(entry.text)) {
      continue;
    }
    seen.add(entry.text);
    result.push({ version: entry.version, text: entry.text });
  }
  return result;
}

export function officialEnglishFlavor(entries: FlavorSource[] | undefined): string {
  return uniqueEnglishFlavor(entries)[0]?.text ?? "";
}

export interface VerboseEffect {
  effect?: string;
  short_effect?: string;
  language: { name: string };
}

function hasNumericMechanics(text: string): boolean {
  return /\d/.test(text);
}

const MAX_MECHANICAL_LENGTH = 400;

function englishVerboseEffect(
  entries: VerboseEffect[] | undefined,
): { effect: string; shortEffect: string } {
  const english = entries?.find((entry) => entry.language?.name === "en");
  return {
    effect: cleanFlavorText(english?.effect),
    shortEffect: cleanFlavorText(english?.short_effect),
  };
}

/**
 * Ability / move / item card text: prefer a source that includes numeric mechanics
 * (percent, multiplier, fraction). PokéAPI effect first, then Showdown battling text,
 * then Pokédex flavor. Do not invent or rewrite numbers.
 */
export function mechanicalDescription(input: {
  effectEntries?: VerboseEffect[];
  showdownShortDesc?: string;
  showdownDesc?: string;
  flavorEntries?: FlavorSource[];
}): string {
  const { effect, shortEffect } = englishVerboseEffect(input.effectEntries);
  const showdownShort = cleanFlavorText(input.showdownShortDesc);
  const showdownLong = cleanFlavorText(input.showdownDesc);
  const flavor = officialEnglishFlavor(input.flavorEntries);
  const numbered = [shortEffect, effect, showdownShort, showdownLong].find(
    (text) =>
      text.length > 0 && text.length <= MAX_MECHANICAL_LENGTH && hasNumericMechanics(text),
  );
  if (numbered) {
    return numbered;
  }
  return [shortEffect, flavor, effect, showdownShort, showdownLong].find((text) => text.length > 0) ?? "";
}
