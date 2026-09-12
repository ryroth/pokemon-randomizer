/**
 * PokéAPI REST helpers for the build-time importer.
 * Phase 1 only defines the contract. Phase 2 performs the full snapshot.
 */
export const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

export interface NamedResource {
  name: string;
  url: string;
}

export function resourceIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match?.[1]) {
    throw new Error(`Could not read a resource id from ${url}`);
  }
  return Number(match[1]);
}
