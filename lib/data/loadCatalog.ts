import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Catalog } from "@/lib/types/catalog";

export function generatedCatalogPath(): string {
  return path.join(process.cwd(), "data", "generated", "catalog.json");
}

export function loadGeneratedCatalog(): Catalog {
  const filePath = generatedCatalogPath();
  if (!existsSync(filePath)) {
    throw new Error(`Generated catalog not found at ${filePath}. Run npm run import:data.`);
  }

  // JSON.parse cannot prove Catalog; integrity tests validate required fields.
  return JSON.parse(readFileSync(filePath, "utf8")) as Catalog;
}
