import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Catalog } from "../../lib/types/catalog";

export const GENERATED_CATALOG_PATH = path.join(
  process.cwd(),
  "data",
  "generated",
  "catalog.json",
);

export async function writeCatalog(catalog: Catalog): Promise<void> {
  await mkdir(path.dirname(GENERATED_CATALOG_PATH), { recursive: true });
  await writeFile(GENERATED_CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}
