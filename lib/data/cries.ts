import criesJson from "@/data/generated/cries.json";

const cries = criesJson as Record<string, string>;

/** Official latest cry for a catalog form, from PokéAPI. Null when that form has none. */
export function formCry(formId: string): string | null {
  const url = cries[formId];
  return url && url.length > 0 ? url : null;
}
