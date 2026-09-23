import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { Catalog } from "@/lib/types/catalog";
import type { PokemonForm } from "@/lib/types/pokemon";

let cachedCatalog: Catalog | undefined;
let cachedCatalogMtimeMs: number | undefined;

export function generatedCatalogPath(): string {
  return path.join(process.cwd(), "data", "generated", "catalog.json");
}

export function loadGeneratedCatalog(): Catalog {
  const filePath = generatedCatalogPath();
  if (!existsSync(filePath)) {
    throw new Error(`Generated catalog not found at ${filePath}. Run npm run import:data.`);
  }

  const mtimeMs = statSync(filePath).mtimeMs;
  if (cachedCatalog && cachedCatalogMtimeMs === mtimeMs) {
    return cachedCatalog;
  }

  // JSON.parse cannot prove Catalog; integrity tests validate required fields.
  cachedCatalog = JSON.parse(readFileSync(filePath, "utf8")) as Catalog;
  cachedCatalogMtimeMs = mtimeMs;
  return cachedCatalog;
}

export function slimPokemonForClient(forms: readonly PokemonForm[]): PokemonForm[] {
  return forms.map((form) => ({
    ...form,
    dexEntries: form.dexEntries.slice(0, 1),
  }));
}
