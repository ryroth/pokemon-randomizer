import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { nameImpliesMega } from "@/lib/data/classify";
import type { Catalog } from "@/lib/types/catalog";
import type { PokemonForm } from "@/lib/types/pokemon";

let cachedCatalog: Catalog | undefined;
let cachedStamp: string | undefined;

export function generatedCatalogPath(): string {
  return path.join(process.cwd(), "data", "generated", "catalog.json");
}

function generatedFilePath(name: string): string {
  return path.join(process.cwd(), "data", "generated", name);
}

/** Still pictures the importer found for forms that PokéAPI has no official artwork for. */
interface PokemonArtFile {
  [formId: string]: { artwork?: string; artworkShiny?: string } | undefined;
}

function readOptionalJson<T>(name: string): T | undefined {
  const filePath = generatedFilePath(name);
  if (!existsSync(filePath)) {
    return undefined;
  }
  // JSON.parse cannot prove the shape; the files are written by `npm run import:art`.
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

/** The stored catalog tagged Meganium and Yanmega as Mega because their names contain those letters. */
function repairMegaName(form: PokemonForm): PokemonForm {
  if (form.formType !== "mega" || nameImpliesMega(form.id) || nameImpliesMega(form.pokeApiSlug)) {
    return form;
  }
  return { ...form, formType: "base" };
}

function fileStamp(filePath: string): string {
  return existsSync(filePath) ? String(statSync(filePath).mtimeMs) : "none";
}

/**
 * The generated catalog with the extra pictures from `npm run import:art` applied: official
 * artwork for forms PokéAPI lacks it for, and an icon URL on every item that has one.
 */
export function loadGeneratedCatalog(): Catalog {
  const filePath = generatedCatalogPath();
  if (!existsSync(filePath)) {
    throw new Error(`Generated catalog not found at ${filePath}. Run npm run import:data.`);
  }

  const stamp = [filePath, generatedFilePath("pokemon-art.json"), generatedFilePath("item-icons.json")]
    .map(fileStamp)
    .join("|");
  if (cachedCatalog && cachedStamp === stamp) {
    return cachedCatalog;
  }

  // JSON.parse cannot prove Catalog; integrity tests validate required fields.
  const catalog = JSON.parse(readFileSync(filePath, "utf8")) as Catalog;
  const art = readOptionalJson<PokemonArtFile>("pokemon-art.json") ?? {};
  const icons = readOptionalJson<Record<string, string>>("item-icons.json") ?? {};

  cachedCatalog = {
    ...catalog,
    pokemon: catalog.pokemon.map((form) => {
      const repaired = repairMegaName(form);
      const extra = art[form.id];
      if (!extra) {
        return repaired;
      }
      return {
        ...repaired,
        sprites: {
          ...repaired.sprites,
          artwork: repaired.sprites.artwork ?? extra.artwork ?? null,
          artworkShiny: repaired.sprites.artworkShiny ?? extra.artworkShiny ?? null,
        },
      };
    }),
    items: catalog.items.map((item) => ({ ...item, iconUrl: icons[item.id] ?? null })),
  };
  cachedStamp = stamp;
  return cachedCatalog;
}

export function slimPokemonForClient(forms: readonly PokemonForm[]): PokemonForm[] {
  return forms.map((form) => ({
    ...form,
    dexEntries: form.dexEntries.slice(0, 1),
  }));
}
