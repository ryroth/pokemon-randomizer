import generaJson from "@/data/generated/genera.json";

const genera = generaJson as Record<string, string>;

/** English PokéAPI genus for a catalog species. Empty when that species has no genus text. */
export function speciesGenus(speciesId: string): string | null {
  const genus = genera[speciesId];
  return genus && genus.length > 0 ? genus : null;
}
